package com.ems.backend.service;

import com.ems.backend.dto.EventDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EventService {

    Page<EventDTO> getAllApprovedEvents(Pageable pageable);

    EventDTO getEventByID(Long eventID);
}
