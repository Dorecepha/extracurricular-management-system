package com.ems.backend.repository;

import com.ems.backend.entity.Event;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.OrganizationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
    Page<Event> findByStatusAndOrganizationType(EventStatus status, OrganizationType type, Pageable pageable);
    Page<Event> findByApprovalStatusAndStatusNot(ApprovalStatus approvalStatus, EventStatus status, Pageable pageable);
    Page<Event> findByApprovalStatusAndStatusNotAndTitleContainingIgnoreCase(ApprovalStatus approvalStatus, EventStatus status, String title, Pageable pageable);
    List<Event> findByOrganizer_UserID(Long organizerId);
    List<Event> findByEventDate(LocalDate date);
    long countByStatus(EventStatus status);
    long countByOrganizer_UserID(Long organizerID);
}
