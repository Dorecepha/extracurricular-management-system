package com.ems.backend.dto;

import com.ems.backend.enums.AccountStatus;
import com.ems.backend.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long userID;
    private String email;
    private String firstName;
    private String lastName;
    private UserRole role;
    private AccountStatus accountStatus;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}
