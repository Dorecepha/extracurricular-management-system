package com.ems.backend.service.impl;

import com.ems.backend.dto.UserDTO;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AccountStatus;
import com.ems.backend.enums.UserRole;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.AuditLogService;
import com.ems.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream().map(this::mapToDTO).toList();
    }

    @Override
    @Transactional
    public void updateUserStatus(Long targetUserID, String status, Long adminID) {
        if (targetUserID.equals(adminID)) {
            throw new IllegalStateException("Security violation: You cannot modify your own administrative status.");
        }

        User user = userRepository.findById(targetUserID)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountStatus(AccountStatus.valueOf(status));
        userRepository.save(user);

        auditLogService.log(adminID, "admin@ems.com", "UPDATE_USER_STATUS", "USER", targetUserID, "SUCCESS");
    }

    @Override
    @Transactional
    public void updateUserRole(Long targetUserID, String role, Long adminID) {
        if (targetUserID.equals(adminID)) {
            throw new IllegalStateException("Security violation: You cannot modify your own administrative status.");
        }

        User user = userRepository.findById(targetUserID)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(UserRole.valueOf(role));
        userRepository.save(user);

        auditLogService.log(adminID, "admin@ems.com", "UPDATE_USER_ROLE", "USER", targetUserID, "SUCCESS");
    }

    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .userID(user.getUserID())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .role(user.getRole())
                .accountStatus(user.getAccountStatus())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .build();
    }
}
