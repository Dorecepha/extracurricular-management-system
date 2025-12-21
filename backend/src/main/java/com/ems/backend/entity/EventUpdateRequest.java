package com.ems.backend.entity;

import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.OrganizationType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "event_update_requests")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventUpdateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "request_id")
    private Long requestID;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by", nullable = false)
    private EventOrganizer requestedBy;

    // Updated Fields (Nullable)
    @Column(name = "updated_title")
    private String updatedTitle;

    @Column(name = "updated_description", columnDefinition = "TEXT")
    private String updatedDescription;

    @Column(name = "updated_date")
    private LocalDate updatedDate;

    @Column(name = "updated_start_time")
    private LocalTime updatedStartTime;

    @Column(name = "updated_end_time")
    private LocalTime updatedEndTime;

    @Column(name = "updated_venue")
    private String updatedVenue;

    @Column(name = "updated_capacity")
    private Integer updatedCapacity;

    @Enumerated(EnumType.STRING)
    @Column(name = "updated_organization_type")
    private OrganizationType updatedOrganizationType;

    // Status Fields
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(name = "submitted_at")
    @Builder.Default
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private Administrator reviewedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;
}