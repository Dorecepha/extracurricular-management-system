package com.ems.backend.repository;

import com.ems.backend.entity.EventUpdateRequest;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.UpdateRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventUpdateRequestRepository extends JpaRepository<EventUpdateRequest, Long> {
    List<EventUpdateRequest> findByStatus(UpdateRequestStatus status);
    List<EventUpdateRequest> findByStatusAndOrganizationType(UpdateRequestStatus status, OrganizationType organizationType);
    List<EventUpdateRequest> findByEvent_EventIDOrderBySubmittedAtDesc(Long eventId);
    List<EventUpdateRequest> findByRequestedBy_UserID(Long organizerId);
    long countByStatus(UpdateRequestStatus status);
}
