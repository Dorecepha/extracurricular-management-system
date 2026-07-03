package com.ems.backend.security;

import com.ems.backend.entity.Administrator;
import com.ems.backend.entity.User;
import com.ems.backend.enums.AccountStatus;
import com.ems.backend.enums.AdminLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomUserDetails implements UserDetails {

    private User user;

    // OPTIMIZATION: Fields for JWT-based authentication (no DB lookup)
    private Long userID;
    private String email;
    private String password;
    private String role;
    private String firstName;
    private List<GrantedAuthority> authorities;

    /**
     * OPTIMIZATION: Builder for JWT-based authentication.
     * Creates CustomUserDetails from JWT claims without DB lookup.
     */
    public static CustomUserDetailsBuilder jwtBuilder() {
        return new CustomUserDetailsBuilder();
    }

    public static class CustomUserDetailsBuilder {
        private Long userID;
        private String email;
        private String password;
        private String role;
        private String firstName;

        public CustomUserDetailsBuilder userID(Long userID) { this.userID = userID; return this; }
        public CustomUserDetailsBuilder email(String email) { this.email = email; return this; }
        public CustomUserDetailsBuilder password(String password) { this.password = password; return this; }
        public CustomUserDetailsBuilder role(String role) { this.role = role; return this; }
        public CustomUserDetailsBuilder firstName(String firstName) { this.firstName = firstName; return this; }

        public CustomUserDetails build() {
            CustomUserDetails details = new CustomUserDetails();
            details.setUser(user);
            details.setUserID(userID);
            details.setEmail(email);
            details.setPassword(password);
            details.setRole(role);
            details.setFirstName(firstName);
            if (role != null) {
                details.setAuthorities(List.of(new SimpleGrantedAuthority("ROLE_" + role)));
            }
            return details;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // If using JWT-based auth (no user entity), use pre-built authorities
        if (authorities != null && user == null) {
            return authorities;
        }
        // Fallback to original entity-based logic
        if (user instanceof Administrator admin && admin.getAdminLevel() == AdminLevel.SUPER_ADMIN) {
            return List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    @Override
    public String getPassword() {
        // JWT-based auth uses this.password, entity-based uses user.getPasswordHash()
        if (password != null) {
            return password;
        }
        return user != null ? user.getPasswordHash() : null;
    }

    @Override
    public String getUsername() {
        // JWT-based auth uses this.email, entity-based uses user.getEmail()
        if (email != null) {
            return email;
        }
        return user.getEmail();
    }

    public Long getUserID() {
        if (userID != null) {
            return userID;
        }
        return user != null ? user.getUserID() : null;
    }

    public String getFirstName() {
        if (firstName != null) {
            return firstName;
        }
        return user != null ? user.getFirstName() : null;
    }

    public String getRole() {
        if (role != null) {
            return role;
        }
        return user != null ? user.getRole().name() : null;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        // Only ACTIVE users are "unlocked"
        if (user == null) {
            return true; // JWT-based auth assumes active
        }
        return user.getAccountStatus() == AccountStatus.ACTIVE;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        // Users in SUSPENDED or INACTIVE state cannot log in
        if (user == null) {
            return true; // JWT-based auth assumes enabled
        }
        return user.getAccountStatus() == AccountStatus.ACTIVE;
    }
}
