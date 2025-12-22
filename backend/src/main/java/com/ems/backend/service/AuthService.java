package com.ems.backend.service;

import com.ems.backend.dto.LoginRequest;
import com.ems.backend.dto.RegisterRequest;
import com.ems.backend.wrappers.Response;

public interface AuthService {
    Response register(RegisterRequest request);
    Response login(LoginRequest request);
}
