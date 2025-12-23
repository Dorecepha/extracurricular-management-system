package com.ems.backend.service.impl;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.Proposal;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.ProposalRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.ProposalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProposalServiceImpl implements ProposalService {

    private final ProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

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
    }

    @Override
    @Transactional
    public void rejectProposal(Long proposalID, String reason) {
        Proposal proposal = proposalRepository.findById(proposalID)
                .orElseThrow(() -> new RuntimeException("Proposal not found with ID: " + proposalID));

        proposal.setStatus(ApprovalStatus.REJECTED);
        proposal.setRejectionReason(reason);
        proposalRepository.save(proposal);
    }

    @Override
    @Transactional
    public ProposalDTO createProposal(ProposalDTO proposalDTO, Long organizerID) {
        EventOrganizer organizer = (EventOrganizer) userRepository.findById(organizerID)
                .orElseThrow(() -> new RuntimeException("Organizer not found with ID: " + organizerID));

        if (!(organizer instanceof EventOrganizer)) {
            throw new RuntimeException("User is not an event organizer");
        }

        if (proposalDTO.getProposedDate().isBefore(LocalDate.now())) {
            throw new RuntimeException("Proposed date must be in the future");
        }

        if (proposalDTO.getEndTime().isBefore(proposalDTO.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

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

    @Override
    @Transactional
    public ProposalDTO updateAndResubmit(Long proposalID, ProposalDTO dto) {
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
        proposal.setAttachmentsJson(dto.getAttachmentsJson());

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
