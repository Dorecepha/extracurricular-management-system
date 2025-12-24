package com.ems.backend.controller;

import com.ems.backend.dto.DashboardDTO;
import com.ems.backend.dto.EventDTO;
import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.Registration;
import com.ems.backend.entity.User;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.UserRole;
import com.ems.backend.repository.EventUpdateRequestRepository;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.ProposalRepository;
import com.ems.backend.repository.RegistrationRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final ProposalRepository proposalRepository;
    private final RegistrationRepository registrationRepository;
    private final EventUpdateRequestRepository eventUpdateRequestRepository;

    @GetMapping("/stats")
    public ResponseEntity<Response<DashboardDTO>> getStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User user = userDetails.getUser();
        DashboardDTO.DashboardDTOBuilder builder = DashboardDTO.builder();

        UserRole role = user.getRole();

        if (role == UserRole.ADMIN) {
            long organizerCount = userRepository.countByRole(UserRole.EVENT_ORGANIZER)
                    + userRepository.countByRole(UserRole.ORGANIZER);
            long pendingProposals = proposalRepository.countByStatus(ApprovalStatus.PENDING);
            long pendingUpdates = eventUpdateRequestRepository.countByStatus(ApprovalStatus.PENDING);

            builder.totalStudents(userRepository.countByRole(UserRole.STUDENT))
                   .totalOrganizers(organizerCount)
                   .pendingProposalsCount(pendingProposals)
                   .pendingUpdatesCount(pendingUpdates)
                   .activeEventsCount(eventRepository.countByStatus(EventStatus.UPCOMING))
                   .activeEvents(mapToEventDTOs(eventRepository.findAll()));
        } else if (role == UserRole.EVENT_ORGANIZER || role == UserRole.ORGANIZER) {
            Long organizerId = user.getUserID();
            builder.myActiveEvents(eventRepository.countByOrganizer_UserID(organizerId))
                   .totalRegistrationsForMyEvents(
                           registrationRepository.countByEvent_Organizer_UserID(organizerId))
                   .myProposalStats(Map.of(
                           ApprovalStatus.APPROVED.name(),
                           proposalRepository.countByOrganizer_UserIDAndStatus(organizerId, ApprovalStatus.APPROVED),
                           ApprovalStatus.PENDING.name(),
                           proposalRepository.countByOrganizer_UserIDAndStatus(organizerId, ApprovalStatus.PENDING),
                           ApprovalStatus.REJECTED.name(),
                           proposalRepository.countByOrganizer_UserIDAndStatus(organizerId, ApprovalStatus.REJECTED)
                   ))
                   .activeEvents(mapToEventDTOs(eventRepository.findByOrganizer_UserID(organizerId)))
                   .myProposals(mapToProposalDTOs(proposalRepository.findByOrganizer_UserID(organizerId)));
        } else if (user.getRole() == UserRole.STUDENT) {
            List<Registration> registrations = registrationRepository.findByStudent_UserID(user.getUserID());
            builder.myTotalRegistrations((long) registrations.size())
                   .activeEvents(toEventDTOsFromRegistrations(registrations));
        }

        Response<DashboardDTO> response = Response.<DashboardDTO>builder()
                .statusCode(200)
                .message("Stats fetched")
                .data(builder.build())
                .build();

        return ResponseEntity.ok(response);
    }

    private List<EventDTO> mapToEventDTOs(List<Event> events) {
        return events.stream()
                .filter(event -> event.getStatus() != EventStatus.CANCELLED)
                .map(this::mapToEventDTO)
                .toList();
    }

    private List<EventDTO> toEventDTOsFromRegistrations(List<Registration> registrations) {
        Set<Long> seenEventIds = new HashSet<>();
        return registrations.stream()
                .map(Registration::getEvent)
                .filter(event -> event != null && seenEventIds.add(event.getEventID()))
                .map(this::mapToEventDTO)
                .toList();
    }

    private EventDTO mapToEventDTO(Event event) {
        return EventDTO.builder()
                .eventID(event.getEventID())
                .title(event.getTitle())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .venue(event.getVenue())
                .build();
    }

    private List<ProposalDTO> mapToProposalDTOs(List<Proposal> proposals) {
        return proposals.stream()
                .map(this::mapToProposalDTO)
                .toList();
    }

    private ProposalDTO mapToProposalDTO(Proposal proposal) {
        return ProposalDTO.builder()
                .proposalID(proposal.getProposalID())
                .title(proposal.getTitle())
                .status(proposal.getStatus())
                .proposedDate(proposal.getProposedDate())
                .startTime(proposal.getStartTime())
                .endTime(proposal.getEndTime())
                .venue(proposal.getVenue())
                .capacity(proposal.getCapacity())
                .organizationType(proposal.getOrganizationType())
                .submittedAt(proposal.getSubmittedAt())
                .build();
    }
}
