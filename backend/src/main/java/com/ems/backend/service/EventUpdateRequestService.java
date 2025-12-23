package com.ems.backend.service;

import com.ems.backend.dto.EventUpdateRequestDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EventUpdateRequestService {

    EventUpdateRequestDTO submitUpdateRequest(Long eventID, EventUpdateRequestDTO dto, MultipartFile[] files, Long organizerID);

    List<EventUpdateRequestDTO> getPendingRequests();

    void approveRequest(Long requestID, Long adminID, boolean notify);

    void rejectRequest(Long requestID, String reason, Long adminID, boolean notify);

    EventUpdateRequestDTO getById(Long requestID);
}
