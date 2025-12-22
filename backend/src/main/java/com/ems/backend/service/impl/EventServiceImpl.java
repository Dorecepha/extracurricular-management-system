package com.ems.backend.service.impl;

import com.ems.backend.dto.EventDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.repository.EventRepository;
import com.ems.backend.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<EventDTO> getAllApprovedEvents(Pageable pageable) {
        Page<Event> events = eventRepository.findByApprovalStatus(ApprovalStatus.APPROVED, pageable);
        return events.map(this::convertToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public EventDTO getEventByID(Long eventID) {
        Event event = eventRepository.findById(eventID)
                .orElseThrow(() -> new RuntimeException("Event not found with ID: " + eventID));
        return convertToDTO(event);
    }

    private EventDTO convertToDTO(Event event) {
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
                .organizerID(event.getOrganizer().getUserID())
                .organizerName(event.getOrganizer().getOrganizationName())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}
