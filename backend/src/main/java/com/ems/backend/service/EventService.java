package com.ems.backend.service;

import com.ems.backend.dto.EventDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface EventService {

    Page<EventDTO> getAllApprovedEvents(Pageable pageable, String search);

    List<EventDTO> getEventsByOrganizer(Long organizerID);

    EventDTO getEventByID(Long eventID);
}
