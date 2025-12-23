package com.ems.backend.service.impl;

import com.ems.backend.entity.AuditLog;
import com.ems.backend.repository.AuditLogRepository;
import com.ems.backend.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW) // DNA: Mandatory for Audit Logs
    public void log(Long userID, String email, String action, String type, Long entityID, String result) {
        AuditLog log = AuditLog.builder()
                .userID(userID != null ? userID : 0L)
                .userEmail(email != null ? email : "system@ems.com")
                .action(action)
                .entityType(type)
                .entityID(entityID)
                .result(result)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }
}
