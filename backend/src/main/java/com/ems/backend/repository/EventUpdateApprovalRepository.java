package com.ems.backend.repository;

import com.ems.backend.entity.EventUpdateApproval;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventUpdateApprovalRepository extends JpaRepository<EventUpdateApproval, Long> {
    List<EventUpdateApproval> findByUpdateRequest_RequestID(Long requestID);
}
