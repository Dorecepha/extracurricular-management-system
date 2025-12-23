package com.ems.backend.repository;

import com.ems.backend.entity.Proposal;
import com.ems.backend.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByOrganizer_UserID(Long organizerId);
    List<Proposal> findByStatus(ApprovalStatus status);
    long countByStatus(ApprovalStatus status);
    long countByOrganizer_UserIDAndStatus(Long organizerID, ApprovalStatus status);
}
