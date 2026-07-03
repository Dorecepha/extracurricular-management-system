package com.ems.backend.service.impl;

import com.ems.backend.dto.ProposalApprovalDTO;
import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AdminDepartment;
import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ProposalStatus;
import com.ems.backend.exception.ForbiddenException;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.ProposalRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.AuditLogService;
import com.ems.backend.service.FileStorageService;
import com.ems.backend.service.ProposalApprovalService;
import com.ems.backend.service.ProposalService;
import com.ems.backend.service.email.EmailService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;
    private final ProposalApprovalService proposalApprovalService;
    private final ObjectMapper objectMapper;

    @Override
    public List<ProposalDTO> getProposalsByStatus(ProposalStatus status) {
        return proposalRepository.findByStatus(status)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    public List<ProposalDTO> getProposalsForAdmin(AdminDepartment department) {
        List<Proposal> proposals = switch (department) {
            case YOUTH_UNION -> proposalRepository.findByStatusAndOrganizationType(
                    ProposalStatus.PENDING_L1, OrganizationType.YOUTH_UNION);
            case STUDENT_ASSOCIATION -> proposalRepository.findByStatusAndOrganizationType(
                    ProposalStatus.PENDING_L1, OrganizationType.STUDENT_ASSOCIATION);
            case FACULTY -> proposalRepository.findByStatus(ProposalStatus.PENDING_L2);
            case RECTOR -> proposalRepository.findByStatus(ProposalStatus.PENDING_L3);
        };
        return proposals.stream().map(this::convertToDTO).toList();
    }

    @Override
    public ProposalDTO getProposalById(Long proposalID) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new NotFoundException("Proposal not found with ID: " + proposalID));
        ProposalDTO dto = convertToDTO(proposal);
        dto.setApprovalHistory(proposalApprovalService.getApprovalsForProposal(proposalID));
        return dto;
    }

    @Override
    public List<ProposalDTO> getProposalsByOrganizer(Long organizerID) {
        return proposalRepository.findByOrganizer_UserID(organizerID)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional
    public void approveProposal(Long proposalID, String comment) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new NotFoundException("Proposal not found with ID: " + proposalID));

        Administrator admin = extractAdmin();
        ProposalStatus required = getRequiredStatusForDepartment(admin.getDepartment());

        if (proposal.getStatus() != required) {
            throw new ForbiddenException("You are not authorized to act on this proposal at its current stage.");
        }

        if (required == ProposalStatus.PENDING_L1) {
            OrganizationType adminOrgType = getOrgTypeForDept(admin.getDepartment());
            if (proposal.getOrganizationType() != adminOrgType) {
                throw new ForbiddenException("This proposal belongs to a different organization.");
            }
        }

        ApprovalStage stage = getApprovalStage(required);
        proposalApprovalService.recordDecision(proposal, stage, ApprovalStatus.APPROVED, admin, comment);

        ProposalStatus nextStatus = getNextStatus(proposal.getStatus());
        proposal.setStatus(nextStatus);

        String emailSubject;
        String emailBody;

        if (nextStatus == ProposalStatus.APPROVED) {
            proposal.setReviewedBy(admin);
            proposal.setReviewedAt(LocalDateTime.now());

            Event event = new Event();
            event.setTitle(proposal.getTitle());
            event.setDescription(proposal.getDescription());
            event.setVenue(proposal.getVenue());
            event.setEventDate(proposal.getProposedDate());
            event.setStartTime(proposal.getStartTime());
            event.setEndTime(proposal.getEndTime());
            event.setCapacity(proposal.getCapacity());
            event.setOrganizationType(proposal.getOrganizationType());
            event.setOrganizer(proposal.getOrganizer());
            event.setStatus(EventStatus.UPCOMING);
            event.setApprovalStatus(ApprovalStatus.APPROVED);
            eventRepository.save(event);

            emailSubject = "Proposal Approved!";
            emailBody = "Congratulations! Your proposal '" + proposal.getTitle()
                    + "' has been approved and is now live for registration.";
            auditLogService.log(admin.getUserID(), admin.getEmail(),
                    "PROPOSAL_APPROVED_FINAL", "PROPOSAL", proposalID, "SUCCESS", null, null);
        } else if (nextStatus == ProposalStatus.PENDING_L2) {
            emailSubject = "Proposal Update: Passed First Review";
            emailBody = "Your proposal '" + proposal.getTitle()
                    + "' has passed the initial review and is now pending Faculty review.";
            auditLogService.log(admin.getUserID(), admin.getEmail(),
                    "PROPOSAL_APPROVED_L1", "PROPOSAL", proposalID, "SUCCESS", null, null);
        } else {
            emailSubject = "Proposal Update: Passed Faculty Review";
            emailBody = "Your proposal '" + proposal.getTitle()
                    + "' has passed the Faculty review and is now pending University Board review.";
            auditLogService.log(admin.getUserID(), admin.getEmail(),
                    "PROPOSAL_APPROVED_L2", "PROPOSAL", proposalID, "SUCCESS", null, null);
        }

        proposalRepository.save(proposal);
        emailService.sendNotification(proposal.getOrganizer().getEmail(), emailSubject, emailBody);
    }

    @Override
    @Transactional
    public void rejectProposal(Long proposalID, String reason) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new NotFoundException("Proposal not found with ID: " + proposalID));

        Administrator admin = extractAdmin();
        ProposalStatus required = getRequiredStatusForDepartment(admin.getDepartment());

        if (proposal.getStatus() != required) {
            throw new ForbiddenException("You are not authorized to act on this proposal at its current stage.");
        }

        if (required == ProposalStatus.PENDING_L1) {
            OrganizationType adminOrgType = getOrgTypeForDept(admin.getDepartment());
            if (proposal.getOrganizationType() != adminOrgType) {
                throw new ForbiddenException("This proposal belongs to a different organization.");
            }
        }

        ApprovalStage stage = getApprovalStage(required);
        proposalApprovalService.recordDecision(proposal, stage, ApprovalStatus.REJECTED, admin, reason);

        proposal.setStatus(ProposalStatus.REJECTED);
        proposal.setRejectionReason(reason);
        proposal.setReviewedBy(admin);
        proposal.setReviewedAt(LocalDateTime.now());

        auditLogService.log(admin.getUserID(), admin.getEmail(),
                "PROPOSAL_REJECTED_" + stage.name(), "PROPOSAL", proposalID, "SUCCESS", null, null);

        proposalRepository.save(proposal);
        emailService.sendNotification(
                proposal.getOrganizer().getEmail(),
                "Proposal Status Update",
                "Unfortunately, your proposal '" + proposal.getTitle() + "' was not approved. Reason: " + reason
        );
    }

    @Override
    @Transactional
    public ProposalDTO createProposal(ProposalDTO proposalDTO, MultipartFile[] files, Long organizerID) {
        User user = userRepository.findById(organizerID)
                .orElseThrow(() -> new NotFoundException("Organizer not found with ID: " + organizerID));
        if (!(user instanceof EventOrganizer organizer)) {
            throw new IllegalStateException("User is not an event organizer");
        }

        if (proposalDTO.getProposedDate().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Proposed date must be in the future");
        }

        if (proposalDTO.getEndTime().isBefore(proposalDTO.getStartTime())) {
            throw new IllegalStateException("Validation Error: End time must be after start time");
        }

        LocalDateTime proposedStart = LocalDateTime.of(proposalDTO.getProposedDate(), proposalDTO.getStartTime());
        if (Duration.between(LocalDateTime.now(), proposedStart).toHours() < 48) {
            throw new IllegalStateException("Submission Policy: Proposals must be submitted at least 48 hours before the proposed start time.");
        }

        String attachmentsJson = fileStorageService.storeFiles(files);

        Proposal proposal = Proposal.builder()
                .title(proposalDTO.getTitle())
                .description(proposalDTO.getDescription())
                .proposedDate(proposalDTO.getProposedDate())
                .startTime(proposalDTO.getStartTime())
                .endTime(proposalDTO.getEndTime())
                .venue(proposalDTO.getVenue())
                .capacity(proposalDTO.getCapacity())
                .organizationType(proposalDTO.getOrganizationType())
                .attachmentsJson(attachmentsJson)
                .status(ProposalStatus.PENDING_L1)
                .submittedAt(LocalDateTime.now())
                .organizer(organizer)
                .build();

        return convertToDTO(proposalRepository.save(proposal));
    }

    @Override
    @Transactional
    public ProposalDTO updateAndResubmit(Long proposalID, ProposalDTO dto, MultipartFile[] files, Long organizerID) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new NotFoundException("Proposal not found"));

        if (!proposal.getOrganizer().getUserID().equals(organizerID)) {
            throw new ForbiddenException("You are not authorized to resubmit this proposal");
        }

        proposal.setTitle(dto.getTitle());
        proposal.setDescription(dto.getDescription());
        proposal.setProposedDate(dto.getProposedDate());
        proposal.setStartTime(dto.getStartTime());
        proposal.setEndTime(dto.getEndTime());
        proposal.setVenue(dto.getVenue());
        proposal.setCapacity(dto.getCapacity());
        proposal.setOrganizationType(dto.getOrganizationType());

        List<Map<String, String>> combinedAttachments = new ArrayList<>();
        try {
            List<Map<String, String>> existing = objectMapper.readValue(
                    dto.getAttachmentsJson() == null ? "[]" : dto.getAttachmentsJson(),
                    new TypeReference<>() {});
            combinedAttachments.addAll(existing);
        } catch (Exception ignored) {}

        if (files != null && files.length > 0) {
            try {
                String stored = fileStorageService.storeFiles(files);
                List<Map<String, String>> newOnes = objectMapper.readValue(stored, new TypeReference<>() {});
                combinedAttachments.addAll(newOnes);
            } catch (Exception ignored) {}
        }
        try {
            proposal.setAttachmentsJson(objectMapper.writeValueAsString(combinedAttachments));
        } catch (Exception ignored) {}

        proposal.setStatus(ProposalStatus.PENDING_L1);
        proposal.setRejectionReason(null);
        proposal.setSubmittedAt(LocalDateTime.now());

        return convertToDTO(proposalRepository.save(proposal));
    }

    @Override
    public List<ProposalApprovalDTO> getApprovalHistory(Long proposalID) {
        return proposalApprovalService.getApprovalsForProposal(proposalID);
    }

    private Administrator extractAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails userDetails)) {
            throw new ForbiddenException("Not authenticated");
        }
        User user = userRepository.findById(userDetails.getUserID())
                .orElseThrow(() -> new ForbiddenException("User not found"));
        if (!(user instanceof Administrator admin)) {
            throw new ForbiddenException("Only administrators can perform this action");
        }
        if (admin.getDepartment() == null) {
            throw new ForbiddenException("Administrator has no department assigned");
        }
        return admin;
    }

    private ProposalStatus getRequiredStatusForDepartment(AdminDepartment department) {
        return switch (department) {
            case YOUTH_UNION, STUDENT_ASSOCIATION -> ProposalStatus.PENDING_L1;
            case FACULTY -> ProposalStatus.PENDING_L2;
            case RECTOR -> ProposalStatus.PENDING_L3;
        };
    }

    private OrganizationType getOrgTypeForDept(AdminDepartment department) {
        return switch (department) {
            case YOUTH_UNION -> OrganizationType.YOUTH_UNION;
            case STUDENT_ASSOCIATION -> OrganizationType.STUDENT_ASSOCIATION;
            default -> throw new IllegalStateException("Department " + department + " is not a L1 department");
        };
    }

    private ApprovalStage getApprovalStage(ProposalStatus status) {
        return switch (status) {
            case PENDING_L1 -> ApprovalStage.L1;
            case PENDING_L2 -> ApprovalStage.L2;
            case PENDING_L3 -> ApprovalStage.L3;
            default -> throw new IllegalStateException("No approval stage for status: " + status);
        };
    }

    private ProposalStatus getNextStatus(ProposalStatus current) {
        return switch (current) {
            case PENDING_L1 -> ProposalStatus.PENDING_L2;
            case PENDING_L2 -> ProposalStatus.PENDING_L3;
            case PENDING_L3 -> ProposalStatus.APPROVED;
            default -> throw new IllegalStateException("Cannot advance from status: " + current);
        };
    }

    private ProposalDTO convertToDTO(Proposal proposal) {
        String organizerName = proposal.getOrganizer().getOrganizationName();
        if (organizerName == null || organizerName.isEmpty()) {
            organizerName = proposal.getOrganizer().getFirstName() + " " + proposal.getOrganizer().getLastName();
        }

        return ProposalDTO.builder()
                .proposalID(proposal.getProposalID())
                .title(proposal.getTitle())
                .description(proposal.getDescription())
                .proposedDate(proposal.getProposedDate())
                .startTime(proposal.getStartTime())
                .endTime(proposal.getEndTime())
                .venue(proposal.getVenue())
                .capacity(proposal.getCapacity())
                .organizationType(proposal.getOrganizationType())
                .attachmentsJson(proposal.getAttachmentsJson())
                .status(proposal.getStatus())
                .submittedAt(proposal.getSubmittedAt())
                .reviewedAt(proposal.getReviewedAt())
                .reviewedByID(proposal.getReviewedBy() != null ? proposal.getReviewedBy().getUserID() : null)
                .rejectionReason(proposal.getRejectionReason())
                .organizerID(proposal.getOrganizer().getUserID())
                .organizerName(organizerName)
                .build();
    }
}
