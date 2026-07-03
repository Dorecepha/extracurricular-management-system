package com.ems.backend.repository;

import com.ems.backend.entity.Proposal;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ProposalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProposalRepository extends JpaRepository<Proposal, Long> {
    List<Proposal> findByOrganizer_UserID(Long organizerId);
    List<Proposal> findByStatus(ProposalStatus status);
    List<Proposal> findByStatusAndOrganizationType(ProposalStatus status, OrganizationType organizationType);
    long countByStatus(ProposalStatus status);
    long countByStatusAndOrganizationType(ProposalStatus status, OrganizationType organizationType);
    long countByOrganizer_UserIDAndStatus(Long organizerID, ProposalStatus status);
    long countByOrganizer_UserIDAndStatusIn(Long organizerID, java.util.Collection<ProposalStatus> statuses);
}
