package com.ems.backend.controller;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.service.ProposalService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ProposalService proposalService;
    public record RejectionRequest(String rejectionReason) {}

    @GetMapping("/proposals")
    public ResponseEntity<Response<List<ProposalDTO>>> getPendingProposals() {
        List<ProposalDTO> proposals = proposalService.getPendingProposals();
        return ResponseEntity.ok(new Response<>(
                200,
                "Pending proposals retrieved successfully",
                proposals
        ));
    }

    @GetMapping("/proposals/{proposalID}")
    public ResponseEntity<Response<ProposalDTO>> getProposalById(@PathVariable Long proposalID) {
        ProposalDTO proposal = proposalService.getProposalById(proposalID);
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposal retrieved successfully",
                proposal
        ));
    }

    @PutMapping("/proposals/{proposalID}/approve")
    public ResponseEntity<Response<Void>> approve(@PathVariable Long proposalID) {
        proposalService.approveProposal(proposalID);
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposal approved and Event created",
                null
        ));
    }

    @PutMapping("/proposals/{proposalID}/reject")
    public ResponseEntity<Response<Void>> reject(@PathVariable Long proposalID,
                                                 @RequestBody RejectionRequest request) {
        proposalService.rejectProposal(proposalID, request.rejectionReason());
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposal has been rejected",
                null
        ));
    }
}
