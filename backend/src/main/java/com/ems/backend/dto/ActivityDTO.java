package com.ems.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityDTO {
    private String actorName;      // User who performed action
    private String actorRole;      // STUDENT, ORGANIZER, ADMIN
    private String action;         // "registered for", "submitted", "approved"
    private String targetName;     // Event/proposal title
    private LocalDateTime timestamp;
    private String navigationUrl;  // Frontend route for click navigation
}
