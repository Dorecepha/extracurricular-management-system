package com.ems.backend.repository;

import com.ems.backend.entity.Event;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.OrganizationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    Page<Event> findByStatus(EventStatus status, Pageable pageable);
    Page<Event> findByStatusAndOrganizationType(EventStatus status, OrganizationType type, Pageable pageable);

    @Query("SELECT e FROM Event e JOIN FETCH e.organizer WHERE e.approvalStatus = :approvalStatus AND e.status != :status")
    Page<Event> findByApprovalStatusAndStatusNot(
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("status") EventStatus status,
        Pageable pageable
    );

    @Query("SELECT e FROM Event e JOIN FETCH e.organizer WHERE e.approvalStatus = :approvalStatus AND e.status != :status AND LOWER(e.title) LIKE LOWER(CONCAT('%', :title, '%'))")
    Page<Event> findByApprovalStatusAndStatusNotAndTitleContainingIgnoreCase(
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("status") EventStatus status,
        @Param("title") String title,
        Pageable pageable
    );

    List<Event> findByOrganizer_UserID(Long organizerId);
    List<Event> findByEventDate(LocalDate date);
    long countByStatus(EventStatus status);
    long countByOrganizer_UserID(Long organizerID);
    long countByOrganizer_UserIDAndStatusIn(Long organizerID, List<EventStatus> statuses);
}
