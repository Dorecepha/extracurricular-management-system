package com.ems.backend.exception;

import com.ems.backend.wrappers.Response;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Response<Void>> handleBusinessLogicError(IllegalStateException e) {
        // Return a 400 Bad Request with the specific logic error message
        return ResponseEntity.status(400).body(new Response<>(400, e.getMessage(), null));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Response<Void>> handleEntityNotFound(EntityNotFoundException e) {
        log.warn("Entity not found: {}", e.getMessage());
        return ResponseEntity.status(404).body(
                new Response<>(404, "Resource not found: " + e.getMessage(), null)
        );
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Response<Void>> handleGeneralError(RuntimeException e) {
        log.error("CRITICAL SYSTEM ERROR [{}]: {}", e.getClass().getSimpleName(), e.getMessage(), e);
        return ResponseEntity.status(500).body(
                new Response<>(500,
                        "An unexpected system error occurred. Please contact university support.",
                        null)
        );
    }
}
