package com.ems.backend.service.impl;

import com.ems.backend.dto.EventDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.enums.EventStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.repository.RegistrationRepository;
import com.ems.backend.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
    public EventDTO getEventByID(Long eventID, Long currentUserID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new RuntimeException("Event not found with ID: " + eventID));
        return mapToHydratedDTO(event, currentUserID);
    }

    private EventDTO mapToHydratedDTO(Event event, Long currentUserID) {
        boolean registered = false;
        boolean isOwner = false;
        if (currentUserID != null) {
            registered = registrationRepository.existsByStudent_UserIDAndEvent_EventID(currentUserID, event.getEventID());
            isOwner = event.getOrganizer() != null && currentUserID.equals(event.getOrganizer().getUserID());
        }

        Long organizerID = event.getOrganizer() != null ? event.getOrganizer().getUserID() : null;
        String organizerName = event.getOrganizer() != null ? event.getOrganizer().getOrganizationName() : null;

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
