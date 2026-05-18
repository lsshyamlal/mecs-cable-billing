package com.mecscable.billing.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AdminUserDetailsService adminUserDetailsService;
    private final CustomerUserDetailsService customerUserDetailsService;

    public JwtAuthFilter(JwtService jwtService,
                         AdminUserDetailsService adminUserDetailsService,
                         CustomerUserDetailsService customerUserDetailsService) {
        this.jwtService = jwtService;
        this.adminUserDetailsService = adminUserDetailsService;
        this.customerUserDetailsService = customerUserDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = extractTokenFromCookie(request);

        if (token == null || !jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String subject = jwtService.extractSubject(token);
        String role = jwtService.extractRole(token);

        if (subject != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = "ROLE_ADMIN".equals(role)
                    ? adminUserDetailsService.loadUserByUsername(subject)
                    : customerUserDetailsService.loadUserByUsername(subject);

            UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        filterChain.doFilter(request, response);
    }

    private String extractTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        return Arrays.stream(cookies)
                .filter(c -> "access_token".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
