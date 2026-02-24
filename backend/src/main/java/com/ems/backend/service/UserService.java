package com.ems.backend.service;

import com.ems.backend.dto.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
    List<UserDTO> getAllUsers();

    Page<UserDTO> getAllUsers(Pageable pageable, String role, String accountStatus, String search);

    void updateUserStatus(Long targetUserID, String status, Long adminID);

    void updateUserRole(Long targetUserID, String role, Long adminID);
}
