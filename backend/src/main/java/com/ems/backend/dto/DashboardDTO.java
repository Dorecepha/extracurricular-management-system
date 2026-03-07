package com.ems.backend.dto;

import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.dto.EventDTO;
import com.ems.backend.dto.ProposalDTO;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.util.List;
import java.util.Map;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardDTO {
    private List<EventDTO> activeEvents; // Use DTO to avoid proxy serialization issues
    private List<ProposalDTO> myProposals;

    // Admin Stats
    private Long totalStudents;
    private Long totalOrganizers;
    private Long pendingProposalsCount;
    private Long pendingUpdatesCount;
    private Long activeEventsCount;

    // Organizer Stats
    private Long myActiveEvents;
    private Long totalRegistrationsForMyEvents;
    private Map<String, Long> myProposalStats; // e.g., "APPROVED": 5, "REJECTED": 2

    // Student Stats
    private Long myTotalRegistrations;

}
