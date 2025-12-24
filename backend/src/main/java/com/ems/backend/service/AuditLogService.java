package com.ems.backend.service;

public interface AuditLogService {
    void log(Long userID, String email, String action, String type, Long entityID, String result, String ip, String ua);
}
