package com.ems.backend.service.impl;

import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.EventUpdateApproval;
import com.ems.backend.entity.EventUpdateRequest;
import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;
import com.ems.backend.repository.EventUpdateApprovalRepository;
import com.ems.backend.service.EventUpdateApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EventUpdateApprovalServiceImpl implements EventUpdateApprovalService {

    private final EventUpdateApprovalRepository repository;

    @Override
    public void recordDecision(EventUpdateRequest request, ApprovalStage stage, ApprovalStatus decision,
                               Administrator approver, String comment) {
        EventUpdateApproval approval = EventUpdateApproval.builder()
                .updateRequest(request)
                .stage(stage)
                .decision(decision)
                .approver(approver)
                .comment(comment)
                .decidedAt(LocalDateTime.now())
                .build();
        repository.save(approval);
    }
}
