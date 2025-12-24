package com.ems.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@DiscriminatorValue("ORGANIZER")
@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class EventOrganizer extends User {

    @Column(name = "organization_name")
    private String organizationName;

    @Column(name = "department_affiliation")
    private String departmentAffiliation;

    @OneToMany(mappedBy = "organizer")
    @JsonIgnore // Prevent circular JSON references between organizer and proposals
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Proposal> myProposals;
}
