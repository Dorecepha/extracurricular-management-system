package com.ems.backend.service.impl;

import com.ems.backend.dto.EventDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.RegistrationRepository;
import com.ems.backend.service.EventService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<EventDTO> getAllApprovedEvents(Pageable pageable, String search, Long currentUserID) {
        Page<Event> events;
        if (search != null && !search.isBlank()) {
            events = eventRepository.findByApprovalStatusAndStatusNotAndTitleContainingIgnoreCase(
                    ApprovalStatus.APPROVED,
                    EventStatus.CANCELLED,
                    search.trim(),
                    pageable
            );
        } else {
            events = eventRepository.findByApprovalStatusAndStatusNot(
                    ApprovalStatus.APPROVED,
                    EventStatus.CANCELLED,
                    pageable
            );
        }
        return events.map(event -> mapToHydratedDTO(event, currentUserID));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDTO> getEventsByOrganizer(Long organizerID) {
        return eventRepository.findByOrganizer_UserID(organizerID).stream()
                .filter(event -> event.getStatus() != EventStatus.CANCELLED && event.getStatus() != EventStatus.COMPLETED)
                .map(event -> mapToHydratedDTO(event, organizerID))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EventDTO> getCompletedEventsByOrganizer(Long organizerID) {
        return eventRepository.findByOrganizer_UserID(organizerID).stream()
                .filter(event -> event.getStatus() == EventStatus.COMPLETED)
                .map(event -> mapToHydratedDTO(event, organizerID))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public EventDTO getEventByID(Long eventID, Long currentUserID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new RuntimeException("Event not found with ID: " + eventID));
        return mapToHydratedDTO(event, currentUserID);
    }

    private EventDTO mapToHydratedDTO(Event event, Long currentUserID) {
        boolean registered = false;
        boolean isOwner = false;
        Long organizerID = null;
        String organizerName = null;

        // Defensive handling for organizer access (prevents EntityNotFoundException)
        try {
            if (event.getOrganizer() != null) {
                organizerID = event.getOrganizer().getUserID();
                organizerName = event.getOrganizer().getOrganizationName();

                if (currentUserID != null) {
                    registered = registrationRepository.existsByStudent_UserIDAndEvent_EventID(currentUserID, event.getEventID());
                    isOwner = currentUserID.equals(organizerID);
                }
            } else {
                log.warn("Event {} has null organizer reference", event.getEventID());
            }
        } catch (EntityNotFoundException e) {
            log.warn("Event {} references non-existent organizer - data integrity issue detected", event.getEventID());
            // Leave organizerID and organizerName as null - frontend will handle gracefully
        }

        if (currentUserID != null && organizerID == null) {
            // If we couldn't load organizer but user is authenticated, still check registration
            registered = registrationRepository.existsByStudent_UserIDAndEvent_EventID(currentUserID, event.getEventID());
        }

        return EventDTO.builder()
                .eventID(event.getEventID())
                .title(event.getTitle())
                .description(event.getDescription())
                .eventDate(event.getEventDate())
                .startTime(event.getStartTime())
                .endTime(event.getEndTime())
                .venue(event.getVenue())
                .capacity(event.getCapacity())
                .currentRegistrations(event.getCurrentRegistrations())
                .status(event.getStatus())
                .approvalStatus(event.getApprovalStatus())
                .organizationType(event.getOrganizationType())
                .organizerID(organizerID)
                .organizerName(organizerName)
                .organizationName(organizerName)
                .isRegistered(registered)
                .isOwner(isOwner)
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
