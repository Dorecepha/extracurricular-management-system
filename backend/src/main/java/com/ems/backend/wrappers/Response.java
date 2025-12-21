package com.ems.backend.wrappers;

import lombok.AllArgsConstructor;
import lombok.Builder; // Added
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder // Added
@NoArgsConstructor
@AllArgsConstructor
public class Response<T> {
    private int statusCode;
    private String message;
    private T data;
}
