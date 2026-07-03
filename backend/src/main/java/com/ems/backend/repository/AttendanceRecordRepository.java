package com.ems.backend.repository;

import com.ems.backend.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findByReportID(Long reportID);

    List<AttendanceRecord> findByEventID(Long eventID);

    List<AttendanceRecord> findByReportIDAndCertEligibleTrue(Long reportID);

    void deleteByReportID(Long reportID);
}
