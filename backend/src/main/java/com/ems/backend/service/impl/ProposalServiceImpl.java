package com.ems.backend.service.impl;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.User;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.ProposalRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.AuditLogService;
import com.ems.backend.service.FileStorageService;
import com.ems.backend.service.ProposalService;
import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
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
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Override
    public List<ProposalDTO> getPendingProposals() {
        List<Proposal> proposals = proposalRepository.findByStatus(ApprovalStatus.PENDING);
        return proposals.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    public ProposalDTO getProposalById(Long proposalID) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalID));
        return convertToDTO(proposal);
    }

    @Override
    public List<ProposalDTO> getProposalsByOrganizer(Long organizerID) {
        List<Proposal> proposals = proposalRepository.findByOrganizer_UserID(organizerID);
        return proposals.stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional
    public void approveProposal(Long proposalID) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalID));

        proposal.setStatus(ApprovalStatus.APPROVED);
        proposalRepository.save(proposal);

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

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            User admin = userDetails.getUser();
            auditLogService.log(
                    admin.getUserID(),
                    admin.getEmail(),
                    "PROPOSAL_APPROVED",
                    "PROPOSAL",
                    proposalID,
                    "SUCCESS",
                    null,
                    null
            );
        }
        emailService.sendNotification(
                proposal.getOrganizer().getEmail(),
                "Proposal Approved!",
                "Congratulations! Your proposal '" + proposal.getTitle() + "' has been approved and is now live for registration."
        );
    }

    @Override
    @Transactional
    public void rejectProposal(Long proposalID, String reason) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalID));

        proposal.setStatus(ApprovalStatus.REJECTED);
        proposal.setRejectionReason(reason);
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
                .orElseThrow(() -> new RuntimeException("Organizer not found with ID: " + organizerID));
        if (!(user instanceof EventOrganizer organizer)) {
            throw new RuntimeException("User is not an event organizer");
        }

        if (proposalDTO.getProposedDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Proposed date must be in the future");
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
                .status(ApprovalStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .organizer(organizer)
                .build();

        Proposal savedProposal = proposalRepository.save(proposal);

        return convertToDTO(savedProposal);
    }

    @Override
    @Transactional
    public ProposalDTO updateAndResubmit(Long proposalID, ProposalDTO dto, MultipartFile[] files) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new RuntimeException("Proposal not found"));

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
            List<Map<String, String>> existing = mapper.readValue(dto.getAttachmentsJson() == null ? "[]" : dto.getAttachmentsJson(), new TypeReference<>() {});
            combinedAttachments.addAll(existing);
        } catch (Exception ignored) {}

        if (files != null && files.length > 0) {
            try {
                String stored = fileStorageService.storeFiles(files);
                List<Map<String, String>> newOnes = mapper.readValue(stored, new TypeReference<>() {});
                combinedAttachments.addAll(newOnes);
            } catch (Exception ignored) {}
        }
        try {
            proposal.setAttachmentsJson(mapper.writeValueAsString(combinedAttachments));
        } catch (Exception ignored) {}

        proposal.setStatus(ApprovalStatus.PENDING);
        proposal.setRejectionReason(null);
        proposal.setSubmittedAt(LocalDateTime.now());

        return convertToDTO(proposalRepository.save(proposal));
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
