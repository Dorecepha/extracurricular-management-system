package com.ems.backend.controller;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.ProposalService;
import com.ems.backend.wrappers.Response;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<ProposalDTO>> createProposal(
            @Valid @RequestBody ProposalDTO proposalDTO,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerID = userDetails.getUser().getUserID();
        ProposalDTO createdProposal = proposalService.createProposal(proposalDTO, organizerID);

        Response<ProposalDTO> response = Response.<ProposalDTO>builder()
                .statusCode(HttpStatus.CREATED.value())
                .message("Proposal submitted successfully and is pending approval")
                .data(createdProposal)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
