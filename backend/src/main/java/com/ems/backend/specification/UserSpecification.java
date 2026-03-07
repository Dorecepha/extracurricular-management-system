package com.ems.backend.specification;

import com.ems.backend.entity.User;
import com.ems.backend.enums.AccountStatus;
import com.ems.backend.enums.UserRole;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class UserSpecification {

    public static Specification<User> filterUsers(String role, String accountStatus, String search) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Filter by role (account type)
            if (role != null && !role.isEmpty()) {
                try {
                    UserRole userRole = UserRole.valueOf(role.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("role"), userRole));
                } catch (IllegalArgumentException e) {
                    // Invalid role, ignore filter
                }
            }

            // Filter by account status
            if (accountStatus != null && !accountStatus.isEmpty()) {
                try {
                    AccountStatus status = AccountStatus.valueOf(accountStatus.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("accountStatus"), status));
                } catch (IllegalArgumentException e) {
                    // Invalid status, ignore filter
                }
            }

            // Search by email or name
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate emailMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("email")),
                        searchPattern
                );
                Predicate firstNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("firstName")),
                        searchPattern
                );
                Predicate lastNameMatch = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("lastName")),
                        searchPattern
                );
                predicates.add(criteriaBuilder.or(emailMatch, firstNameMatch, lastNameMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
