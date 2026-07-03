package com.ems.backend.repository;

import com.ems.backend.entity.PostEventReport;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ReportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PostEventReportRepository extends JpaRepository<PostEventReport, Long> {

    Optional<PostEventReport> findByEventID(Long eventID);

    boolean existsByEventID(Long eventID);

    List<PostEventReport> findByStatus(ReportStatus status);

    List<PostEventReport> findByStatusIn(List<ReportStatus> statuses);

    List<PostEventReport> findByDeadlineAtBeforeAndStatusNotIn(
            LocalDateTime deadline, List<ReportStatus> statuses);

    List<PostEventReport> findByEventType(OrganizationType eventType);

    List<PostEventReport> findByEventTypeAndStatus(OrganizationType eventType, ReportStatus status);

    long countByStatusInAndEventType(List<ReportStatus> statuses, OrganizationType eventType);
}
