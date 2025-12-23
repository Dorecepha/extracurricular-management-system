package com.ems.backend.controller;

import com.ems.backend.entity.AuditLog;
import com.ems.backend.repository.AuditLogRepository;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/activity")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ActivityController {
    private final AuditLogRepository auditLogRepo;

    @GetMapping("/logs")
    public ResponseEntity<Response<List<AuditLog>>> getLogs() {
        return ResponseEntity.ok(new Response<>(200, "Logs fetched", auditLogRepo.findAllByOrderByTimestampDesc()));
    }
}
