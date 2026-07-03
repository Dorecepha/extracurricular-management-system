package com.ems.backend.service.email.impl;

import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service // DNA: This remains the single active implementation
@RequiredArgsConstructor
@Slf4j
public class OutlookEmailAdapter implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    @Async("emailTaskExecutor") // Use custom thread pool from AsyncConfig
    public void sendNotification(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();

            // DNA: This MUST match your spring.mail.username precisely
            message.setFrom("dorecefa2006@gmail.com"); 
            
            message.setTo(to);
            message.setSubject("[EMS] " + subject);
            message.setText(body);

            mailSender.send(message);
            log.info("MAIL SUCCESS: Email delivered to {}", to);
        } catch (Exception e) {
            log.error("MAIL FAILURE: Delivery failed for {}. Error: {}", to, e.getMessage());
        }
    }
}