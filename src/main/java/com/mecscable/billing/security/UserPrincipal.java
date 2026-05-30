package com.mecscable.billing.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final Long userId;
    private final String username;
    private final String password;
    private final List<GrantedAuthority> authorities;
    private final boolean active;
    private final String currentSessionId;

    public UserPrincipal(Long userId, String username, String password, String role, boolean active, String currentSessionId) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.authorities = List.of(new SimpleGrantedAuthority(role));
        this.active = active;
        this.currentSessionId = currentSessionId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getCurrentSessionId() {
        return currentSessionId;
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return password; }
    @Override public String getUsername() { return username; }
    @Override public boolean isEnabled() { return active; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
