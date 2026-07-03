package com.ems.backend.dto;

import com.ems.backend.enums.OrganizationType;
import com.ems.backend.enums.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostEventReportDTO {

    private Long reportID;
    private Long eventID;
    private OrganizationType eventType;
    private String affiliatedOrg;
    private String submitterEmail;
    private String submitterName;
    private String submitterRole;
    private Integer organizerCount;
    private Integer attendeeCount;
    private Integer walkInCount;
    private String iuyouthArticleURL;
    private String socialMediaURL;
    private String driveLink;
    private BigDecimal totalBudget;
    private String feedbackFileID;
    private Integer feedbackCount;
    private ReportStatus status;
    private LocalDateTime submittedAt;
    private LocalDateTime deadlineAt;
    private Boolean isLate;
    private LocalDateTime approvedAt;
    private Long approvedBy;
    private String rejectionReason;
    private String previousRejectionReason;
    private Boolean certExportLocked;
    private String certTemplateFileID;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<PhotoDTO> photos;
    private List<AttendanceDTO> walkInAttendees;
    private Integer attendeeCountTotal;
    private Integer certEligibleCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhotoDTO {
        private Long photoID;
        private String fileID;
        private String label;
        private Integer orderIndex;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceDTO {
        private Long recordID;
        private String studentID;
        private String fullName;
        private String className;
        private String attendanceType;
    }
}
