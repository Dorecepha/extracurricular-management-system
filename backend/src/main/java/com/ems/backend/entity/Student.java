package com.ems.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("STUDENT")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Student extends User {

    @Column(name = "student_id", unique = true)
    private String studentID; // e.g., "S2024001"

    private String major;

    @Column(name = "year_of_study")
    private Integer yearOfStudy;
}