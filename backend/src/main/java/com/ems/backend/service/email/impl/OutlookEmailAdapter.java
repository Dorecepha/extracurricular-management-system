package com.ems.backend.service.email.impl;

import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class OutlookEmailAdapter implements EmailService {
    private final JavaMailSender mailSender; // The "Adaptee" (Spring Mail)

    @Override
    @Async // Prevents server timeout when notifying many participants
    public void sendNotification(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("ems-portal@university.edu");
        message.setTo(to);
        message.setSubject("[EMS] " + subject);
        message.setText(body);
        // In dev mode, we print to console; in prod, mailSender.send(message) is called.
        System.out.println("ADAPTER: Sending Email to " + to + " via Outlook System...");
        mailSender.send(message);
    }
    
}
