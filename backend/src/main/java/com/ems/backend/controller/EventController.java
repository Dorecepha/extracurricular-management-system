package com.ems.backend.controller;

import com.ems.backend.dto.EventDTO;
import com.ems.backend.service.EventService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<Response<Page<EventDTO>>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<EventDTO> events = eventService.getAllApprovedEvents(pageable);

        Response<Page<EventDTO>> response = Response.<Page<EventDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventID}")
    public ResponseEntity<Response<EventDTO>> getEventByID(@PathVariable Long eventID) {
        EventDTO event = eventService.getEventByID(eventID);

        Response<EventDTO> response = Response.<EventDTO>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Event retrieved successfully")
                .data(event)
                .build();

        return ResponseEntity.ok(response);
    }
}
