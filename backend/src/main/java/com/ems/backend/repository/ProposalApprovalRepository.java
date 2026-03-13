package com.ems.backend.repository;

import com.ems.backend.entity.ProposalApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalApprovalRepository extends JpaRepository<ProposalApproval, Long> {
    List<ProposalApproval> findByProposal_ProposalID(Long proposalID);
}
