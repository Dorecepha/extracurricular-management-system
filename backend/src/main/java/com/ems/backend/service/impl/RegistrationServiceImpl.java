package com.ems.backend.service.impl;

import com.ems.backend.dto.RegistrationDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.Registration;
import com.ems.backend.entity.Student;
import com.ems.backend.entity.User;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.RegistrationStatus;
import com.ems.backend.enums.UserRole;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.RegistrationRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.service.RegistrationService;
import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RegistrationServiceImpl implements RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public void registerStudentForEvent(Long eventID, Long studentID) {
        int maxAttempts = 3;
        int attempt = 0;

        while (attempt < maxAttempts) {
            try {
                Event event = eventRepository.findById(eventID)
                        .orElseThrow(() -> new NotFoundException("Event not found with ID: " + eventID));

                if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.COMPLETED) {
                    throw new IllegalStateException("Registrations are closed for this event.");
                }

                User user = userRepository.findById(studentID)
                        .orElseThrow(() -> new NotFoundException("Student not found with ID: " + studentID));
                if (!(user instanceof Student)) {
                    throw new IllegalStateException("User is not a student.");
                }
                Student student = (Student) user;

                // 2. Initial Validations
                if (registrationRepository.existsByStudent_UserIDAndEvent_EventID(studentID, eventID)) {
                    return; // Already registered - treat as success to be user-friendly
                }
                boolean hasOverlap = registrationRepository.existsByStudentAndDateOverlap(
                        studentID, event.getEventDate(), event.getStartTime(), event.getEndTime());
                if (hasOverlap) {
                    throw new IllegalStateException("Schedule conflict: You have another event registered during this time slot.");
                }
                Integer currentRegistrations = event.getCurrentRegistrations() == null
                        ? 0
                        : event.getCurrentRegistrations();
                if (currentRegistrations >= event.getCapacity()) {
                    throw new IllegalStateException("This event has reached full capacity.");
                }

                // 3. THE GATEKEEPER: Update the Event Count FIRST
                event.setCurrentRegistrations(currentRegistrations + 1);

                // DNA: saveAndFlush forces the @Version check IMMEDIATELY.
                // If another device moved first, this line throws the Exception.
                eventRepository.saveAndFlush(event);

                // 4. THE RECORD: Only create registration if the Gatekeeper allowed us through
                String confirmationCode = "REG-" + java.util.UUID.randomUUID()
                        .toString()
                        .substring(0, 8)
                        .toUpperCase();
                Registration registration = Registration.builder()
                        .event(event)
                        .student(student)
                        .status(RegistrationStatus.CONFIRMED)
                        .confirmationNumber(confirmationCode)
                        .registeredAt(LocalDateTime.now())
                        .build();

                registrationRepository.saveAndFlush(registration);

                // 5. Success
                sendConfirmationEmail(student, event, confirmationCode);
                return;

            } catch (ObjectOptimisticLockingFailureException e) {
                attempt++;
                if (attempt >= maxAttempts) {
                    throw new IllegalStateException("High traffic detected. Please try again.");
                }
                // OPTIMIZATION: Exponential backoff with jitter (Week 3)
                // Formula: backoffMs = (2^attempt * 25) + random(0-25), capped at 200ms
                long backoffMs = (long) (Math.pow(2, attempt) * 25 + Math.random() * 25);
                backoffMs = Math.min(backoffMs, 200);
                try {
                    Thread.sleep(backoffMs);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<RegistrationDTO> getMyRegistrations(Long studentID) {
        List<Registration> registrations = registrationRepository.findByStudent_UserID(studentID);

        return registrations.stream().map(reg -> {
            Event event = reg.getEvent();
            return RegistrationDTO.builder()
                    .registrationID(reg.getRegistrationID())
                    .eventID(event.getEventID())
                    .eventTitle(event.getTitle())
                    .eventDate(event.getEventDate() != null ? event.getEventDate().toString() : null)
                    .venue(event.getVenue())
                    .status(reg.getStatus())
                    .registeredAt(reg.getRegisteredAt())
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public void cancelRegistration(Long registrationID, Long studentID) {
        Registration registration = registrationRepository.findById(registrationID)
                .orElseThrow(() -> new NotFoundException("Registration not found with ID: " + registrationID));

        if (!registration.getStudent().getUserID().equals(studentID)) {
            throw new IllegalStateException("Unauthorized to cancel this registration.");
        }

        Event event = registration.getEvent();
        LocalDateTime eventStart = LocalDateTime.of(event.getEventDate(), event.getStartTime());
        if (Duration.between(LocalDateTime.now(), eventStart).toHours() < 24) {
            throw new IllegalStateException("Cancellation Policy: You must provide at least 24 hours notice to cancel your registration.");
        }

        Integer currentRegistrations = event.getCurrentRegistrations() == null
                ? 0
                : event.getCurrentRegistrations();
        event.setCurrentRegistrations(Math.max(0, currentRegistrations - 1));
        eventRepository.save(event);

        registrationRepository.delete(registration);
    }

    @Override
    @Transactional
    public void cancelRegistrationsForEvent(Event event, String reason) {
        if (event == null) {
            throw new IllegalArgumentException("Event cannot be null when cancelling registrations.");
        }

        List<Registration> registrations = registrationRepository.findByEvent_EventID(event.getEventID());
        String cancellationReason = (reason == null || reason.isBlank())
                ? "Event cancelled"
                : reason;
        LocalDateTime now = LocalDateTime.now();

        registrations.forEach(reg -> {
            reg.setStatus(RegistrationStatus.CANCELLED);
            reg.setCancelledAt(now);
            reg.setCancellationReason(cancellationReason);
        });
        registrationRepository.saveAll(registrations);

        event.setCurrentRegistrations(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, String>> getParticipantDetails(Long eventID, User requester) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new NotFoundException("Event not found with ID: " + eventID));

        if (requester.getRole() == UserRole.ORGANIZER) {
            Long organizerId = event.getOrganizer() != null ? event.getOrganizer().getUserID() : null;
            if (organizerId == null || !organizerId.equals(requester.getUserID())) {
                throw new IllegalStateException("Unauthorized to view participants for this event.");
            }
        }

        List<Registration> registrations = registrationRepository.findByEvent_EventID(eventID);
        return registrations.stream()
                .map(reg -> {
                    Student student = reg.getStudent();
                    String firstName = student.getFirstName() != null ? student.getFirstName() : "";
                    String lastName = student.getLastName() != null ? student.getLastName() : "";
                    String name = (firstName + " " + lastName).trim();
                    Map<String, String> map = new HashMap<>();
                    map.put("name", name.isBlank() ? "Student" : name);
                    map.put("email", student.getEmail());
                    return map;
                })
                .toList();
    }

    private void sendConfirmationEmail(Student student, Event event, String confirmationCode) {
        String emailBody = String.format(
                "Hello %s,%n%nYour registration for '%s' is confirmed.%n" +
                        "Confirmation Number: %s%n" +
                        "Venue: %s%nDate: %s%n%nSee you there!",
                student.getFirstName(),
                event.getTitle(),
                confirmationCode,
                event.getVenue(),
                event.getEventDate().toString()
        );

        emailService.sendNotification(student.getEmail(), "Registration Confirmed", emailBody);
    }
}
