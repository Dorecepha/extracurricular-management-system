package com.ems.backend.dto;

import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ProposalStatus;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalDTO {

    private Long proposalID;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Proposed date is required")
    @Future(message = "Proposed date must be in the future")
    private LocalDate proposedDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Venue is required")
    private String venue;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @NotNull(message = "Organization type is required")
    private OrganizationType organizationType;

    private String attachmentsJson;

    private ProposalStatus status;

    private List<ProposalApprovalDTO> approvalHistory;

    private LocalDateTime submittedAt;

    private LocalDateTime reviewedAt;

    private Long reviewedByID;

    private String rejectionReason;

    private Long organizerID;

    private String organizerName;
}
