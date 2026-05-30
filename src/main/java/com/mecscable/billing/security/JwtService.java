package com.mecscable.billing.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {

    @Value("${mecs.jwt.secret}")
    private String secret;

    @Value("${mecs.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${mecs.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    public String generateAccessToken(String subject, String role, Long userId, String sessionId) {
        return Jwts.builder()
                .subject(subject)
                .claim("role", role)
                .claim("userId", userId)
                .claim("sid", sessionId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .signWith(signingKey())
                .compact();
    }

    public String generateRefreshToken(String subject, String sessionId) {
        return Jwts.builder()
                .subject(subject)
                .claim("sid", sessionId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + refreshTokenExpiryMs))
                .signWith(signingKey())
                .compact();
    }

    public String extractSubject(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public Long extractUserId(String token) {
        return extractAllClaims(token).get("userId", Long.class);
    }

    public String extractSessionId(String token) {
        return extractAllClaims(token).get("sid", String.class);
    }

    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}
