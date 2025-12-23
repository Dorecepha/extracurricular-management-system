package com.ems.backend.service;

import com.ems.backend.dto.RegistrationDTO;
import com.ems.backend.entity.Event;

import java.util.List;

public interface RegistrationService {
    void registerStudentForEvent(Long eventID, Long studentID);
    List<RegistrationDTO> getMyRegistrations(Long studentID);
    void cancelRegistration(Long registrationID, Long studentID);
    void cancelRegistrationsForEvent(Event event, String reason);
}
