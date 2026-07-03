package com.ems.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
@Slf4j
public class JwtUtils {

    @Value("${expirationInt}")
    private long expirationInt;

    private SecretKey key;

    @Value("${secreteJwtString}")
    private String secreteJwtString;

    @PostConstruct
    private void init() {
        byte[] keyBytes = secreteJwtString.getBytes();
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generate token with user details for stateless authentication (Week 2 Optimization).
     * Includes userId, role, firstName claims to avoid DB lookup on every request.
     */
    public String generateToken(String email, Long userId, String role, String firstName) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("role", role);
        claims.put("firstName", firstName);

        return Jwts.builder()
                .subject(email)
                .claims(claims)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationInt))
                .signWith(key)
                .compact();
    }

    /**
     * Legacy method for backward compatibility (used during development).
     */
    public String generateToken(String email) {
        return generateToken(email, null, null, null);
    }

    public String getUsernameFromToken(String token) {
        return extractClaims(token, Claims::getSubject);
    }

    /**
     * Extract userId from JWT claims (Week 2 Optimization).
     */
    public Long extractUserId(String token) {
        return extractClaim(token, "userId", Long.class);
    }

    /**
     * Extract role from JWT claims (Week 2 Optimization).
     */
    public String extractRole(String token) {
        return extractClaim(token, "role", String.class);
    }

    /**
     * Extract firstName from JWT claims (Week 2 Optimization).
     */
    public String extractFirstName(String token) {
        return extractClaim(token, "firstName", String.class);
    }

    /**
     * Generic method to extract any claim from JWT.
     */
    public <T> T extractClaim(String token, String claimName, Class<T> clazz) {
        Claims claims = extractAllClaims(token);
        return claims.get(claimName, clazz);
    }

    private <T> T extractClaims(String token, Function<Claims, T> claimsTFunction) {
        return claimsTFunction.apply(extractAllClaims(token));
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = getUsernameFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token, Claims::getExpiration).before(new Date());
    }
}
