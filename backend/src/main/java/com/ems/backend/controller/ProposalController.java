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

import java.util.List;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;

    @GetMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<List<ProposalDTO>>> getMyProposals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerID = userDetails.getUserID();
        List<ProposalDTO> proposals = proposalService.getProposalsByOrganizer(organizerID);

        Response<List<ProposalDTO>> response = Response.<List<ProposalDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Proposals fetched successfully")
                .data(proposals)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<ProposalDTO>> createProposal(
            @Valid @RequestBody ProposalDTO proposalDTO,
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerID = userDetails.getUserID();
        ProposalDTO createdProposal = proposalService.createProposal(proposalDTO, organizerID);

        Response<ProposalDTO> response = Response.<ProposalDTO>builder()
                .statusCode(HttpStatus.CREATED.value())
                .message("Proposal submitted successfully and is pending approval")
                .data(createdProposal)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{proposalID}/resubmit")
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<ProposalDTO>> resubmit(
            @PathVariable Long proposalID,
            @RequestBody ProposalDTO dto) {

        ProposalDTO updated = proposalService.updateAndResubmit(proposalID, dto);

        Response<ProposalDTO> response = Response.<ProposalDTO>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Proposal resubmitted successfully")
                .data(updated)
                .build();

        return ResponseEntity.ok(response);
    }
}
