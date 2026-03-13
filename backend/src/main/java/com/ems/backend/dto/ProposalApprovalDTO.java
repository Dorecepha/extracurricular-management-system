package com.ems.backend.dto;

import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalApprovalDTO {

    private Long approvalID;
    private Long proposalID;
    private ApprovalStage stage;
    private ApprovalStatus decision;
    private Long approverID;
    private String approverName;
    private String approverDepartment;
    private String comment;
    private LocalDateTime decidedAt;
}
