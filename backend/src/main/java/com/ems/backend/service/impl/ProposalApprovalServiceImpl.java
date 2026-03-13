package com.ems.backend.service.impl;

import com.ems.backend.dto.ProposalApprovalDTO;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.ProposalApproval;
import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.repository.ProposalApprovalRepository;
import com.ems.backend.service.ProposalApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProposalApprovalServiceImpl implements ProposalApprovalService {

    private final ProposalApprovalRepository proposalApprovalRepository;

    @Override
    public ProposalApproval recordDecision(Proposal proposal, ApprovalStage stage, ApprovalStatus decision,
                                           Administrator approver, String comment) {
        ProposalApproval approval = ProposalApproval.builder()
                .proposal(proposal)
                .stage(stage)
                .decision(decision)
                .approver(approver)
                .comment(comment)
                .decidedAt(LocalDateTime.now())
                .build();
        return proposalApprovalRepository.save(approval);
    }

    @Override
    public List<ProposalApprovalDTO> getApprovalsForProposal(Long proposalID) {
        return proposalApprovalRepository.findByProposal_ProposalID(proposalID)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    private ProposalApprovalDTO toDTO(ProposalApproval approval) {
        String approverName = approval.getApprover().getFirstName() + " " + approval.getApprover().getLastName();
        String department = approval.getApprover().getDepartment() != null
                ? approval.getApprover().getDepartment().name()
                : null;
        return ProposalApprovalDTO.builder()
                .approvalID(approval.getApprovalID())
                .proposalID(approval.getProposal().getProposalID())
                .stage(approval.getStage())
                .decision(approval.getDecision())
                .approverID(approval.getApprover().getUserID())
                .approverName(approverName)
                .approverDepartment(department)
                .comment(approval.getComment())
                .decidedAt(approval.getDecidedAt())
                .build();
    }
}
