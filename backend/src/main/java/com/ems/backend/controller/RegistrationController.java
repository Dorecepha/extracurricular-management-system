package com.ems.backend.controller;

import com.ems.backend.dto.RegistrationDTO;
import com.ems.backend.entity.User;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.RegistrationService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;
    private final UserRepository userRepository;

    @PostMapping("/event/{eventID}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Response<Void>> register(
            @PathVariable Long eventID,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long studentID = userDetails.getUserID();
        registrationService.registerStudentForEvent(eventID, studentID);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new Response<>(201, "Registration successful", null));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Response<List<RegistrationDTO>>> getMyRegistrations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long studentID = userDetails.getUserID();
        List<RegistrationDTO> registrations = registrationService.getMyRegistrations(studentID);

        return ResponseEntity.ok(new Response<>(200, "Registrations retrieved successfully", registrations));
    }

    @DeleteMapping("/{registrationID}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Response<Void>> cancel(
            @PathVariable Long registrationID,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long studentID = userDetails.getUserID();
        registrationService.cancelRegistration(registrationID, studentID);

        return ResponseEntity.ok(new Response<>(200, "Registration cancelled", null));
    }

    @GetMapping("/event/{eventID}/participants")
    @PreAuthorize("hasAnyRole('ADMIN','ORGANIZER')")
    public ResponseEntity<Response<List<Map<String, String>>>> getParticipants(
            @PathVariable Long eventID,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        List<Map<String, String>> participants =
                registrationService.getParticipantDetails(eventID,
                        userRepository.findById(userDetails.getUserID())
                                .orElseThrow(() -> new NotFoundException("User not found")));

        return ResponseEntity.ok(new Response<>(200, "Participants fetched", participants));
    }
}
