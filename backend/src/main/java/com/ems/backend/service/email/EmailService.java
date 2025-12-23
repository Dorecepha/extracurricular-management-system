package com.ems.backend.service.email;

public interface EmailService {
    void sendNotification(String to, String subject, String body);
}
