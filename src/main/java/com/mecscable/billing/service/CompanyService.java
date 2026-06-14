package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateCompanyRequest;
import com.mecscable.billing.dto.request.UpdateCompanyRequest;
import com.mecscable.billing.dto.response.CityResponse;
import com.mecscable.billing.dto.response.CompanyResponse;
import com.mecscable.billing.entity.City;
import com.mecscable.billing.entity.Company;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.CityRepository;
import com.mecscable.billing.repository.CompanyRepository;
import com.mecscable.billing.repository.EmployeeGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final EmployeeGroupRepository groupRepository;
    private final CityRepository cityRepository;
    private final AuditService auditService;

    public CompanyService(CompanyRepository companyRepository,
                          EmployeeGroupRepository groupRepository,
                          CityRepository cityRepository,
                          AuditService auditService) {
        this.companyRepository = companyRepository;
        this.groupRepository = groupRepository;
        this.cityRepository = cityRepository;
        this.auditService = auditService;
    }

    public List<CompanyResponse> getAllCompanies() {
        return companyRepository.findAllByOrderByCompanyNameAsc()
                .stream().map(this::toResponse).toList();
    }

    public CompanyResponse getCompany(Long id) {
        return toResponse(findCompany(id));
    }

    @Transactional
    public CompanyResponse createCompany(CreateCompanyRequest request, Long adminId) {
        String name = request.companyName().trim();
        if (companyRepository.existsByCompanyNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Company already exists: " + name);
        }
        Company company = new Company();
        company.setCompanyName(name);
        company = companyRepository.save(company);
        auditService.log(adminId, "CREATE_COMPANY", "Company", company.getCompanyId(), null);
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse updateCompany(Long id, UpdateCompanyRequest request, Long adminId) {
        Company company = findCompany(id);
        String name = request.companyName().trim();
        if (!company.getCompanyName().equalsIgnoreCase(name)
                && companyRepository.existsByCompanyNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Company already exists: " + name);
        }
        company.setCompanyName(name);
        company.setActive(request.active());
        company = companyRepository.save(company);
        auditService.log(adminId, "UPDATE_COMPANY", "Company", company.getCompanyId(), null);
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse linkCity(Long id, Long cityId, Long adminId) {
        Company company = findCompany(id);
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + cityId));
        company.getCities().add(city);
        company = companyRepository.save(company);
        auditService.log(adminId, "LINK_CITY", "Company", id, null);
        return toResponse(company);
    }

    @Transactional
    public CompanyResponse unlinkCity(Long id, Long cityId, Long adminId) {
        Company company = findCompany(id);
        City city = cityRepository.findById(cityId)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + cityId));
        if (groupRepository.existsByCompanyAndCity(company, city)) {
            throw new IllegalArgumentException(
                    "Cannot remove city — employee groups still exist for this company in that city");
        }
        company.getCities().remove(city);
        company = companyRepository.save(company);
        auditService.log(adminId, "UNLINK_CITY", "Company", id, null);
        return toResponse(company);
    }

    @Transactional
    public void deleteCompany(Long id, Long adminId) {
        Company company = findCompany(id);
        long groupCount = groupRepository.findByCompanyOrderByGroupNameAsc(company).size();
        if (groupCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete company — " + groupCount + " group(s) still belong to it");
        }
        companyRepository.delete(company);
        auditService.log(adminId, "DELETE_COMPANY", "Company", id, null);
    }

    private Company findCompany(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found: " + id));
    }

    private CompanyResponse toResponse(Company c) {
        List<CityResponse> cities = c.getCities().stream()
                .map(city -> new CityResponse(city.getCityId(), city.getCityName()))
                .sorted((a, b) -> a.cityName().compareToIgnoreCase(b.cityName()))
                .toList();
        return new CompanyResponse(c.getCompanyId(), c.getCompanyName(), c.isActive(), cities, c.getCreatedAt());
    }
}
