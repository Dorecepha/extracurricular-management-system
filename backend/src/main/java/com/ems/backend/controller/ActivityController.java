package com.ems.backend.controller;

import com.ems.backend.entity.AuditLog;
import com.ems.backend.repository.AuditLogRepository;
import com.ems.backend.wrappers.Response;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/activity")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ActivityController {
    private final AuditLogRepository auditLogRepo;
    private final ObjectMapper objectMapper;

    @GetMapping("/logs")
    public ResponseEntity<Response<Page<AuditLog>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "timestamp") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort sort = direction.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        return ResponseEntity.ok(new Response<>(200, "Logs fetched", auditLogRepo.findAll(pageable)));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLogs() throws Exception {
        List<AuditLog> allLogs = auditLogRepo.findAll(Sort.by("timestamp").descending());
        byte[] jsonData = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(allLogs);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ems_audit_export.json")
                .contentType(MediaType.APPLICATION_JSON)
                .body(jsonData);
    }
}
