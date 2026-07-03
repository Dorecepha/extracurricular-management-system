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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.ems.backend.security.CustomUserDetails;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<Response<Page<EventDTO>>> getAllEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Pageable pageable = PageRequest.of(page, size);
        Long currentUserId = userDetails != null ? userDetails.getUserID() : null;
        Page<EventDTO> events = eventService.getAllApprovedEvents(pageable, search, currentUserId);

        Response<Page<EventDTO>> response = Response.<Page<EventDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Events retrieved successfully")
                .data(events)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{eventID}")
    public ResponseEntity<Response<EventDTO>> getEventByID(@PathVariable Long eventID,
                                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long currentUserId = userDetails != null ? userDetails.getUserID() : null;
        EventDTO event = eventService.getEventByID(eventID, currentUserId);

        Response<EventDTO> response = Response.<EventDTO>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Event retrieved successfully")
                .data(event)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managed")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<List<EventDTO>>> getManagedEvents(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerId = userDetails.getUserID();
        List<EventDTO> managedEvents = eventService.getEventsByOrganizer(organizerId);

        Response<List<EventDTO>> response = Response.<List<EventDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Managed events retrieved successfully")
                .data(managedEvents)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managed/completed")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<List<EventDTO>>> getCompletedManagedEvents(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerId = userDetails.getUserID();
        List<EventDTO> completedEvents = eventService.getCompletedEventsByOrganizer(organizerId);

        Response<List<EventDTO>> response = Response.<List<EventDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Completed events retrieved successfully")
                .data(completedEvents)
                .build();

        return ResponseEntity.ok(response);
    }
}
