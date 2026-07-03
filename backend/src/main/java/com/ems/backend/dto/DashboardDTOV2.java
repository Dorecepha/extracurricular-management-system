package com.ems.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class DashboardDTOV2 extends DashboardDTO {

    // Student additions
    private EventDTO nextEvent;                    // Soonest upcoming event
    private Long upcomingEventsCount;              // activeEvents with date >= today
    private Long pastEventsCount;                  // registrations with date < today
    private Long thisMonthRegistrations;           // registrations created this month

    // Organizer additions
    private List<EventDTO> eventsNeedingAttention; // Low attendance + near events
    private Long totalParticipantsAllTime;         // Sum across all events
    private Integer oldestPendingProposalDays;     // For urgency indicator

    // Admin additions
    private List<ActivityDTO> recentActivity;      // Last 20 audit log entries
    private Long weeklyRegistrationCount;          // Registrations past 7 days
    private Long pendingReportsCount;              // SUBMITTED/LATE_SUBMITTED reports for admin's org type
}
