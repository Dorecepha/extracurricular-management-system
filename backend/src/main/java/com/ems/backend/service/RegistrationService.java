package com.ems.backend.service;

import com.ems.backend.dto.RegistrationDTO;
import com.ems.backend.entity.Event;
import com.ems.backend.entity.User;

import java.util.List;
import java.util.Map;

public interface RegistrationService {
    void registerStudentForEvent(Long eventID, Long studentID);
    List<RegistrationDTO> getMyRegistrations(Long studentID);
    void cancelRegistration(Long registrationID, Long studentID);
    void cancelRegistrationsForEvent(Event event, String reason);
    List<Map<String, String>> getParticipantDetails(Long eventID, User requester);
}
