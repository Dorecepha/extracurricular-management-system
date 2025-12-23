package com.ems.backend.dto;

import com.ems.backend.enums.RegistrationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationDTO {
    private Long registrationID;
    private Long eventID;
    private String eventTitle;
    private String eventDate;
    private String venue;
    private RegistrationStatus status;
    private LocalDateTime registeredAt;
}
