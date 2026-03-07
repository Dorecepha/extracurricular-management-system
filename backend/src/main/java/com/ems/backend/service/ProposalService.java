package com.ems.backend.service;

import com.ems.backend.dto.ProposalApprovalDTO;
import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.enums.AdminDepartment;
import com.ems.backend.enums.ProposalStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProposalService {

    List<ProposalDTO> getProposalsByStatus(ProposalStatus status);

    List<ProposalDTO> getProposalsForAdmin(AdminDepartment department);

    ProposalDTO getProposalById(Long proposalID);

    List<ProposalDTO> getProposalsByOrganizer(Long organizerID);

    void approveProposal(Long proposalID, String comment);

    void rejectProposal(Long proposalID, String reason);

    ProposalDTO createProposal(ProposalDTO proposalDTO, MultipartFile[] files, Long organizerID);

    ProposalDTO updateAndResubmit(Long proposalID, ProposalDTO updatedDTO, MultipartFile[] files, Long organizerID);

    List<ProposalApprovalDTO> getApprovalHistory(Long proposalID);
}
