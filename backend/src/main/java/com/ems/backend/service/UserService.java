package com.ems.backend.service;

import com.ems.backend.dto.UserDTO;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();

    void updateUserStatus(Long targetUserID, String status, Long adminID);

    void updateUserRole(Long targetUserID, String role, Long adminID);
}
