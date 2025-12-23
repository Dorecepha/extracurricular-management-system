package com.ems.backend.controller;

import com.ems.backend.dto.EventUpdateRequestDTO;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.EventUpdateRequestService;
import com.ems.backend.wrappers.Response;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/updates")
@RequiredArgsConstructor
public class EventUpdateController {

    public record RejectionRequest(String rejectionReason) {}

    private final EventUpdateRequestService eventUpdateRequestService;
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @PostMapping(value = "/event/{eventID}", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<EventUpdateRequestDTO>> submitUpdateRequest(
            @PathVariable Long eventID,
            @RequestPart("update") String updateJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws Exception {

        EventUpdateRequestDTO dto = mapper.readValue(updateJson, EventUpdateRequestDTO.class);
        Long organizerID = userDetails.getUser().getUserID();
        EventUpdateRequestDTO created = eventUpdateRequestService.submitUpdateRequest(eventID, dto, files, organizerID);

        Response<EventUpdateRequestDTO> response = Response.<EventUpdateRequestDTO>builder()
                .statusCode(HttpStatus.CREATED.value())
                .message("Update request submitted successfully")
                .data(created)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<List<EventUpdateRequestDTO>>> getPendingRequests() {
        List<EventUpdateRequestDTO> pendingRequests = eventUpdateRequestService.getPendingRequests();

        Response<List<EventUpdateRequestDTO>> response = Response.<List<EventUpdateRequestDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Pending event update requests fetched successfully")
                .data(pendingRequests)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestID}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<Void>> approveRequest(
            @PathVariable Long requestID,
            @RequestParam(defaultValue = "false") boolean notify,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long adminID = userDetails.getUser().getUserID();
        eventUpdateRequestService.approveRequest(requestID, adminID, notify);

        Response<Void> response = Response.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Event update request approved and applied" + (notify ? " and participants notified" : ""))
                .data(null)
                .build();

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{requestID}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<Void>> rejectRequest(
            @PathVariable Long requestID,
            @RequestBody RejectionRequest rejectionRequest,
            @RequestParam(defaultValue = "false") boolean notify,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long adminID = userDetails.getUser().getUserID();
        eventUpdateRequestService.rejectRequest(requestID, rejectionRequest.rejectionReason(), adminID, notify);

        Response<Void> response = Response.<Void>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Event update request rejected")
                .data(null)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{requestID}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Response<EventUpdateRequestDTO>> getById(@PathVariable Long requestID) {
        EventUpdateRequestDTO dto = eventUpdateRequestService.getById(requestID);
        return ResponseEntity.ok(new Response<>(200, "Update request retrieved", dto));
    }
}
