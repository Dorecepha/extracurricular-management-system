package com.ems.backend.entity;

import com.ems.backend.enums.AttendanceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attendance_id")
    private Long attendanceID;

    @Column(name = "report_id", nullable = false)
    private Long reportID;

    @Column(name = "event_id", nullable = false)
    private Long eventID;

    @Column(name = "student_id")
    private Long studentID;

    @Column(name = "mssv")
    private String mssv;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @Column
    private String faculty;

    @Column
    private String role;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_type", nullable = false)
    @Builder.Default
    private AttendanceType attendanceType = AttendanceType.WALK_IN;

    @Column(name = "cert_eligible")
    @Builder.Default
    private Boolean certEligible = false;

    @Column(name = "prize_note")
    private String prizeNote;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
