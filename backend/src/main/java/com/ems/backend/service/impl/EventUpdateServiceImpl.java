package com.ems.backend.service.impl;

import com.ems.backend.dto.EventUpdateRequestDTO;
import com.ems.backend.entity.*;
import com.ems.backend.enums.*;
import com.ems.backend.exception.ForbiddenException;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.*;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.*;
import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventUpdateServiceImpl implements EventUpdateRequestService {

    private final EventUpdateRequestRepository requestRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final PostEventReportRepository postEventReportRepository;
    private final RegistrationService registrationService;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final EventUpdateApprovalService updateApprovalService;

    @Override
    @Transactional
    public EventUpdateRequestDTO submitUpdateRequest(Long eventID, EventUpdateRequestDTO dto, MultipartFile[] files, Long organizerID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new NotFoundException("Event not found with ID: " + eventID));

        User user = userRepository.findById(organizerID)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + organizerID));
        if (!(user instanceof EventOrganizer organizer)) {
            throw new IllegalStateException("User is not an event organizer");
        }
        if (!event.getOrganizer().getUserID().equals(organizer.getUserID())) {
            throw new IllegalStateException("Organizer is not allowed to update this event");
        }

        int currentRegistrations = event.getCurrentRegistrations() == null
                ? 0
                : event.getCurrentRegistrations();

        if (dto.getUpdatedCapacity() != null && dto.getUpdatedCapacity() < currentRegistrations) {
            throw new IllegalStateException("Updated capacity cannot be less than current registrations");
        }

        String attachmentsJson = fileStorageService.storeFiles(files);

        EventUpdateRequest request = EventUpdateRequest.builder()
                .event(event)
                .requestedBy(organizer)
                .updatedTitle(dto.getUpdatedTitle())
                .updatedDescription(dto.getUpdatedDescription())
                .updatedDate(dto.getUpdatedDate())
                .updatedStartTime(dto.getUpdatedStartTime())
                .updatedEndTime(dto.getUpdatedEndTime())
                .updatedVenue(dto.getUpdatedVenue())
                .updatedCapacity(dto.getUpdatedCapacity())
                .updatedOrganizationType(dto.getUpdatedOrganizationType())
                .updatedStatus(dto.getUpdatedStatus())
                .updateReason(dto.getUpdateReason())
                .attachmentsJson(attachmentsJson)
                .organizationType(event.getOrganizationType())
                .status(UpdateRequestStatus.PENDING_L1)
                .build();

        EventUpdateRequest saved = requestRepository.save(request);
        return convertToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventUpdateRequestDTO> getPendingRequests() {
        return requestRepository.findByStatus(UpdateRequestStatus.PENDING_L1)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventUpdateRequestDTO> getPendingRequestsForAdmin(Administrator admin) {
        if (admin.getDepartment() == null) {
            throw new ForbiddenException("Administrator has no department assigned.");
        }
        List<EventUpdateRequest> requests = switch (admin.getDepartment()) {
            case YOUTH_UNION -> requestRepository.findByStatusAndOrganizationType(
                    UpdateRequestStatus.PENDING_L1, OrganizationType.YOUTH_UNION);
            case STUDENT_ASSOCIATION -> requestRepository.findByStatusAndOrganizationType(
                    UpdateRequestStatus.PENDING_L1, OrganizationType.STUDENT_ASSOCIATION);
            case FACULTY -> requestRepository.findByStatus(UpdateRequestStatus.PENDING_L2);
            case RECTOR -> requestRepository.findByStatus(UpdateRequestStatus.PENDING_L3);
        };
        return requests.stream().map(this::convertToDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EventUpdateRequestDTO getById(Long requestID) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));
        return convertToDTO(request);
    }

    @Override
    @Transactional
    public void approveRequest(Long requestID, Long adminID, boolean notify) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));

        Administrator admin = resolveAdmin(adminID);
        UpdateRequestStatus required = getRequiredStatusForAdmin(admin, request.getOrganizationType());

        if (request.getStatus() != required) {
            throw new ForbiddenException("You are not authorized to act on this request at its current stage.");
        }

        ApprovalStage stage = getApprovalStage(required);
        updateApprovalService.recordDecision(request, stage, ApprovalStatus.APPROVED, admin, null);

        UpdateRequestStatus nextStatus = getNextStatus(request.getStatus());
        request.setStatus(nextStatus);

        if (nextStatus == UpdateRequestStatus.APPROVED) {
            // Apply changes to the event
            Event event = request.getEvent();
            int currentRegistrations = event.getCurrentRegistrations() == null ? 0 : event.getCurrentRegistrations();

            if (request.getUpdatedCapacity() != null && request.getUpdatedCapacity() < currentRegistrations) {
                throw new IllegalStateException("Updated capacity cannot be less than current registrations");
            }

            if (request.getUpdatedTitle() != null) event.setTitle(request.getUpdatedTitle());
            if (request.getUpdatedDescription() != null) event.setDescription(request.getUpdatedDescription());
            if (request.getUpdatedDate() != null) event.setEventDate(request.getUpdatedDate());
            if (request.getUpdatedStartTime() != null) event.setStartTime(request.getUpdatedStartTime());
            if (request.getUpdatedEndTime() != null) event.setEndTime(request.getUpdatedEndTime());
            if (request.getUpdatedVenue() != null) event.setVenue(request.getUpdatedVenue());
            if (request.getUpdatedCapacity() != null) event.setCapacity(request.getUpdatedCapacity());
            if (request.getUpdatedOrganizationType() != null) event.setOrganizationType(request.getUpdatedOrganizationType());
            if (request.getUpdatedStatus() != null) {
                if (request.getUpdatedStatus() == EventStatus.CANCELLED
                        && event.getStatus() != EventStatus.CANCELLED) {
                    registrationService.cancelRegistrationsForEvent(event, "Event cancelled by organizer request");
                    event.setStatus(EventStatus.CANCELLED);
                } else if (request.getUpdatedStatus() == EventStatus.COMPLETED
                        && event.getStatus() != EventStatus.COMPLETED) {
                    event.setStatus(EventStatus.COMPLETED);
                    createPostEventReport(event);
                } else {
                    event.setStatus(request.getUpdatedStatus());
                }
            }
            event.setUpdatedAt(LocalDateTime.now());
            eventRepository.save(event);

            request.setReviewedBy(admin);
            request.setReviewedAt(LocalDateTime.now());

            auditLogService.log(admin.getUserID(), admin.getEmail(),
                    "EVENT_UPDATE_APPROVED", "EVENT", event.getEventID(), "SUCCESS", null, null);

            if (notify) {
                emailService.sendNotification(event.getOrganizer().getEmail(),
                        "Modification Approved",
                        "Your changes for '" + event.getTitle() + "' are now live.");

                List<Registration> participants = registrationRepository.findByEvent_EventIDAndStatus(
                        event.getEventID(), RegistrationStatus.CONFIRMED);
                for (Registration reg : participants) {
                    emailService.sendNotification(reg.getStudent().getEmail(),
                            "Important: Event Update",
                            "The event '" + event.getTitle() + "' you are registered for has been updated. "
                                    + "Please check the portal for new venue/time details.");
                }
            }
        } else {
            // Intermediate stage approved — notify organizer
            emailService.sendNotification(
                    request.getEvent().getOrganizer().getEmail(),
                    "Update Request: Stage " + stage.name() + " Approved",
                    "Your update request for '" + request.getEvent().getTitle() + "' passed stage "
                            + stage.name() + " review and is now pending the next stage.");
        }

        requestRepository.save(request);
    }

    @Override
    @Transactional
    public void rejectRequest(Long requestID, String reason, Long adminID, boolean notify) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));

        Administrator admin = resolveAdmin(adminID);
        UpdateRequestStatus required = getRequiredStatusForAdmin(admin, request.getOrganizationType());

        if (request.getStatus() != required) {
            throw new ForbiddenException("You are not authorized to act on this request at its current stage.");
        }

        ApprovalStage stage = getApprovalStage(required);
        updateApprovalService.recordDecision(request, stage, ApprovalStatus.REJECTED, admin, reason);

        request.setStatus(UpdateRequestStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        requestRepository.save(request);

        emailService.sendNotification(
                request.getEvent().getOrganizer().getEmail(),
                "Update Request Rejected",
                "Your update request for '" + request.getEvent().getTitle() + "' was rejected. Reason: " + reason);
    }

    private Administrator resolveAdmin(Long adminID) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails
                && userDetails.getUser() instanceof Administrator admin) {
            return admin;
        }
        if (adminID != null) {
            User user = userRepository.findById(adminID)
                    .orElseThrow(() -> new NotFoundException("User not found with ID: " + adminID));
            if (user instanceof Administrator admin) return admin;
        }
        throw new ForbiddenException("Only administrators can perform this action");
    }

    private UpdateRequestStatus getRequiredStatusForAdmin(Administrator admin, OrganizationType orgType) {
        if (admin.getDepartment() == null) throw new ForbiddenException("Administrator has no department assigned.");
        return switch (admin.getDepartment()) {
            case YOUTH_UNION -> {
                if (orgType != OrganizationType.YOUTH_UNION) {
                    throw new ForbiddenException("This update request belongs to a different organization.");
                }
                yield UpdateRequestStatus.PENDING_L1;
            }
            case STUDENT_ASSOCIATION -> {
                if (orgType != OrganizationType.STUDENT_ASSOCIATION) {
                    throw new ForbiddenException("This update request belongs to a different organization.");
                }
                yield UpdateRequestStatus.PENDING_L1;
            }
            case FACULTY -> UpdateRequestStatus.PENDING_L2;
            case RECTOR -> UpdateRequestStatus.PENDING_L3;
        };
    }

    private ApprovalStage getApprovalStage(UpdateRequestStatus status) {
        return switch (status) {
            case PENDING_L1 -> ApprovalStage.L1;
            case PENDING_L2 -> ApprovalStage.L2;
            case PENDING_L3 -> ApprovalStage.L3;
            default -> throw new IllegalStateException("No approval stage for status: " + status);
        };
    }

    private UpdateRequestStatus getNextStatus(UpdateRequestStatus current) {
        return switch (current) {
            case PENDING_L1 -> UpdateRequestStatus.PENDING_L2;
            case PENDING_L2 -> UpdateRequestStatus.PENDING_L3;
            case PENDING_L3 -> UpdateRequestStatus.APPROVED;
            default -> throw new IllegalStateException("Cannot advance from status: " + current);
        };
    }

    private EventUpdateRequestDTO convertToDTO(EventUpdateRequest request) {
        Event event = request.getEvent();
        return EventUpdateRequestDTO.builder()
                .requestID(request.getRequestID())
                .eventID(event != null ? event.getEventID() : null)
                .eventTitle(event != null ? event.getTitle() : null)
                .updatedTitle(request.getUpdatedTitle())
                .updatedDescription(request.getUpdatedDescription())
                .updatedDate(request.getUpdatedDate())
                .updatedStartTime(request.getUpdatedStartTime())
                .updatedEndTime(request.getUpdatedEndTime())
                .updatedVenue(request.getUpdatedVenue())
                .updatedCapacity(request.getUpdatedCapacity())
                .updatedOrganizationType(request.getUpdatedOrganizationType())
                .updatedStatus(request.getUpdatedStatus())
                .updateReason(request.getUpdateReason())
                .attachmentsJson(request.getAttachmentsJson())
                .status(request.getStatus())
                .rejectionReason(request.getRejectionReason())
                .submittedAt(request.getSubmittedAt())
                .build();
    }

    private void createPostEventReport(Event event) {
        if (postEventReportRepository.existsByEventID(event.getEventID())) {
            return;
        }

        LocalDateTime eventEndDateTime = LocalDateTime.of(event.getEventDate(),
                event.getEndTime() != null ? event.getEndTime() : LocalTime.of(23, 59));
        int deadlineDays = event.getOrganizationType() == OrganizationType.YOUTH_UNION ? 14 : 7;
        LocalDateTime deadlineAt = eventEndDateTime.plusDays(deadlineDays);

        PostEventReport report = PostEventReport.builder()
                .eventID(event.getEventID())
                .eventType(event.getOrganizationType())
                .affiliatedOrg(event.getOrganizer().getOrganizationName())
                .status(ReportStatus.NOT_SUBMITTED)
                .deadlineAt(deadlineAt)
                .isLate(false)
                .build();

        postEventReportRepository.save(report);

        emailService.sendNotification(
                event.getOrganizer().getEmail(),
                "Event Reporting Window Open",
                "Your event '" + event.getTitle() + "' has ended. Please submit the post-event report within "
                        + deadlineDays + " days.");
    }
}
