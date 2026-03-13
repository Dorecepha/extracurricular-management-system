package com.ems.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_photos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "photo_id")
    private Long photoID;

    @Column(name = "report_id", nullable = false)
    private Long reportID;

    @Column(name = "file_id", nullable = false)
    private String fileID;

    @Column
    private String label;

    @Column(name = "order_index")
    private Integer orderIndex;

    @Column(name = "uploaded_at")
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
