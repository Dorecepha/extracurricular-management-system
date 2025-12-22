package com.ems.backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record ProposalRequest(
    @NotBlank String title,
    @NotBlank String description,
    @NotBlank String location,
    @NotNull @Future LocalDate proposedDate,
    @NotNull LocalTime startTime,
    @NotNull LocalTime endTime,
    @NotNull @Min(1) Integer capacity,
    @NotBlank String organizationType,
    String attachmentsJson
) {}