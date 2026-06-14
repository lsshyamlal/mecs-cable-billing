package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateCityRequest;
import com.mecscable.billing.dto.response.CityResponse;
import com.mecscable.billing.entity.City;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.AreaRepository;
import com.mecscable.billing.repository.CityRepository;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.EmployeeGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CityService {

    private final CityRepository cityRepository;
    private final AreaRepository areaRepository;
    private final CustomerRepository customerRepository;
    private final EmployeeGroupRepository groupRepository;
    private final AuditService auditService;

    public CityService(CityRepository cityRepository,
                       AreaRepository areaRepository,
                       CustomerRepository customerRepository,
                       EmployeeGroupRepository groupRepository,
                       AuditService auditService) {
        this.cityRepository = cityRepository;
        this.areaRepository = areaRepository;
        this.customerRepository = customerRepository;
        this.groupRepository = groupRepository;
        this.auditService = auditService;
    }

    public List<CityResponse> getAllCities() {
        return cityRepository.findAllByOrderByCityNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CityResponse createCity(CreateCityRequest request, Long adminId) {
        String name = request.cityName().trim();
        if (cityRepository.existsByCityNameIgnoreCase(name)) {
            throw new IllegalArgumentException("City already exists: " + name);
        }
        City city = new City();
        city.setCityName(name);
        city = cityRepository.save(city);
        auditService.log(adminId, "CREATE_CITY", "City", city.getCityId(), null);
        return toResponse(city);
    }

    @Transactional
    public CityResponse updateCity(Long id, CreateCityRequest request, Long adminId) {
        City city = findCity(id);
        String name = request.cityName().trim();
        if (!city.getCityName().equalsIgnoreCase(name)
                && cityRepository.existsByCityNameIgnoreCase(name)) {
            throw new IllegalArgumentException("City already exists: " + name);
        }
        city.setCityName(name);
        city = cityRepository.save(city);
        auditService.log(adminId, "UPDATE_CITY", "City", city.getCityId(), null);
        return toResponse(city);
    }

    @Transactional
    public void deleteCity(Long id, Long adminId) {
        City city = findCity(id);
        long groupCount = groupRepository.countByCity(city);
        if (groupCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete city — " + groupCount + " employee group(s) still belong to it");
        }
        long areaCount = areaRepository.countByCity(city);
        if (areaCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete city — " + areaCount + " area(s) still belong to it");
        }
        long customerCount = customerRepository.countByAreaCity(city);
        if (customerCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete city — " + customerCount + " customer(s) still belong to it");
        }
        cityRepository.delete(city);
        auditService.log(adminId, "DELETE_CITY", "City", id, null);
    }

    private City findCity(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + id));
    }

    private CityResponse toResponse(City city) {
        return new CityResponse(city.getCityId(), city.getCityName());
    }
}
