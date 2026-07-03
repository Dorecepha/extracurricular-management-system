package com.ems.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        try {
            String token = getTokenFromRequest(request);

            if (token != null) {
                String email = jwtUtils.getUsernameFromToken(token);

                if (StringUtils.hasText(email) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // OPTIMIZATION: Try to extract user from JWT claims first (no DB lookup)
                    UserDetails userDetails = extractUserFromJwtClaims(token);

                    if (userDetails == null) {
                        // Fallback to DB lookup for backward compatibility
                        userDetails = customUserDetailsService.loadUserByUsername(email);
                    }

                    if (jwtUtils.isTokenValid(token, userDetails)) {
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Cannot set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * OPTIMIZATION: Create CustomUserDetails from JWT claims without DB lookup.
     * This eliminates 2,500 DB queries per load test!
     */
    private UserDetails extractUserFromJwtClaims(String token) {
        try {
            Long userId = jwtUtils.extractUserId(token);
            String role = jwtUtils.extractRole(token);
            String firstName = jwtUtils.extractFirstName(token);

            // If we have user info in JWT claims, create a lightweight UserDetails
            if (userId != null && role != null) {
                log.debug("Creating user from JWT claims - userId: {}, role: {}", userId, role);
                return CustomUserDetails.builder()
                        .userID(userId)
                        .email(jwtUtils.getUsernameFromToken(token))
                        .password(null)
                        .role(role)
                        .firstName(firstName)
                        .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + role)))
                        .build();
            }
        } catch (Exception e) {
            log.debug("Could not extract user from JWT claims, falling back to DB: {}", e.getMessage());
        }
        return null;
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
