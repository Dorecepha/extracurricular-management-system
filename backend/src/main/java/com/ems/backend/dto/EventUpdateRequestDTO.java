package com.ems.backend.dto;

import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.OrganizationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventUpdateRequestDTO {
    private Long requestID;
    private Long eventID;
    private String eventTitle; // Current title for reference

    private String updatedTitle;
    private String updatedDescription;
    private LocalDate updatedDate;
    private LocalTime updatedStartTime;
    private LocalTime updatedEndTime;
    private String updatedVenue;
    private Integer updatedCapacity;
    private OrganizationType updatedOrganizationType;
    private EventStatus updatedStatus;
    private String updateReason;
    private String attachmentsJson;

    private ApprovalStatus status;
    private String rejectionReason;
    private LocalDateTime submittedAt;
}
