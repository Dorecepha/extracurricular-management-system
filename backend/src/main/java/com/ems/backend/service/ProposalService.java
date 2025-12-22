package com.ems.backend.service;

import com.ems.backend.dto.ProposalDTO;

public interface ProposalService {

    ProposalDTO createProposal(ProposalDTO proposalDTO, Long organizerID);
}
