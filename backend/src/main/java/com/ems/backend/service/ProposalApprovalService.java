package com.ems.backend.service;

import com.ems.backend.dto.ProposalApprovalDTO;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.Proposal;
import com.ems.backend.entity.ProposalApproval;
import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;

import java.util.List;

public interface ProposalApprovalService {

    ProposalApproval recordDecision(Proposal proposal, ApprovalStage stage, ApprovalStatus decision,
                                    Administrator approver, String comment);

    List<ProposalApprovalDTO> getApprovalsForProposal(Long proposalID);
}
