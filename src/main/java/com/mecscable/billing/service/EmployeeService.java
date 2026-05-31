package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.AssignEmployeeAreasRequest;
import com.mecscable.billing.dto.request.CreateEmployeeRequest;
import com.mecscable.billing.dto.request.EmployeeResetPasswordRequest;
import com.mecscable.billing.dto.request.UpdateEmployeeRequest;
import com.mecscable.billing.dto.response.EmployeeResponse;
import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.Employee;
import com.mecscable.billing.entity.EmployeeAreaAssignment;
import com.mecscable.billing.entity.EmployeeGroup;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.AreaRepository;
import com.mecscable.billing.repository.EmployeeAreaAssignmentRepository;
import com.mecscable.billing.repository.EmployeeGroupRepository;
import com.mecscable.billing.repository.EmployeeRepository;
import com.mecscable.billing.repository.PaymentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeGroupRepository groupRepository;
    private final EmployeeAreaAssignmentRepository assignmentRepository;
    private final AreaRepository areaRepository;
    private final PaymentRepository paymentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public EmployeeService(EmployeeRepository employeeRepository,
                           EmployeeGroupRepository groupRepository,
                           EmployeeAreaAssignmentRepository assignmentRepository,
                           AreaRepository areaRepository,
                           PaymentRepository paymentRepository,
                           PasswordEncoder passwordEncoder,
                           AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.groupRepository = groupRepository;
        this.assignmentRepository = assignmentRepository;
        this.areaRepository = areaRepository;
        this.paymentRepository = paymentRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public List<EmployeeResponse> getAllEmployees() {
        return employeeRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<EmployeeResponse> getEmployeesByGroup(Long groupId) {
        EmployeeGroup group = findGroup(groupId);
        return employeeRepository.findByGroupOrderByFirstNameAsc(group)
                .stream().map(this::toResponse).toList();
    }

    public EmployeeResponse getEmployee(Long id) {
        return toResponse(findEmployee(id));
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request, Long adminId) {
        if (employeeRepository.existsByPhone(request.phone())) {
            throw new IllegalArgumentException("Phone already registered: " + request.phone());
        }
        EmployeeGroup group = findGroup(request.groupId());

        Employee employee = new Employee();
        employee.setGroup(group);
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setPhone(request.phone());
        employee.setEmail(request.email());
        employee.setPasswordHash(passwordEncoder.encode(request.password()));
        employee = employeeRepository.save(employee);
        auditService.log(adminId, "CREATE_EMPLOYEE", "Employee", employee.getEmployeeId(), null);
        return toResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, UpdateEmployeeRequest request, Long adminId) {
        Employee employee = findEmployee(id);
        employee.setFirstName(request.firstName());
        employee.setLastName(request.lastName());
        employee.setEmail(request.email());
        employee.setActive(request.active());
        employee = employeeRepository.save(employee);
        auditService.log(adminId, "UPDATE_EMPLOYEE", "Employee", employee.getEmployeeId(), null);
        return toResponse(employee);
    }

    @Transactional
    public void deleteEmployee(Long id, Long adminId) {
        Employee employee = findEmployee(id);
        if (paymentRepository.existsByRecordedByEmployee(employee)) {
            throw new IllegalArgumentException(
                    "Cannot delete employee — they have recorded payment history. Deactivate the account instead.");
        }
        assignmentRepository.deleteAll(assignmentRepository.findByEmployee(employee));
        employeeRepository.delete(employee);
        auditService.log(adminId, "DELETE_EMPLOYEE", "Employee", id, null);
    }

    @Transactional
    public void resetPassword(Long id, EmployeeResetPasswordRequest request, Long adminId) {
        Employee employee = findEmployee(id);
        employee.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        employee.setCurrentSessionId(null);
        employeeRepository.save(employee);
        auditService.log(adminId, "RESET_EMPLOYEE_PASSWORD", "Employee", employee.getEmployeeId(), null);
    }

    @Transactional
    public EmployeeResponse assignAreas(Long id, AssignEmployeeAreasRequest request, Long adminId) {
        Employee employee = findEmployee(id);
        for (Long areaId : request.areaIds()) {
            Area area = areaRepository.findById(areaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + areaId));
            if (assignmentRepository.existsByAreaAndEmployee_GroupAndEmployeeNot(
                    area, employee.getGroup(), employee)) {
                throw new IllegalArgumentException(
                        "Area '" + area.getAreaName() + "' is already assigned to another employee in this group.");
            }
            if (!assignmentRepository.existsByEmployeeAndArea(employee, area)) {
                EmployeeAreaAssignment assignment = new EmployeeAreaAssignment();
                assignment.setEmployee(employee);
                assignment.setArea(area);
                assignmentRepository.save(assignment);
            }
        }
        auditService.log(adminId, "ASSIGN_AREAS", "Employee", employee.getEmployeeId(),
                "{\"areaIds\":" + request.areaIds() + "}");
        return toResponse(employee);
    }

    @Transactional
    public void removeArea(Long employeeId, Long areaId, Long adminId) {
        Employee employee = findEmployee(employeeId);
        Area area = areaRepository.findById(areaId)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + areaId));
        assignmentRepository.deleteByEmployeeAndArea(employee, area);
        auditService.log(adminId, "REMOVE_AREA", "Employee", employee.getEmployeeId(),
                "{\"areaId\":" + areaId + "}");
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + id));
    }

    private EmployeeGroup findGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
    }

    EmployeeResponse toResponse(Employee e) {
        List<EmployeeResponse.AssignedAreaItem> areas = assignmentRepository.findByEmployee(e)
                .stream()
                .map(a -> new EmployeeResponse.AssignedAreaItem(
                        a.getArea().getAreaId(),
                        a.getArea().getAreaName(),
                        a.getArea().getCity().getCityId(),
                        a.getArea().getCity().getCityName()))
                .toList();

        EmployeeGroup group = e.getGroup();
        return new EmployeeResponse(
                e.getEmployeeId(),
                group.getGroupId(),
                group.getGroupName(),
                group.getCompany().getCompanyId(),
                group.getCompany().getCompanyName(),
                e.getFirstName(),
                e.getLastName(),
                e.getPhone(),
                e.getEmail(),
                e.isActive(),
                e.getCreatedAt(),
                areas
        );
    }
}
