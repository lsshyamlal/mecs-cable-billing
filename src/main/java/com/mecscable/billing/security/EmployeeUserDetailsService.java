package com.mecscable.billing.security;

import com.mecscable.billing.entity.Employee;
import com.mecscable.billing.repository.EmployeeRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class EmployeeUserDetailsService implements UserDetailsService {

    private final EmployeeRepository employeeRepository;

    public EmployeeUserDetailsService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    // subject in JWT is the employee's phone number
    @Override
    public UserDetails loadUserByUsername(String phone) throws UsernameNotFoundException {
        Employee employee = employeeRepository.findByPhone(phone)
                .orElseThrow(() -> new UsernameNotFoundException("Employee not found: " + phone));
        return new UserPrincipal(employee.getEmployeeId(), employee.getPhone(),
                employee.getPasswordHash(), "ROLE_EMPLOYEE", employee.isActive(), employee.getCurrentSessionId());
    }
}
