package com.ems.backend.repository;

import com.ems.backend.entity.EventUpdateRequest;
import com.ems.backend.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventUpdateRequestRepository extends JpaRepository<EventUpdateRequest, Long> {
    List<EventUpdateRequest> findByStatus(ApprovalStatus status);
    List<EventUpdateRequest> findByEvent_EventIDOrderBySubmittedAtDesc(Long eventId);
    List<EventUpdateRequest> findByRequestedBy_UserID(Long organizerId);
    long countByStatus(ApprovalStatus status);
}
