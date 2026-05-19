package com.mecscable.billing.security;

import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.CustomerStatus;
import com.mecscable.billing.repository.CustomerRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneId;

@Service
public class CustomerUserDetailsService implements UserDetailsService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final CustomerRepository customerRepository;

    public CustomerUserDetailsService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    // subject in JWT is the customer's phone number
    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("Customer not found: " + phone));
        boolean withinReadOnlyWindow = customer.getSuspendedAt() == null
                || customer.getSuspendedAt().plusYears(2).isAfter(OffsetDateTime.now(IST));
        boolean active = customer.getStatus() == CustomerStatus.ACTIVE
                || ((customer.getStatus() == CustomerStatus.SUSPENDED
                     || customer.getStatus() == CustomerStatus.ACCOUNT_CLOSED)
                    && withinReadOnlyWindow);
        return new UserPrincipal(customer.getCustomerId(), customer.getPhone(), customer.getPasswordHash(), "ROLE_CUSTOMER", active);
    }
}
