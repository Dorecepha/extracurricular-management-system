package com.ems.backend.service.email.impl;

import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutlookEmailAdapter implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    @Async // DNA: NFR-082 Compliance
    public void sendNotification(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("ems-portal@university.edu");
            message.setTo(to);
            message.setSubject("[EMS] " + subject);
            message.setText(body);

            mailSender.send(message);
            log.info("Email successfully sent to: {}", to);
        } catch (Exception e) {
            // DNA: LOG failure but do not throw exception to avoid rolling back DB
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
