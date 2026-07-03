package com.ems.backend.service;

import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.EventUpdateRequest;
import com.ems.backend.enums.ApprovalStage;
import com.ems.backend.enums.ApprovalStatus;

public interface EventUpdateApprovalService {
    void recordDecision(EventUpdateRequest request, ApprovalStage stage, ApprovalStatus decision,
                        Administrator approver, String comment);
}
