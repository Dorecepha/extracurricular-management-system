package com.ems.backend.repository;

import com.ems.backend.entity.Registration;
import com.ems.backend.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    boolean existsByStudent_UserIDAndEvent_EventID(Long studentId, Long eventId);
    List<Registration> findByStudent_UserID(Long studentId);
    List<Registration> findByEvent_EventIDAndStatus(Long eventId, RegistrationStatus status);
    List<Registration> findByEvent_EventID(Long eventId);
    long countByStudent_UserID(Long studentID);
    long countByEvent_Organizer_UserID(Long organizerID);
    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Registration r " +
           "WHERE r.student.userID = :studentId " +
           "AND r.status = 'CONFIRMED' " +
           "AND r.event.eventDate = :eventDate " +
           "AND r.event.startTime < :endTime " +
           "AND r.event.endTime > :startTime")
    boolean existsByStudentAndDateOverlap(
            @Param("studentId") Long studentId,
            @Param("eventDate") LocalDate eventDate,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );
}
