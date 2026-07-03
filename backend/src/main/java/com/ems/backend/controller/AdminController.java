package com.ems.backend.controller;

import com.ems.backend.dto.ProposalDTO;
import com.ems.backend.dto.ReviewQueueItemDTO;
import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AdminDepartment;
import com.ems.backend.enums.ReviewType;
import com.ems.backend.exception.ForbiddenException;
import com.ems.backend.exception.NotFoundException;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.security.CustomUserDetails;
import com.ems.backend.service.EventUpdateRequestService;
import com.ems.backend.service.ProposalService;
import com.ems.backend.wrappers.Response;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final ProposalService proposalService;
    private final EventUpdateRequestService eventUpdateRequestService;
    private final UserRepository userRepository;

    public record RejectionRequest(String rejectionReason) {}
    public record ApprovalRequest(String comment) {}

    @GetMapping("/proposals")
    public ResponseEntity<Response<List<ProposalDTO>>> getPendingProposals(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        AdminDepartment dept = resolveAdminDepartment(userDetails);
        List<ProposalDTO> proposals = proposalService.getProposalsForAdmin(dept);
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposals for department " + dept.name() + " retrieved successfully",
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
    public ResponseEntity<Response<Void>> approve(
            @PathVariable Long proposalID,
            @RequestBody(required = false) ApprovalRequest request) {
        String comment = (request != null) ? request.comment() : null;
        proposalService.approveProposal(proposalID, comment);
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposal approved successfully",
                null
        ));
    }

    @PutMapping("/proposals/{proposalID}/reject")
    public ResponseEntity<Response<Void>> reject(
            @PathVariable Long proposalID,
            @RequestBody RejectionRequest request) {
        proposalService.rejectProposal(proposalID, request.rejectionReason());
        return ResponseEntity.ok(new Response<>(
                200,
                "Proposal has been rejected",
                null
        ));
    }

    @GetMapping("/queue")
    public ResponseEntity<Response<List<ReviewQueueItemDTO>>> getUnifiedQueue(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<ReviewQueueItemDTO> queue = new ArrayList<>();

        AdminDepartment dept = resolveAdminDepartment(userDetails);
        proposalService.getProposalsForAdmin(dept).forEach(proposal ->
                queue.add(ReviewQueueItemDTO.builder()
                        .id(proposal.getProposalID())
                        .title(proposal.getTitle())
                        .reviewType(ReviewType.NEW_PROPOSAL)
                        .submittedAt(proposal.getSubmittedAt())
                        .build())
        );

        eventUpdateRequestService.getPendingRequestsForAdmin(extractAdmin(userDetails)).forEach(update ->
                queue.add(ReviewQueueItemDTO.builder()
                        .id(update.getRequestID())
                        .eventID(update.getEventID())
                        .title(update.getUpdatedTitle() != null
                                ? update.getUpdatedTitle()
                                : update.getEventTitle() != null
                                ? update.getEventTitle()
                                : "Event Update Request")
                        .reviewType(ReviewType.MODIFICATION)
                        .submittedAt(update.getSubmittedAt())
                        .build())
        );

        queue.sort(Comparator.comparing(ReviewQueueItemDTO::getSubmittedAt,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .reversed());

        return ResponseEntity.ok(new Response<>(
                200,
                "Unified review queue retrieved successfully",
                queue
        ));
    }

    private AdminDepartment resolveAdminDepartment(CustomUserDetails userDetails) {
        Administrator admin = extractAdmin(userDetails);
        if (admin.getDepartment() == null) {
            throw new ForbiddenException("Administrator has no department assigned.");
        }
        return admin.getDepartment();
    }

    private Administrator extractAdmin(CustomUserDetails userDetails) {
        User user = userRepository.findById(userDetails.getUserID())
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (!(user instanceof Administrator admin)) {
            throw new ForbiddenException("Only administrators can access this resource");
        }
        return admin;
    }
}

