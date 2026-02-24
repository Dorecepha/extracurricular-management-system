package com.ems.backend.controller;

import com.ems.backend.dto.ActivityDTO;
import com.ems.backend.dto.DashboardDTO;
import com.ems.backend.dto.DashboardDTOV2;
import com.ems.backend.dto.EventDTO;
import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.AuditLog;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.Registration;
import com.ems.backend.entity.User;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.UserRole;
import com.ems.backend.repository.AuditLogRepository;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
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
    private final AuditLogRepository auditLogRepository;

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

    @GetMapping("/stats-v2")
    @Transactional(readOnly = true)
    public ResponseEntity<Response<DashboardDTOV2>> getStatsV2(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        User user = userDetails.getUser();
        DashboardDTOV2.DashboardDTOV2Builder<?, ?> builder = DashboardDTOV2.builder();

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

            // Recent Activity Feed
            List<AuditLog> recentLogs = auditLogRepository.findTop20ByOrderByTimestampDesc();
            List<ActivityDTO> activities = recentLogs.stream()
                    .map(this::mapToActivityDTO)
                    .toList();
            builder.recentActivity(activities);

            // Weekly Registration Count
            LocalDateTime weekAgo = LocalDateTime.now().minusDays(7);
            long weeklyCount = registrationRepository.countByRegisteredAtAfter(weekAgo);
            builder.weeklyRegistrationCount(weeklyCount);

        } else if (role == UserRole.EVENT_ORGANIZER || role == UserRole.ORGANIZER) {
            Long organizerId = user.getUserID();
            List<Event> organizerEvents = eventRepository.findByOrganizer_UserID(organizerId);

            builder.myActiveEvents(eventRepository.countByOrganizer_UserIDAndStatusIn(
                           organizerId,
                           List.of(EventStatus.UPCOMING, EventStatus.ONGOING)
                   ))
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
                   .activeEvents(mapToEventDTOs(organizerEvents.stream()
                           .filter(e -> e.getStatus() == EventStatus.UPCOMING || e.getStatus() == EventStatus.ONGOING)
                           .toList()))
                   .myProposals(mapToProposalDTOs(proposalRepository.findByOrganizer_UserID(organizerId)));

            // Events Needing Attention
            List<Event> needsAttention = organizerEvents.stream()
                    .filter(event -> {
                        LocalDate today = LocalDate.now();
                        long daysUntil = ChronoUnit.DAYS.between(today, event.getEventDate());
                        if (event.getCapacity() == null || event.getCapacity() == 0) {
                            return false;
                        }
                        double fillRate = (double) event.getCurrentRegistrations() / event.getCapacity();

                        // Low attendance warning: <30% filled AND within 14 days
                        boolean lowAttendance = fillRate < 0.3 && daysUntil <= 14 && daysUntil > 0;

                        // Near capacity: >90% filled AND >3 days out (actionable timeframe)
                        boolean nearCapacity = fillRate > 0.9 && daysUntil > 3;

                        return lowAttendance || nearCapacity;
                    })
                    .toList();
            builder.eventsNeedingAttention(mapToEventDTOs(needsAttention));

            // Calculate oldest pending proposal age
            List<Proposal> pendingProposals = proposalRepository
                    .findByOrganizer_UserID(organizerId).stream()
                    .filter(p -> p.getStatus() == ApprovalStatus.PENDING)
                    .toList();

            if (!pendingProposals.isEmpty()) {
                long oldestDays = pendingProposals.stream()
                        .mapToLong(p -> ChronoUnit.DAYS.between(
                                p.getSubmittedAt().toLocalDate(), LocalDate.now()))
                        .max()
                        .orElse(0);
                builder.oldestPendingProposalDays((int) oldestDays);
            }

            // Total participants all time
            builder.totalParticipantsAllTime(registrationRepository.countByEvent_Organizer_UserID(organizerId));

        } else if (user.getRole() == UserRole.STUDENT) {
            Long studentId = user.getUserID();
            List<Registration> registrations = registrationRepository.findByStudent_UserID(studentId);

            builder.myTotalRegistrations((long) registrations.size())
                   .activeEvents(toEventDTOsFromRegistrations(registrations));

            // Find next event (soonest future event)
            LocalDate today = LocalDate.now();
            LocalTime now = LocalTime.now();
            Event nextEvent = registrations.stream()
                    .map(Registration::getEvent)
                    .filter(e -> e.getEventDate().isAfter(today) ||
                                (e.getEventDate().isEqual(today) &&
                                 e.getStartTime().isAfter(now)))
                    .min(Comparator.comparing(Event::getEventDate)
                            .thenComparing(Event::getStartTime))
                    .orElse(null);

            if (nextEvent != null) {
                builder.nextEvent(mapToEventDTO(nextEvent));
            }

            // Count upcoming vs past events
            long upcomingCount = registrations.stream()
                    .map(Registration::getEvent)
                    .filter(e -> e.getEventDate().isAfter(today) ||
                                (e.getEventDate().isEqual(today) &&
                                 e.getStartTime().isAfter(now)))
                    .count();
            builder.upcomingEventsCount(upcomingCount);
            builder.pastEventsCount((long) registrations.size() - upcomingCount);

            // Count registrations created this month
            YearMonth currentMonth = YearMonth.now();
            long thisMonthCount = registrations.stream()
                    .filter(r -> {
                        YearMonth registrationMonth = YearMonth.from(r.getRegisteredAt());
                        return registrationMonth.equals(currentMonth);
                    })
                    .count();
            builder.thisMonthRegistrations(thisMonthCount);
        }

        Response<DashboardDTOV2> response = Response.<DashboardDTOV2>builder()
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
        EventDTO.EventDTOBuilder builder = EventDTO.builder()
                .eventID(event.getEventID())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .venue(event.getVenue())
                .capacity(event.getCapacity())
                .currentRegistrations(event.getCurrentRegistrations())
                .status(event.getStatus())
                .organizationType(event.getOrganizationType())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt());

        try {
            if (event.getOrganizer() != null) {
                builder.organizerID(event.getOrganizer().getUserID());
                String firstName = event.getOrganizer().getFirstName();
                String lastName = event.getOrganizer().getLastName();
                if (firstName != null && lastName != null) {
                    builder.organizerName(firstName + " " + lastName);
                }
            }
        } catch (Exception e) {
            // Skip organizer details if lazy loading fails
        }

        return builder.build();
    }

    private List<ProposalDTO> mapToProposalDTOs(List<Proposal> proposals) {
        return proposals.stream()
                .map(this::mapToProposalDTO)
                .toList();
    }

    private ProposalDTO mapToProposalDTO(Proposal proposal) {
        ProposalDTO.ProposalDTOBuilder builder = ProposalDTO.builder()
                .proposalID(proposal.getProposalID())
                .title(proposal.getTitle())
                .description(proposal.getDescription())
                .status(proposal.getStatus())
                .proposedDate(proposal.getProposedDate())
                .startTime(proposal.getStartTime())
                .endTime(proposal.getEndTime())
                .venue(proposal.getVenue())
                .capacity(proposal.getCapacity())
                .organizationType(proposal.getOrganizationType())
                .submittedAt(proposal.getSubmittedAt())
                .reviewedAt(proposal.getReviewedAt())
                .rejectionReason(proposal.getRejectionReason());

        try {
            if (proposal.getReviewedBy() != null) {
                builder.reviewedByID(proposal.getReviewedBy().getUserID());
            }
            if (proposal.getOrganizer() != null) {
                builder.organizerID(proposal.getOrganizer().getUserID());
                String firstName = proposal.getOrganizer().getFirstName();
                String lastName = proposal.getOrganizer().getLastName();
                if (firstName != null && lastName != null) {
                    builder.organizerName(firstName + " " + lastName);
                }
            }
        } catch (Exception e) {
            // Skip lazy-loaded details if they fail
        }

        return builder.build();
    }

    private ActivityDTO mapToActivityDTO(AuditLog log) {
        String actorRole = determineActorRole(log.getAction());
        String targetName = extractTargetName(log);
        String navigationUrl = buildNavigationUrl(log);

        return ActivityDTO.builder()
                .actorName(log.getUserEmail())
                .actorRole(actorRole)
                .action(log.getAction())
                .targetName(targetName)
                .timestamp(log.getTimestamp())
                .navigationUrl(navigationUrl)
                .build();
    }

    private String determineActorRole(String action) {
        if (action.contains("registered") || action.contains("cancelled")) {
            return "STUDENT";
        } else if (action.contains("proposal") || action.contains("event")) {
            return "ORGANIZER";
        } else if (action.contains("approved") || action.contains("rejected")) {
            return "ADMIN";
        }
        return "USER";
    }

    private String extractTargetName(AuditLog log) {
        // Extract target name from action string (simple implementation)
        // In a production system, you might want to query the actual entity
        String action = log.getAction();
        if (action != null && action.contains("for ")) {
            int startIndex = action.indexOf("for ") + 4;
            return action.substring(startIndex);
        }
        return log.getEntityType() != null ? log.getEntityType() : "Unknown";
    }

    private String buildNavigationUrl(AuditLog log) {
        if (log.getEntityType() == null || log.getEntityID() == null) {
            return "/dashboard";
        }

        switch (log.getEntityType().toLowerCase()) {
            case "event":
                return "/events/" + log.getEntityID();
            case "proposal":
                return "/proposals/" + log.getEntityID();
            case "registration":
                return "/my-events";
            default:
                return "/dashboard";
        }
    }
}
