package com.ems.backend.service.impl;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.Proposal;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.repository.ProposalRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public ProposalDTO createProposal(ProposalDTO proposalDTO, Long organizerID) {
        // Validate organizer exists
        EventOrganizer organizer = (EventOrganizer) userRepository.findById(organizerID)
                .orElseThrow(() -> new RuntimeException("Organizer not found with ID: " + organizerID));

        // Validate that user is actually an organizer
        if (!(organizer instanceof EventOrganizer)) {
            throw new RuntimeException("User is not an event organizer");
        }

        // Validate proposed date is in the future
        if (proposalDTO.getProposedDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Proposed date must be in the future");
        }

        // Validate time logic
        if (proposalDTO.getEndTime().isBefore(proposalDTO.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // Build and save proposal
        Proposal proposal = Proposal.builder()
                .title(proposalDTO.getTitle())
                .description(proposalDTO.getDescription())
                .proposedDate(proposalDTO.getProposedDate())
                .startTime(proposalDTO.getStartTime())
                .endTime(proposalDTO.getEndTime())
                .venue(proposalDTO.getVenue())
                .capacity(proposalDTO.getCapacity())
                .organizationType(proposalDTO.getOrganizationType())
                .attachmentsJson(proposalDTO.getAttachmentsJson())
                .status(ApprovalStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .organizer(organizer)
                .build();

        Proposal savedProposal = proposalRepository.save(proposal);

        return convertToDTO(savedProposal);
    }

    private ProposalDTO convertToDTO(Proposal proposal) {
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
                .organizerName(proposal.getOrganizer().getOrganizationName())
                .build();
    }
}
