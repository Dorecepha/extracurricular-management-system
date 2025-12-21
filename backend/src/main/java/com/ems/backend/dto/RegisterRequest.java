package com.ems.backend.dto;

import com.ems.backend.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank(message = "First Name is required")
    private String firstName;

    @NotBlank(message = "Last Name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    // Optional / Role Specific Fields
    private String phoneNumber;

    // Student Specific
    private String studentID; // e.g., "S123456"
    private String major;
    private Integer yearOfStudy;

    // Organizer Specific
    private String organizationName;
    private String departmentAffiliation;
    
    // Admin Specific
    private String adminLevel; // Optional, defaults usually
}
