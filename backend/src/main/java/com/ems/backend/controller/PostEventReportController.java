package com.ems.backend.controller;

import com.ems.backend.dto.PostEventReportDTO;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.AttendanceRecord;
import com.ems.backend.entity.EventPhoto;
import com.ems.backend.entity.PostEventReport;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AdminDepartment;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ReportStatus;
import com.ems.backend.exception.BadRequestException;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.AttendanceRecordRepository;
import com.ems.backend.repository.EventPhotoRepository;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.PostEventReportRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.AttendanceExcelParserService;
import com.ems.backend.service.AuditLogService;
import com.ems.backend.service.FileStorageService;
import com.ems.backend.service.email.EmailService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class PostEventReportController {

    private final PostEventReportRepository reportRepository;
    private final EventRepository eventRepository;
    private final EventPhotoRepository eventPhotoRepository;
    private final AttendanceRecordRepository attendanceRecordRepository;
    private final FileStorageService fileStorageService;
    private final AttendanceExcelParserService excelParserService;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    private static final String AUDIT_ACTION_REPORT_SUBMITTED = "REPORT_SUBMITTED";
    private static final String AUDIT_ACTION_REPORT_APPROVED = "REPORT_APPROVED";
    private static final String AUDIT_ACTION_REPORT_REJECTED = "REPORT_REJECTED";
    private static final String AUDIT_ACTION_CERT_EXPORT_DOWNLOADED = "CERT_EXPORT_DOWNLOADED";

    @GetMapping("/{eventID}")
    public ResponseEntity<Response<PostEventReportDTO>> getReportByEvent(@PathVariable Long eventID) {
        PostEventReport report = reportRepository.findByEventID(eventID)
                .orElseThrow(() -> new NotFoundException("Report not found for event ID: " + eventID));

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report retrieved successfully")
                .data(dto)
                .build());
    }

    @PostMapping("/{eventID}/submit")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<PostEventReportDTO>> submitReport(
            @PathVariable Long eventID,
            @RequestParam(value = "photos", required = false) MultipartFile[] photos,
            @RequestParam(value = "feedbackFile", required = false) MultipartFile feedbackFile,
            @RequestParam(value = "attendanceExcel", required = false) MultipartFile attendanceExcel,
            @RequestParam(value = "organizerCount", required = false) Integer organizerCount,
            @RequestParam(value = "attendeeCount", required = false) Integer attendeeCount,
            @RequestParam(value = "walkInCount", required = false) Integer walkInCount,
            @RequestParam(value = "iuyouthArticleURL", required = false) String iuyouthArticleURL,
            @RequestParam(value = "socialMediaURL", required = false) String socialMediaURL,
            @RequestParam(value = "driveLink", required = false) String driveLink,
            @RequestParam(value = "totalBudget", required = false) String totalBudget,
            @RequestParam(value = "feedbackCount", required = false) Integer feedbackCount,
            @RequestParam(value = "submitterName", required = false) String submitterName,
            @RequestParam(value = "submitterRole", required = false) String submitterRole) {

        PostEventReport report = reportRepository.findByEventID(eventID)
                .orElseThrow(() -> new NotFoundException("Report not found for event ID: " + eventID));

        if (report.getStatus() != ReportStatus.NOT_SUBMITTED) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Report has already been submitted")
                    .build());
        }

        var event = eventRepository.findById(eventID)
                .orElseThrow(() -> new NotFoundException("Event not found"));

        // Validate photo count
        int photoCount = photos != null ? photos.length : 0;
        int requiredPhotos = event.getOrganizationType() == OrganizationType.YOUTH_UNION ? 5 : 10;
        if (photoCount != requiredPhotos) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Photo count validation failed. " + event.getOrganizationType() +
                            " requires exactly " + requiredPhotos + " photos, but got " + photoCount)
                    .build());
        }

        // Validate feedback threshold for Student Association
        if (event.getOrganizationType() == OrganizationType.STUDENT_ASSOCIATION
                && feedbackCount != null && attendeeCount != null) {
            int minFeedback = (int) Math.ceil(attendeeCount * 0.5);
            if (feedbackCount < minFeedback) {
                return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                        .statusCode(400)
                        .message("Feedback count insufficient. Required: at least " + minFeedback +
                                " (50% of " + attendeeCount + " attendees), got " + feedbackCount)
                        .build());
            }
        }

        // Store photos with naming convention
        List<EventPhoto> savedPhotos = new ArrayList<>();
        if (photos != null && photos.length > 0) {
            // Generate proper filenames based on org type
            String eventCode = "EVT" + eventID;
            String eventName = event.getTitle() != null ? event.getTitle().replaceAll("[^a-zA-Z0-9]", "_") : "Event";

            // Prepare renamed files
            List<MultipartFile> renamedFiles = new ArrayList<>();
            for (int i = 0; i < photos.length; i++) {
                int photoIndex = i + 1;
                String extension = getFileExtension(photos[i].getOriginalFilename());
                String newFilename;

                if (event.getOrganizationType() == OrganizationType.YOUTH_UNION) {
                    // Youth Union: MãHĐ_TênHĐ_01 through _05 (2-digit padded)
                    newFilename = eventCode + "_" + eventName + "_" + String.format("%02d", photoIndex) + extension;
                } else {
                    // Student Association: MãHĐ_TênHĐ_1 through _10 (no padding)
                    newFilename = eventCode + "_" + eventName + "_" + photoIndex + extension;
                }

                renamedFiles.add(new RenamedMultipartFile(photos[i], newFilename));
            }

            String photosJson = fileStorageService.storeFilesInFolder(
                    renamedFiles.toArray(new MultipartFile[0]), "reports/" + eventID + "/photos");
            // Parse JSON to get file paths and create photo records
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, String>> photoFiles = mapper.readValue(photosJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));

                for (int i = 0; i < photoFiles.size(); i++) {
                    java.util.Map<String, String> photoFile = photoFiles.get(i);
                    EventPhoto photo = EventPhoto.builder()
                            .reportID(report.getReportID())
                            .fileID(photoFile.get("path"))
                            .orderIndex(i)
                            .label("Photo " + (i + 1))
                            .build();
                    savedPhotos.add(eventPhotoRepository.save(photo));
                }
            } catch (Exception e) {
                // Log error but continue
            }
        }

        // Store feedback file
        if (feedbackFile != null && !feedbackFile.isEmpty()) {
            String feedbackJson = fileStorageService.storeFilesInFolder(
                    new MultipartFile[]{feedbackFile}, "reports/" + eventID + "/feedback");
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, String>> feedbackFiles = mapper.readValue(feedbackJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));
                if (!feedbackFiles.isEmpty()) {
                    report.setFeedbackFileID(feedbackFiles.get(0).get("path"));
                }
            } catch (Exception e) {
                // Log error
            }
        }

        // Parse attendance Excel and save records
        List<AttendanceRecord> attendanceRecords = new ArrayList<>();
        if (attendanceExcel != null && !attendanceExcel.isEmpty()) {
            try {
                attendanceRecords = excelParserService.parseAttendanceExcel(
                        attendanceExcel,
                        eventID,
                        report.getReportID(),
                        event.getOrganizationType()
                );
                attendanceRecordRepository.saveAll(attendanceRecords);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                        .statusCode(400)
                        .message("Failed to parse attendance Excel: " + e.getMessage())
                        .build());
            }
        }

        // Update report
        report.setSubmitterEmail(event.getOrganizer().getEmail());
        if (submitterName != null) report.setSubmitterName(submitterName);
        if (submitterRole != null) report.setSubmitterRole(submitterRole);
        if (organizerCount != null) report.setOrganizerCount(organizerCount);
        if (attendeeCount != null) report.setAttendeeCount(attendeeCount);
        if (walkInCount != null) report.setWalkInCount(walkInCount);
        if (iuyouthArticleURL != null) report.setIuyouthArticleURL(iuyouthArticleURL);
        if (socialMediaURL != null) report.setSocialMediaURL(socialMediaURL);
        if (driveLink != null) report.setDriveLink(driveLink);
        if (totalBudget != null) {
            try {
                report.setTotalBudget(new java.math.BigDecimal(totalBudget));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        if (feedbackCount != null) report.setFeedbackCount(feedbackCount);
        if (walkInCount != null) report.setWalkInCount(walkInCount);

        // Check if late
        boolean isLate = LocalDateTime.now().isAfter(report.getDeadlineAt());
        report.setIsLate(isLate);
        report.setStatus(isLate ? ReportStatus.LATE_SUBMITTED : ReportStatus.SUBMITTED);
        report.setSubmittedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());

        reportRepository.save(report);

        // Audit log
        auditLogService.log(
                event.getOrganizer().getUserID(),
                event.getOrganizer().getEmail(),
                AUDIT_ACTION_REPORT_SUBMITTED,
                "PostEventReport",
                report.getReportID(),
                "SUCCESS",
                null, null
        );

        // Send confirmation email
        emailService.sendNotification(
                event.getOrganizer().getEmail(),
                "Report Submitted Successfully",
                "Your post-event report for '" + event.getTitle() + "' has been submitted successfully."
        );

        // Audit log
        auditLogService.log(
                event.getOrganizer().getUserID(),
                event.getOrganizer().getEmail(),
                AUDIT_ACTION_REPORT_SUBMITTED,
                "PostEventReport",
                report.getReportID(),
                "SUCCESS",
                null, null
        );

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report submitted successfully")
                .data(dto)
                .build());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<List<PostEventReportDTO>>> getAllReports(
            @RequestParam(required = false) ReportStatus status,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        OrganizationType orgType = resolveOrgTypeForAdmin(userDetails);
        if (orgType == null) {
            return ResponseEntity.ok(Response.<List<PostEventReportDTO>>builder()
                    .statusCode(200)
                    .message("Reports retrieved successfully")
                    .data(List.of())
                    .build());
        }

        List<PostEventReport> reports;
        if (status != null) {
            reports = reportRepository.findByEventTypeAndStatus(orgType, status);
        } else {
            reports = reportRepository.findByEventType(orgType);
        }

        List<PostEventReportDTO> dtos = reports.stream()
                .map(this::convertToDTO)
                .toList();

        return ResponseEntity.ok(Response.<List<PostEventReportDTO>>builder()
                .statusCode(200)
                .message("Reports retrieved successfully")
                .data(dtos)
                .build());
    }

    @GetMapping("/detail/{reportID}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<PostEventReportDTO>> getReportByReportID(@PathVariable Long reportID) {
        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found: " + reportID));
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report retrieved")
                .data(convertToDTO(report))
                .build());
    }

    private OrganizationType resolveOrgTypeForAdmin(CustomUserDetails userDetails) {
        if (userDetails == null) return null;
        User user = userDetails.getUser();
        if (!(user instanceof Administrator admin)) return null;
        if (admin.getDepartment() == null) return null;
        return switch (admin.getDepartment()) {
            case YOUTH_UNION -> OrganizationType.YOUTH_UNION;
            case STUDENT_ASSOCIATION -> OrganizationType.STUDENT_ASSOCIATION;
            default -> null;
        };
    }

    @PostMapping("/{reportID}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<PostEventReportDTO>> approveReport(
            @PathVariable Long reportID,
            @RequestParam(required = false) Long adminID,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportID));

        OrganizationType adminOrgType = resolveOrgTypeForAdmin(userDetails);
        if (adminOrgType == null || adminOrgType != report.getEventType()) {
            return ResponseEntity.status(403).body(Response.<PostEventReportDTO>builder()
                    .statusCode(403)
                    .message("You are not authorized to approve reports for this organization type")
                    .build());
        }

        if (report.getStatus() != ReportStatus.SUBMITTED && report.getStatus() != ReportStatus.LATE_SUBMITTED) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Report cannot be approved in its current status")
                    .build());
        }

        report.setStatus(ReportStatus.APPROVED);
        report.setApprovedAt(LocalDateTime.now());
        report.setApprovedBy(adminID);
        report.setUpdatedAt(LocalDateTime.now());

        reportRepository.save(report);

        // Send approval email
        var event = eventRepository.findById(report.getEventID()).orElse(null);
        if (event != null) {
            emailService.sendNotification(
                    event.getOrganizer().getEmail(),
                    "Report Approved!",
                    "Your post-event report for '" + event.getTitle() + "' has been approved!"
            );
        }

        // Audit log
        auditLogService.log(
                adminID,
                "admin@ems.com",
                AUDIT_ACTION_REPORT_APPROVED,
                "PostEventReport",
                reportID,
                "SUCCESS",
                null, null
        );

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report approved successfully")
                .data(dto)
                .build());
    }

    @PostMapping("/{reportID}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<PostEventReportDTO>> rejectReport(
            @PathVariable Long reportID,
            @RequestParam String reason,
            @RequestParam(required = false) Long adminID,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportID));

        OrganizationType adminOrgType = resolveOrgTypeForAdmin(userDetails);
        if (adminOrgType == null || adminOrgType != report.getEventType()) {
            return ResponseEntity.status(403).body(Response.<PostEventReportDTO>builder()
                    .statusCode(403)
                    .message("You are not authorized to reject reports for this organization type")
                    .build());
        }

        if (report.getStatus() != ReportStatus.SUBMITTED && report.getStatus() != ReportStatus.LATE_SUBMITTED) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Report cannot be rejected in its current status")
                    .build());
        }

        // Store previous rejection reason before updating
        String previousReason = report.getRejectionReason();

        report.setStatus(ReportStatus.REJECTED);
        report.setRejectionReason(reason);
        report.setPreviousRejectionReason(previousReason);
        report.setUpdatedAt(LocalDateTime.now());

        reportRepository.save(report);

        // Send rejection email
        var event = eventRepository.findById(report.getEventID()).orElse(null);
        if (event != null) {
            emailService.sendNotification(
                    event.getOrganizer().getEmail(),
                    "Report Rejected",
                    "Your post-event report for '" + event.getTitle() + "' has been rejected. Reason: " + reason
            );
        }

        // Audit log
        auditLogService.log(
                adminID,
                "admin@ems.com",
                AUDIT_ACTION_REPORT_REJECTED,
                "PostEventReport",
                reportID,
                "SUCCESS",
                null, null
        );

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report rejected")
                .data(dto)
                .build());
    }

    @PostMapping("/{reportID}/resubmit")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<PostEventReportDTO>> resubmitReport(
            @PathVariable Long reportID,
            @RequestParam(value = "photos", required = false) MultipartFile[] photos,
            @RequestParam(value = "feedbackFile", required = false) MultipartFile feedbackFile,
            @RequestParam(value = "attendanceExcel", required = false) MultipartFile attendanceExcel,
            @RequestParam(value = "organizerCount", required = false) Integer organizerCount,
            @RequestParam(value = "attendeeCount", required = false) Integer attendeeCount,
            @RequestParam(value = "walkInCount", required = false) Integer walkInCount,
            @RequestParam(value = "iuyouthArticleURL", required = false) String iuyouthArticleURL,
            @RequestParam(value = "socialMediaURL", required = false) String socialMediaURL,
            @RequestParam(value = "driveLink", required = false) String driveLink,
            @RequestParam(value = "totalBudget", required = false) String totalBudget,
            @RequestParam(value = "feedbackCount", required = false) Integer feedbackCount,
            @RequestParam(value = "submitterName", required = false) String submitterName,
            @RequestParam(value = "submitterRole", required = false) String submitterRole,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportID));

        // Ownership check: only the event's organizer may resubmit
        var event = eventRepository.findById(report.getEventID())
                .orElseThrow(() -> new NotFoundException("Event not found"));
        Long authenticatedUserID = userDetails.getUser().getUserID();
        if (!event.getOrganizer().getUserID().equals(authenticatedUserID)) {
            return ResponseEntity.status(403).body(Response.<PostEventReportDTO>builder()
                    .statusCode(403)
                    .message("You are not authorized to resubmit this report")
                    .build());
        }

        if (report.getStatus() != ReportStatus.REJECTED) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Report can only be resubmitted after rejection")
                    .build());
        }

        // Store photos if provided and certExportLocked is false
        if (photos != null && photos.length > 0 && !Boolean.TRUE.equals(report.getCertExportLocked())) {
            // Delete old photos
            eventPhotoRepository.deleteByReportID(report.getReportID());

            // Generate proper filenames based on org type
            String eventCode = "EVT" + report.getEventID();
            String eventName = event.getTitle() != null ? event.getTitle().replaceAll("[^a-zA-Z0-9]", "_") : "Event";

            List<MultipartFile> renamedFiles = new ArrayList<>();
            for (int i = 0; i < photos.length; i++) {
                int photoIndex = i + 1;
                String extension = getFileExtension(photos[i].getOriginalFilename());
                String newFilename;

                if (event.getOrganizationType() == OrganizationType.YOUTH_UNION) {
                    newFilename = eventCode + "_" + eventName + "_" + String.format("%02d", photoIndex) + extension;
                } else {
                    newFilename = eventCode + "_" + eventName + "_" + photoIndex + extension;
                }

                renamedFiles.add(new RenamedMultipartFile(photos[i], newFilename));
            }

            try {
                String photosJson = fileStorageService.storeFilesInFolder(
                        renamedFiles.toArray(new MultipartFile[0]), "reports/" + report.getEventID() + "/photos");

                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, String>> photoFiles = mapper.readValue(photosJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));

                for (int i = 0; i < photoFiles.size(); i++) {
                    java.util.Map<String, String> photoFile = photoFiles.get(i);
                    EventPhoto photo = EventPhoto.builder()
                            .reportID(report.getReportID())
                            .fileID(photoFile.get("path"))
                            .orderIndex(i)
                            .label("Photo " + (i + 1))
                            .build();
                    eventPhotoRepository.save(photo);
                }
            } catch (Exception e) {
                // Log error but continue
            }
        }

        // Update feedback file if provided and certExportLocked is false
        if (feedbackFile != null && !feedbackFile.isEmpty() && !Boolean.TRUE.equals(report.getCertExportLocked())) {
            try {
                String feedbackJson = fileStorageService.storeFilesInFolder(
                        new MultipartFile[]{feedbackFile}, "reports/" + report.getEventID() + "/feedback");
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, String>> feedbackFiles = mapper.readValue(feedbackJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));
                if (!feedbackFiles.isEmpty()) {
                    report.setFeedbackFileID(feedbackFiles.get(0).get("path"));
                }
            } catch (Exception e) {
                // Log error
            }
        }

        // Re-parse attendance Excel if provided and certExportLocked is false
        if (attendanceExcel != null && !attendanceExcel.isEmpty() && !Boolean.TRUE.equals(report.getCertExportLocked())) {
            try {
                // Delete old attendance records
                attendanceRecordRepository.deleteByReportID(report.getReportID());

                List<AttendanceRecord> attendanceRecords = excelParserService.parseAttendanceExcel(
                        attendanceExcel,
                        report.getEventID(),
                        report.getReportID(),
                        event.getOrganizationType()
                );
                attendanceRecordRepository.saveAll(attendanceRecords);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                        .statusCode(400)
                        .message("Failed to parse attendance Excel: " + e.getMessage())
                        .build());
            }
        }

        // Update report fields
        if (organizerCount != null) report.setOrganizerCount(organizerCount);
        if (attendeeCount != null) report.setAttendeeCount(attendeeCount);
        if (walkInCount != null) report.setWalkInCount(walkInCount);
        if (iuyouthArticleURL != null) report.setIuyouthArticleURL(iuyouthArticleURL);
        if (socialMediaURL != null) report.setSocialMediaURL(socialMediaURL);
        if (driveLink != null) report.setDriveLink(driveLink);
        if (totalBudget != null) {
            try {
                report.setTotalBudget(new java.math.BigDecimal(totalBudget));
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
        if (feedbackCount != null) report.setFeedbackCount(feedbackCount);
        if (submitterName != null) report.setSubmitterName(submitterName);
        if (submitterRole != null) report.setSubmitterRole(submitterRole);

        // Reset status - preserve previous rejection reason
        boolean isLate = LocalDateTime.now().isAfter(report.getDeadlineAt());
        report.setIsLate(isLate);
        report.setStatus(isLate ? ReportStatus.LATE_SUBMITTED : ReportStatus.SUBMITTED);
        report.setSubmittedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        // Clear current rejection reason but preserve in previousRejectionReason (already set in reject)
        report.setRejectionReason(null);

        reportRepository.save(report);

        // Send confirmation email
        emailService.sendNotification(
                event.getOrganizer().getEmail(),
                "Report Resubmitted Successfully",
                "Your post-event report for '" + event.getTitle() + "' has been resubmitted successfully."
        );

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Report resubmitted successfully")
                .data(dto)
                .build());
    }

    @PostMapping("/{reportID}/upload-cert-template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<PostEventReportDTO>> uploadCertTemplate(
            @PathVariable Long reportID,
            @RequestParam("certTemplate") MultipartFile certTemplate,
            @RequestParam(required = false) Long adminID) {

        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportID));

        if (report.getStatus() != ReportStatus.APPROVED) {
            return ResponseEntity.badRequest().body(Response.<PostEventReportDTO>builder()
                    .statusCode(400)
                    .message("Report must be approved before uploading cert template")
                    .build());
        }

        // Store cert template file
        if (certTemplate != null && !certTemplate.isEmpty()) {
            try {
                String certJson = fileStorageService.storeFilesInFolder(
                        new MultipartFile[]{certTemplate}, "reports/" + reportID + "/cert-templates");
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                List<java.util.Map<String, String>> certFiles = mapper.readValue(certJson,
                        mapper.getTypeFactory().constructCollectionType(List.class, java.util.Map.class));
                if (!certFiles.isEmpty()) {
                    report.setCertTemplateFileID(certFiles.get(0).get("path"));
                }
            } catch (Exception e) {
                // Log error
            }
        }

        // Lock cert export and set status to CERT_TEMPLATE_PENDING
        report.setCertExportLocked(true);
        report.setStatus(ReportStatus.CERT_TEMPLATE_PENDING);
        report.setUpdatedAt(LocalDateTime.now());

        reportRepository.save(report);

        // Send notification to organizer
        var event = eventRepository.findById(report.getEventID()).orElse(null);
        if (event != null) {
            emailService.sendNotification(
                    event.getOrganizer().getEmail(),
                    "Certificate Template Ready",
                    "Your certificate template for '" + event.getTitle() + "' is ready. Please download and fill in student information."
            );
        }

        PostEventReportDTO dto = convertToDTO(report);
        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(200)
                .message("Cert template uploaded successfully")
                .data(dto)
                .build());
    }

    @GetMapping("/{reportID}/download-cert-template")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<String>> downloadCertTemplate(
            @PathVariable Long reportID,
            @RequestParam(required = false) Long userID,
            @RequestParam(required = false) String userEmail) {

        PostEventReport report = reportRepository.findById(reportID)
                .orElseThrow(() -> new NotFoundException("Report not found with ID: " + reportID));

        if (report.getStatus() != ReportStatus.APPROVED && report.getStatus() != ReportStatus.CERT_TEMPLATE_PENDING) {
            return ResponseEntity.badRequest().body(Response.<String>builder()
                    .statusCode(400)
                    .message("Certificate template can only be downloaded for approved reports")
                    .build());
        }

        // Lock cert export after first download
        if (!Boolean.TRUE.equals(report.getCertExportLocked())) {
            report.setCertExportLocked(true);
            reportRepository.save(report);
        }

        // Audit log
        auditLogService.log(
                userID,
                userEmail,
                AUDIT_ACTION_CERT_EXPORT_DOWNLOADED,
                "PostEventReport",
                reportID,
                "SUCCESS",
                null, null
        );

        // Return a placeholder URL - actual template generation would need implementation
        return ResponseEntity.ok(Response.<String>builder()
                .statusCode(200)
                .message("Certificate template download initiated")
                .data("/api/uploads/cert-templates/template_" + report.getEventID() + ".xlsx")
                .build());
    }

    /**
     * TEST ONLY — SUPER_ADMIN restricted.
     * Marks the event COMPLETED and seeds a PostEventReport so the full
     * report pipeline (submit → approve/reject → cert template) can be
     * tested without running through the 3-tier event-update approval flow.
     * Idempotent: returns the existing report if one already exists.
     */
    @PostMapping("/test/seed/{eventID}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Response<PostEventReportDTO>> seedReportForTesting(@PathVariable Long eventID) {
        var event = eventRepository.findById(eventID)
                .orElseThrow(() -> new NotFoundException("Event not found with ID: " + eventID));

        var existing = reportRepository.findByEventID(eventID);
        if (existing.isPresent()) {
            return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                    .statusCode(200)
                    .message("Report already exists for event " + eventID + " — returning existing record")
                    .data(convertToDTO(existing.get()))
                    .build());
        }

        event.setStatus(EventStatus.COMPLETED);
        event.setUpdatedAt(LocalDateTime.now());
        eventRepository.save(event);

        LocalTime endTime = event.getEndTime() != null ? event.getEndTime() : LocalTime.of(23, 59);
        LocalDateTime eventEndDateTime = LocalDateTime.of(event.getEventDate(), endTime);
        int deadlineDays = event.getOrganizationType() == OrganizationType.YOUTH_UNION ? 14 : 7;

        PostEventReport report = PostEventReport.builder()
                .eventID(event.getEventID())
                .eventType(event.getOrganizationType())
                .affiliatedOrg(event.getOrganizer() != null ? event.getOrganizer().getOrganizationName() : null)
                .status(ReportStatus.NOT_SUBMITTED)
                .deadlineAt(eventEndDateTime.plusDays(deadlineDays))
                .isLate(false)
                .build();

        PostEventReport saved = reportRepository.save(report);

        return ResponseEntity.ok(Response.<PostEventReportDTO>builder()
                .statusCode(201)
                .message("Test seed complete. Event " + eventID + " marked COMPLETED. "
                        + "Report deadline: " + deadlineDays + " days from event end.")
                .data(convertToDTO(saved))
                .build());
    }

    private PostEventReportDTO convertToDTO(PostEventReport report) {
        List<EventPhoto> photos = eventPhotoRepository.findByReportIDOrderByOrderIndexAsc(report.getReportID());
        List<AttendanceRecord> attendance = attendanceRecordRepository.findByReportID(report.getReportID());

        // Filter walk-in attendees only
        List<AttendanceRecord> walkInRecords = attendance.stream()
                .filter(r -> r.getAttendanceType() == com.ems.backend.enums.AttendanceType.WALK_IN)
                .toList();

        return PostEventReportDTO.builder()
                .reportID(report.getReportID())
                .eventID(report.getEventID())
                .eventType(report.getEventType())
                .affiliatedOrg(report.getAffiliatedOrg())
                .submitterEmail(report.getSubmitterEmail())
                .submitterName(report.getSubmitterName())
                .submitterRole(report.getSubmitterRole())
                .organizerCount(report.getOrganizerCount())
                .attendeeCount(report.getAttendeeCount())
                .walkInCount(report.getWalkInCount())
                .iuyouthArticleURL(report.getIuyouthArticleURL())
                .socialMediaURL(report.getSocialMediaURL())
                .driveLink(report.getDriveLink())
                .totalBudget(report.getTotalBudget())
                .feedbackFileID(report.getFeedbackFileID())
                .feedbackCount(report.getFeedbackCount())
                .status(report.getStatus())
                .submittedAt(report.getSubmittedAt())
                .deadlineAt(report.getDeadlineAt())
                .isLate(report.getIsLate())
                .approvedAt(report.getApprovedAt())
                .approvedBy(report.getApprovedBy())
                .rejectionReason(report.getRejectionReason())
                .previousRejectionReason(report.getPreviousRejectionReason())
                .certExportLocked(report.getCertExportLocked())
                .certTemplateFileID(report.getCertTemplateFileID())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .photos(photos.stream().map(p -> PostEventReportDTO.PhotoDTO.builder()
                        .photoID(p.getPhotoID())
                        .fileID(p.getFileID())
                        .label(p.getLabel())
                        .orderIndex(p.getOrderIndex())
                        .build()).toList())
                .walkInAttendees(walkInRecords.stream()
                        .map(r -> PostEventReportDTO.AttendanceDTO.builder()
                                .recordID(r.getAttendanceID())
                                .studentID(r.getMssv())
                                .fullName(r.getFullName())
                                .className(r.getFaculty())
                                .attendanceType(r.getAttendanceType() != null ? r.getAttendanceType().name() : null)
                                .build()).toList())
                .attendeeCountTotal(attendance.size())
                .certEligibleCount((int) attendance.stream().filter(AttendanceRecord::getCertEligible).count())
                .build();
    }

    // Helper method to get file extension
    private String getFileExtension(String filename) {
        if (filename == null) return "";
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : "";
    }

    // Helper class to rename files during upload
    private static class RenamedMultipartFile implements MultipartFile {
        private final MultipartFile original;
        private final String filename;

        public RenamedMultipartFile(MultipartFile original, String filename) {
            this.original = original;
            this.filename = filename;
        }

        @Override
        public String getName() {
            return original.getName();
        }

        @Override
        public String getOriginalFilename() {
            return filename;
        }

        @Override
        public String getContentType() {
            return original.getContentType();
        }

        @Override
        public boolean isEmpty() {
            return original.isEmpty();
        }

        @Override
        public long getSize() {
            return original.getSize();
        }

        @Override
        public byte[] getBytes() throws java.io.IOException {
            return original.getBytes();
        }

        @Override
        public java.io.InputStream getInputStream() throws java.io.IOException {
            return original.getInputStream();
        }

        @Override
        public void transferTo(java.io.File dest) throws java.io.IOException, java.lang.IllegalStateException {
            original.transferTo(dest);
        }

        @Override
        public void transferTo(java.nio.file.Path dest) throws java.io.IOException, java.lang.IllegalStateException {
            original.transferTo(dest);
        }
    }
}
