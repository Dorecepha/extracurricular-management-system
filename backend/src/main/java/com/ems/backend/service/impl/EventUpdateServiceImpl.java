package com.ems.backend.service.impl;

import com.ems.backend.dto.EventUpdateRequestDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.EventOrganizer;
import com.ems.backend.entity.EventUpdateRequest;
import com.ems.backend.entity.Registration;
import com.ems.backend.entity.User;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.enums.RegistrationStatus;
import com.ems.backend.enums.UserRole;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.EventUpdateRequestRepository;
import com.ems.backend.repository.RegistrationRepository;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.AuditLogService;
import com.ems.backend.service.EventUpdateRequestService;
import com.ems.backend.service.FileStorageService;
import com.ems.backend.service.RegistrationService;
import com.ems.backend.service.email.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventUpdateServiceImpl implements EventUpdateRequestService {

    private final EventUpdateRequestRepository requestRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final RegistrationRepository registrationRepository;
    private final RegistrationService registrationService;
    private final FileStorageService fileStorageService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Override
    @Transactional
    public EventUpdateRequestDTO submitUpdateRequest(Long eventID, EventUpdateRequestDTO dto, MultipartFile[] files, Long organizerID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new NotFoundException("Event not found with ID: " + eventID));

        User user = userRepository.findById(organizerID)
                .orElseThrow(() -> new NotFoundException("User not found with ID: " + organizerID));
        if (!(user instanceof EventOrganizer organizer)) {
            throw new IllegalStateException("User is not an event organizer");
        }
        if (!event.getOrganizer().getUserID().equals(organizer.getUserID())) {
            throw new IllegalStateException("Organizer is not allowed to update this event");
        }

        int currentRegistrations = event.getCurrentRegistrations() == null
                ? 0
                : event.getCurrentRegistrations();

        if (dto.getUpdatedCapacity() != null && dto.getUpdatedCapacity() < currentRegistrations) {
            throw new IllegalStateException("Updated capacity cannot be less than current registrations");
        }

        String attachmentsJson = fileStorageService.storeFiles(files);

        EventUpdateRequest request = EventUpdateRequest.builder()
                .event(event)
                .requestedBy(organizer)
                .updatedTitle(dto.getUpdatedTitle())
                .updatedDescription(dto.getUpdatedDescription())
                .updatedDate(dto.getUpdatedDate())
                .updatedStartTime(dto.getUpdatedStartTime())
                .updatedEndTime(dto.getUpdatedEndTime())
                .updatedVenue(dto.getUpdatedVenue())
                .updatedCapacity(dto.getUpdatedCapacity())
                .updatedOrganizationType(dto.getUpdatedOrganizationType())
                .updatedStatus(dto.getUpdatedStatus())
                .updateReason(dto.getUpdateReason())
                .attachmentsJson(attachmentsJson)
                .status(ApprovalStatus.PENDING)
                .build();

        EventUpdateRequest saved = requestRepository.save(request);
        return convertToDTO(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventUpdateRequestDTO> getPendingRequests() {
        return requestRepository.findByStatus(ApprovalStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EventUpdateRequestDTO getById(Long requestID) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));
        return convertToDTO(request);
    }

    @Override
    @Transactional
    public void approveRequest(Long requestID, Long adminID, boolean notify) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));

        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Request has already been processed");
        }

        Event event = request.getEvent();
        int currentRegistrations = event.getCurrentRegistrations() == null
                ? 0
                : event.getCurrentRegistrations();

        if (request.getUpdatedCapacity() != null && request.getUpdatedCapacity() < currentRegistrations) {
            throw new IllegalStateException("Updated capacity cannot be less than current registrations");
        }

        if (request.getUpdatedTitle() != null) event.setTitle(request.getUpdatedTitle());
        if (request.getUpdatedDescription() != null) event.setDescription(request.getUpdatedDescription());
        if (request.getUpdatedDate() != null) event.setEventDate(request.getUpdatedDate());
        if (request.getUpdatedStartTime() != null) event.setStartTime(request.getUpdatedStartTime());
        if (request.getUpdatedEndTime() != null) event.setEndTime(request.getUpdatedEndTime());
        if (request.getUpdatedVenue() != null) event.setVenue(request.getUpdatedVenue());
        if (request.getUpdatedCapacity() != null) event.setCapacity(request.getUpdatedCapacity());
        if (request.getUpdatedOrganizationType() != null) event.setOrganizationType(request.getUpdatedOrganizationType());
        if (request.getUpdatedStatus() != null) {
            if (request.getUpdatedStatus() == EventStatus.CANCELLED
                    && event.getStatus() != EventStatus.CANCELLED) {
                registrationService.cancelRegistrationsForEvent(
                        event,
                        "Event cancelled by organizer request");
                event.setStatus(EventStatus.CANCELLED);
            } else {
                event.setStatus(request.getUpdatedStatus());
            }
        }
        event.setUpdatedAt(LocalDateTime.now());

        eventRepository.save(event); // Triggers @Version update

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails userDetails) {
            User admin = userDetails.getUser();

            auditLogService.log(
                    admin.getUserID(),
                    admin.getEmail(),
                    "EVENT_UPDATE_APPROVED",
                    "EVENT",
                    event.getEventID(),
                    "SUCCESS",
                    null,
                    null
            );
        }

        if (notify) {
            emailService.sendNotification(
                    event.getOrganizer().getEmail(),
                    "Modification Approved",
                    "Your changes for '" + event.getTitle() + "' are now live."
            );

            List<Registration> participants = registrationRepository.findByEvent_EventIDAndStatus(
                    event.getEventID(),
                    RegistrationStatus.CONFIRMED
            );

            for (Registration reg : participants) {
                emailService.sendNotification(
                        reg.getStudent().getEmail(),
                        "Important: Event Update",
                        "The event '" + event.getTitle() + "' you are registered for has been updated. "
                                + "Please check the portal for new venue/time details."
                );
            }
        }

        request.setStatus(ApprovalStatus.APPROVED);
        request.setReviewedAt(LocalDateTime.now());

        if (adminID != null) {
            User user = userRepository.findById(adminID)
                    .orElseThrow(() -> new NotFoundException("User not found with ID: " + adminID));
            if (user.getRole() != UserRole.ADMIN) {
                throw new IllegalStateException("User is not an administrator");
            }
            if (user instanceof com.ems.backend.entity.Administrator admin) {
                request.setReviewedBy(admin);
            }
        }

        requestRepository.save(request);
    }

    @Override
    @Transactional
    public void rejectRequest(Long requestID, String reason, Long adminID, boolean notify) {
        EventUpdateRequest request = requestRepository.findById(requestID)
                .orElseThrow(() -> new NotFoundException("Update request not found with ID: " + requestID));

        if (request.getStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Request has already been processed");
        }

        request.setStatus(ApprovalStatus.REJECTED);
        request.setRejectionReason(reason);
        request.setReviewedAt(LocalDateTime.now());

        if (adminID != null) {
            User user = userRepository.findById(adminID)
                    .orElseThrow(() -> new NotFoundException("User not found with ID: " + adminID));
            if (user.getRole() != UserRole.ADMIN) {
                throw new IllegalStateException("User is not an administrator");
            }
            if (user instanceof com.ems.backend.entity.Administrator admin) {
                request.setReviewedBy(admin);
            }
        }

        requestRepository.save(request);
    }

    private EventUpdateRequestDTO convertToDTO(EventUpdateRequest request) {
        Event event = request.getEvent();
        return EventUpdateRequestDTO.builder()
                .requestID(request.getRequestID())
                .eventID(event != null ? event.getEventID() : null)
                .eventTitle(event != null ? event.getTitle() : null)
                .updatedTitle(request.getUpdatedTitle())
                .updatedDescription(request.getUpdatedDescription())
                .updatedDate(request.getUpdatedDate())
                .updatedStartTime(request.getUpdatedStartTime())
                .updatedEndTime(request.getUpdatedEndTime())
                .updatedVenue(request.getUpdatedVenue())
                .updatedCapacity(request.getUpdatedCapacity())
                .updatedOrganizationType(request.getUpdatedOrganizationType())
                .updatedStatus(request.getUpdatedStatus())
                .updateReason(request.getUpdateReason())
                .attachmentsJson(request.getAttachmentsJson())
                .status(request.getStatus())
                .rejectionReason(request.getRejectionReason())
                .submittedAt(request.getSubmittedAt())
                .build();
    }
}
