package com.ems.backend.entity;

import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "proposal_approvals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProposalApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "approval_id")
    private Long approvalID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private Proposal proposal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStage stage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApprovalStatus decision;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id", nullable = false)
    private Administrator approver;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;
}
