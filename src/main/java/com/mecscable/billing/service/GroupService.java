package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateGroupRequest;
import com.mecscable.billing.dto.response.GroupResponse;
import com.mecscable.billing.entity.Company;
import com.mecscable.billing.entity.EmployeeGroup;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.CompanyRepository;
import com.mecscable.billing.repository.EmployeeGroupRepository;
import com.mecscable.billing.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class GroupService {

    private final EmployeeGroupRepository groupRepository;
    private final CompanyRepository companyRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    public GroupService(EmployeeGroupRepository groupRepository,
                        CompanyRepository companyRepository,
                        EmployeeRepository employeeRepository,
                        AuditService auditService) {
        this.groupRepository = groupRepository;
        this.companyRepository = companyRepository;
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    public List<GroupResponse> getAllGroups() {
        return groupRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<GroupResponse> getGroupsByCompany(Long companyId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + companyId));
        return groupRepository.findByCompanyOrderByGroupNameAsc(company)
                .stream().map(this::toResponse).toList();
    }

    public GroupResponse getGroup(Long id) {
        return toResponse(findGroup(id));
    }

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, Long adminId) {
        Company company = companyRepository.findById(request.companyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.companyId()));

        String name = request.groupName().trim();
        if (groupRepository.existsByCompanyAndGroupNameIgnoreCase(company, name)) {
            throw new IllegalArgumentException("Group already exists in this company: " + name);
        }

        EmployeeGroup group = new EmployeeGroup();
        group.setCompany(company);
        group.setGroupName(name);
        group = groupRepository.save(group);
        auditService.log(adminId, "CREATE_GROUP", "EmployeeGroup", group.getGroupId(), null);
        return toResponse(group);
    }

    @Transactional
    public GroupResponse updateGroup(Long id, CreateGroupRequest request, Long adminId) {
        EmployeeGroup group = findGroup(id);
        Company company = companyRepository.findById(request.companyId())
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + request.companyId()));

        String name = request.groupName().trim();
        boolean changed = !group.getGroupName().equalsIgnoreCase(name)
                || !group.getCompany().getCompanyId().equals(company.getCompanyId());
        if (changed && groupRepository.existsByCompanyAndGroupNameIgnoreCase(company, name)) {
            throw new IllegalArgumentException("Group already exists in this company: " + name);
        }

        group.setCompany(company);
        group.setGroupName(name);
        group = groupRepository.save(group);
        auditService.log(adminId, "UPDATE_GROUP", "EmployeeGroup", group.getGroupId(), null);
        return toResponse(group);
    }

    @Transactional
    public void deleteGroup(Long id, Long adminId) {
        EmployeeGroup group = findGroup(id);
        long empCount = employeeRepository.findByGroupOrderByFirstNameAsc(group).size();
        if (empCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete group — " + empCount + " employee(s) still belong to it");
        }
        groupRepository.delete(group);
        auditService.log(adminId, "DELETE_GROUP", "EmployeeGroup", id, null);
    }

    private EmployeeGroup findGroup(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + id));
    }

    private GroupResponse toResponse(EmployeeGroup g) {
        return new GroupResponse(
                g.getGroupId(),
                g.getCompany().getCompanyId(),
                g.getCompany().getCompanyName(),
                g.getGroupName(),
                g.getCreatedAt()
        );
    }
}
