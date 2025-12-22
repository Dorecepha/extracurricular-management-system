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
public class EventDTO {

    private Long eventID;
    private String title;
    private String description;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String venue;
    private Integer capacity;
    private Integer currentRegistrations;
    private EventStatus status;
    private ApprovalStatus approvalStatus;
    private OrganizationType organizationType;
    private Long organizerID;
    private String organizerName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
