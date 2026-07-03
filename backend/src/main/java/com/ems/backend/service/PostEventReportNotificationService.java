package com.ems.backend.service;

import com.ems.backend.entity.Event;
import com.ems.backend.entity.PostEventReport;
import com.ems.backend.enums.ReportStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.PostEventReportRepository;
import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostEventReportNotificationService {

    private final PostEventReportRepository reportRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;

    // Run every day at 9 AM
    @Scheduled(cron = "0 0 9 * * ?")
    public void checkDeadlinesAndSendReminders() {
        LocalDateTime now = LocalDateTime.now();

        // Find all reports that are NOT_SUBMITTED and not past deadline
        List<PostEventReport> pendingReports = reportRepository.findByStatus(ReportStatus.NOT_SUBMITTED);

        for (PostEventReport report : pendingReports) {
            Event event = eventRepository.findById(report.getEventID()).orElse(null);
            if (event == null) continue;

            LocalDateTime deadline = report.getDeadlineAt();
            long daysUntilDeadline = java.time.Duration.between(now, deadline).toDays();

            // Deadline 50% elapsed reminder
            if (daysUntilDeadline > 0 && daysUntilDeadline == (report.getDeadlineAt().toLocalDate().toEpochDay()
                    - report.getCreatedAt().toLocalDate().toEpochDay()) / 2) {
                emailService.sendNotification(
                        event.getOrganizer().getEmail(),
                        "Deadline Halfway: Post-Event Report",
                        "Your post-event report for '" + event.getTitle() + "' is halfway to the deadline. " +
                                "You have " + daysUntilDeadline + " days remaining."
                );
            }

            // Deadline tomorrow reminder
            if (daysUntilDeadline == 1) {
                emailService.sendNotification(
                        event.getOrganizer().getEmail(),
                        "Deadline Tomorrow: Post-Event Report",
                        "Your post-event report for '" + event.getTitle() + "' is due tomorrow! " +
                                "Please submit it before the deadline."
                );
            }

            // Deadline passed reminder
            if (daysUntilDeadline < 0 && daysUntilDeadline >= -3) {
                // Send only once in the 3 days after deadline
                LocalDateTime reminderKey = now.withHour(0).withMinute(0).withSecond(0);
                if (report.getUpdatedAt() == null ||
                        report.getUpdatedAt().withHour(0).withMinute(0).withSecond(0).isBefore(reminderKey)) {
                    emailService.sendNotification(
                            event.getOrganizer().getEmail(),
                            "Deadline Passed: Post-Event Report",
                            "Your post-event report for '" + event.getTitle() + "' is now overdue. " +
                                    "Please submit it as soon as possible."
                    );
                }
            }
        }
    }

    // Manual trigger for testing or specific reminders
    public void sendSubmissionConfirmation(String email, String eventTitle) {
        emailService.sendNotification(
                email,
                "Report Submitted Successfully",
                "Your post-event report for '" + eventTitle + "' has been submitted successfully."
        );
    }

    public void sendApprovalNotification(String email, String eventTitle) {
        emailService.sendNotification(
                email,
                "Report Approved!",
                "Your post-event report for '" + eventTitle + "' has been approved. Congratulations!"
        );
    }

    public void sendRejectionNotification(String email, String eventTitle, String reason) {
        emailService.sendNotification(
                email,
                "Report Rejected",
                "Your post-event report for '" + eventTitle + "' has been rejected. Reason: " + reason +
                        ". Please revise and resubmit."
        );
    }
}
