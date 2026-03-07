package com.ems.backend.controller;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.ProposalService;
import com.ems.backend.wrappers.Response;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class ProposalController {

    private final ProposalService proposalService;
    private final Validator validator;
    private final ObjectMapper objectMapper; // Injected from JacksonConfig bean

    @GetMapping
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<List<ProposalDTO>>> getMyProposals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        Long organizerID = userDetails.getUser().getUserID();
        List<ProposalDTO> proposals = proposalService.getProposalsByOrganizer(organizerID);

        Response<List<ProposalDTO>> response = Response.<List<ProposalDTO>>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Proposals fetched successfully")
                .data(proposals)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<ProposalDTO>> createProposal(
            @RequestPart("proposal") String proposalJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws Exception {

        ProposalDTO proposalDTO = objectMapper.readValue(proposalJson, ProposalDTO.class);

        var violations = validator.validate(proposalDTO);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }

        Long organizerID = userDetails.getUser().getUserID();
        ProposalDTO createdProposal = proposalService.createProposal(proposalDTO, files, organizerID);

        Response<ProposalDTO> response = Response.<ProposalDTO>builder()
                .statusCode(HttpStatus.CREATED.value())
                .message("Proposal submitted successfully and is pending approval")
                .data(createdProposal)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping(value = "/{proposalID}/resubmit", consumes = {"multipart/form-data"})
    @PreAuthorize("hasRole('ORGANIZER')")
    public ResponseEntity<Response<ProposalDTO>> resubmit(
            @PathVariable Long proposalID,
            @RequestPart("proposal") String proposalJson,
            @RequestPart(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal CustomUserDetails userDetails) throws Exception {

        Long organizerID = userDetails.getUser().getUserID();
        ProposalDTO dto = objectMapper.readValue(proposalJson, ProposalDTO.class);
        ProposalDTO updated = proposalService.updateAndResubmit(proposalID, dto, files, organizerID);

        Response<ProposalDTO> response = Response.<ProposalDTO>builder()
                .statusCode(HttpStatus.OK.value())
                .message("Proposal resubmitted successfully")
                .data(updated)
                .build();

        return ResponseEntity.ok(response);
    }
}
