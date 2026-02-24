package com.ems.backend.controller;

import com.ems.backend.dto.UserDTO;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.UserService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<Response<Page<UserDTO>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String accountStatus,
            @RequestParam(required = false) String search) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserDTO> users = userService.getAllUsers(pageable, role, accountStatus, search);
        return ResponseEntity.ok(new Response<>(200, "User list fetched", users));
    }

    @PutMapping("/{userID}/status")
    public ResponseEntity<Response<Void>> toggleStatus(
            @PathVariable Long userID,
            @RequestParam String status,
            @AuthenticationPrincipal CustomUserDetails admin) {
        userService.updateUserStatus(userID, status, admin.getUser().getUserID());
        return ResponseEntity.ok(new Response<>(200, "Account status updated to " + status, null));
    }

    @PutMapping("/{userID}/role")
    public ResponseEntity<Response<Void>> changeRole(
            @PathVariable Long userID,
            @RequestParam String role,
            @AuthenticationPrincipal CustomUserDetails admin) {
        userService.updateUserRole(userID, role, admin.getUser().getUserID());
        return ResponseEntity.ok(new Response<>(200, "User role updated to " + role, null));
    }
}
