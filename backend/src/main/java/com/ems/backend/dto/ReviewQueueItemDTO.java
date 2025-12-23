package com.ems.backend.dto;

import com.ems.backend.enums.ReviewType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewQueueItemDTO {
    private Long id;
    private Long eventID;
    private String title;
    private ReviewType reviewType;
    private LocalDateTime submittedAt;
}
