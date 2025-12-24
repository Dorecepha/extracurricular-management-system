package com.ems.backend.exception;

import com.ems.backend.wrappers.Response;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Response<Void>> handleBusinessLogicError(IllegalStateException e) {
        // Return a 400 Bad Request with the specific logic error message
        return ResponseEntity.status(400).body(new Response<>(400, e.getMessage(), null));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Response<Void>> handleGeneralError(RuntimeException e) {
        return ResponseEntity.status(500).body(new Response<>(500, "System Error: " + e.getMessage(), null));
    }
}
