package com.ems.backend.service.impl;

import com.ems.backend.dto.RegisterRequest;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.Student;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AccountStatus;
import com.ems.backend.enums.AdminDepartment;
import com.ems.backend.enums.AdminLevel;
import com.ems.backend.enums.UserRole;
import com.ems.backend.exception.BadRequestException;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.JwtUtils;
import com.ems.backend.service.AuthService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Override
    public Response register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already in use.");
        }

        User user;

        switch (request.getRole()) {
            case STUDENT -> {
                user = Student.builder()
                        .studentID(request.getStudentID())
                        .major(request.getMajor())
                        .yearOfStudy(request.getYearOfStudy())
                        // Base User fields
                        .email(request.getEmail())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                        .role(UserRole.STUDENT)
                        .accountStatus(AccountStatus.ACTIVE)
                        .build();
            }
            case ORGANIZER -> {
                user = EventOrganizer.builder()
                        .organizationName(request.getOrganizationName())
                        .departmentAffiliation(request.getDepartmentAffiliation())
                        // Base User fields
                        .email(request.getEmail())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                        .role(UserRole.ORGANIZER)
                        .accountStatus(AccountStatus.ACTIVE)
                        .build();
            }
            case ADMIN -> {
                // Public registration always creates STANDARD_ADMIN — SUPER_ADMIN can only be
                // created by an existing SUPER_ADMIN through the admin user management endpoint.
                AdminDepartment dept = AdminDepartment.YOUTH_UNION;
                if (request.getAdminDepartment() != null && !request.getAdminDepartment().isBlank()) {
                    try {
                        dept = AdminDepartment.valueOf(request.getAdminDepartment().toUpperCase());
                    } catch (IllegalArgumentException ignored) {
                        dept = AdminDepartment.YOUTH_UNION;
                    }
                }

                user = Administrator.builder()
                        .adminLevel(AdminLevel.STANDARD_ADMIN)
                        .department(dept)
                        // Base User fields
                        .email(request.getEmail())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .passwordHash(passwordEncoder.encode(request.getPassword()))
                        .role(UserRole.ADMIN)
                        .accountStatus(AccountStatus.ACTIVE)
                        .build();
            }
            default -> throw new BadRequestException("Invalid User Role");
        }

        userRepository.save(user);

        return Response.builder()
                .statusCode(201)
                .message("User Registered Successfully")
                .build();
    }

    @Override
    public com.ems.backend.wrappers.Response<com.ems.backend.dto.AuthResponse> login(com.ems.backend.dto.LoginRequest request) {
        authenticationManager.authenticate(
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new com.ems.backend.exception.NotFoundException("User not found"));

        // OPTIMIZATION: Generate JWT with user claims for stateless auth (no DB lookup on each request)
        var jwtToken = jwtUtils.generateToken(
                user.getEmail(),
                user.getUserID(),
                user.getRole().name(),
                user.getFirstName()
        );

        // Build the DTO first
        String adminDepartment = null;
        String adminLevel = null;
        if (user instanceof Administrator admin) {
            if (admin.getDepartment() != null) {
                adminDepartment = admin.getDepartment().name();
            }
            if (admin.getAdminLevel() != null) {
                adminLevel = admin.getAdminLevel().name();
            }
        }

        com.ems.backend.dto.AuthResponse authResponse = com.ems.backend.dto.AuthResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .id(user.getUserID())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .adminDepartment(adminDepartment)
                .adminLevel(adminLevel)
                .build();

        // Wrap it in the Response
        return com.ems.backend.wrappers.Response.<com.ems.backend.dto.AuthResponse>builder()
                .statusCode(200)
                .message("Login Successful")
                .data(authResponse)
                .build();
    }
}

