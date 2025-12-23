package com.ems.backend.service;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.entity.Proposal;

import java.util.List;

public interface ProposalService {

    List<Proposal> getPendingProposals();

    void approveProposal(Long proposalID);

    void rejectProposal(Long proposalID, String reason);

    ProposalDTO createProposal(ProposalDTO proposalDTO, Long organizerID);
}
