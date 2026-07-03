package com.ems.backend.entity;

import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ReportStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_event_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostEventReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Long reportID;

    @Column(name = "event_id", nullable = false, unique = true)
    private Long eventID;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private OrganizationType eventType;

    @Column(name = "affiliated_org")
    private String affiliatedOrg;

    @Column(name = "submitter_email")
    private String submitterEmail;

    @Column(name = "submitter_name")
    private String submitterName;

    @Column(name = "submitter_role")
    private String submitterRole;

    @Column(name = "organizer_count")
    private Integer organizerCount;

    @Column(name = "attendee_count")
    private Integer attendeeCount;

    @Column(name = "walk_in_count")
    private Integer walkInCount;

    @Column(name = "iuyouth_article_url")
    private String iuyouthArticleURL;

    @Column(name = "social_media_url")
    private String socialMediaURL;

    @Column(name = "drive_link")
    private String driveLink;

    @Column(name = "total_budget", precision = 15, scale = 2)
    private BigDecimal totalBudget;

    @Column(name = "feedback_file_id")
    private String feedbackFileID;

    @Column(name = "feedback_count")
    private Integer feedbackCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReportStatus status = ReportStatus.NOT_SUBMITTED;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "deadline_at", nullable = false)
    private LocalDateTime deadlineAt;

    @Column(name = "is_late")
    private Boolean isLate;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "previous_rejection_reason")
    private String previousRejectionReason;

    @Column(name = "cert_export_locked")
    @Builder.Default
    private Boolean certExportLocked = false;

    @Column(name = "cert_template_file_id")
    private String certTemplateFileID;

    @Column(name = "created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
