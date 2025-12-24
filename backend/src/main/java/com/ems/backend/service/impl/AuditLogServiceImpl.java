package com.ems.backend.service.impl;

import com.ems.backend.entity.AuditLog;
import com.ems.backend.repository.AuditLogRepository;
import com.ems.backend.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW) // DNA: Mandatory for Audit Logs
    public void log(Long userID, String email, String action, String type, Long entityID, String result, String ip, String ua) {
        HttpServletRequest request = getCurrentHttpRequest();
        String requestIp = request != null ? request.getRemoteAddr() : null;
        String requestUa = request != null ? request.getHeader("User-Agent") : null;

        String safeIp = (ip != null && !ip.isBlank())
                ? ip
                : (requestIp != null && !requestIp.isBlank() ? requestIp : "unknown");
        String safeUa = (ua != null && !ua.isBlank())
                ? ua
                : (requestUa != null && !requestUa.isBlank() ? requestUa : "unknown");

        AuditLog log = AuditLog.builder()
                .userID(userID != null ? userID : 0L)
                .userEmail(email != null ? email : "system@ems.com")
                .action(action)
                .entityType(type)
                .entityID(entityID)
                .result(result)
                .ipAddress(safeIp)
                .userAgent(safeUa)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        try {
            return ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes()).getRequest();
        } catch (IllegalStateException ex) {
            return null;
        }
    }
}
