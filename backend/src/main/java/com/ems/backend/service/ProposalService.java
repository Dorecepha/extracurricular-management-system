package com.ems.backend.service;

import com.ems.backend.dto.ProposalDTO;
import java.util.List;

public interface ProposalService {

    List<ProposalDTO> getPendingProposals();

    ProposalDTO getProposalById(Long proposalID);

    List<ProposalDTO> getProposalsByOrganizer(Long organizerID);

    void approveProposal(Long proposalID);

    void rejectProposal(Long proposalID, String reason);

    ProposalDTO createProposal(ProposalDTO proposalDTO, Long organizerID);

    ProposalDTO updateAndResubmit(Long proposalID, ProposalDTO updatedDTO);
}
