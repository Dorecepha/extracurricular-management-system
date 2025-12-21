package com.ems.backend.entity;

import com.ems.backend.enums.AdminLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Entity
@DiscriminatorValue("ADMIN")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Administrator extends User {

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_level")
    private AdminLevel adminLevel;
}