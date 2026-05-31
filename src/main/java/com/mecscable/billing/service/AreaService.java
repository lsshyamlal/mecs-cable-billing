package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateAreaRequest;
import com.mecscable.billing.dto.response.AreaResponse;
import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.City;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.AreaRepository;
import com.mecscable.billing.repository.CityRepository;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.StreetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AreaService {

    private final AreaRepository areaRepository;
    private final CityRepository cityRepository;
    private final StreetRepository streetRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    public AreaService(AreaRepository areaRepository,
                       CityRepository cityRepository,
                       StreetRepository streetRepository,
                       CustomerRepository customerRepository,
                       AuditService auditService) {
        this.areaRepository = areaRepository;
        this.cityRepository = cityRepository;
        this.streetRepository = streetRepository;
        this.customerRepository = customerRepository;
        this.auditService = auditService;
    }

    public List<AreaResponse> getAllAreas(Long cityId) {
        List<Area> areas = cityId != null
                ? areaRepository.findByCityOrderByAreaNameAsc(findCity(cityId))
                : areaRepository.findAllByOrderByAreaNameAsc();
        return areas.stream().map(this::toResponse).toList();
    }

    @Transactional
    public AreaResponse createArea(CreateAreaRequest request, Long adminId) {
        City city = findCity(request.cityId());
        String name = request.areaName().trim();
        if (areaRepository.existsByCityAndAreaNameIgnoreCase(city, name)) {
            throw new IllegalArgumentException("Area already exists in this city: " + name);
        }
        Area area = new Area();
        area.setCity(city);
        area.setAreaName(name);
        area.setGracePeriodDay(request.gracePeriodDay());
        area = areaRepository.save(area);
        auditService.log(adminId, "CREATE_AREA", "Area", area.getAreaId(), null);
        return toResponse(area);
    }

    @Transactional
    public AreaResponse updateArea(Long id, CreateAreaRequest request, Long adminId) {
        Area area = findArea(id);
        City newCity = findCity(request.cityId());
        String newName = request.areaName().trim();

        boolean cityChanged = !area.getCity().getCityId().equals(newCity.getCityId());
        boolean nameChanged = !area.getAreaName().equalsIgnoreCase(newName);

        if ((cityChanged || nameChanged)
                && areaRepository.existsByCityAndAreaNameIgnoreCase(newCity, newName)
                && !(newCity.getCityId().equals(area.getCity().getCityId())
                     && area.getAreaName().equalsIgnoreCase(newName))) {
            throw new IllegalArgumentException("Area already exists in target city: " + newName);
        }

        if (cityChanged) {
            long customerCount = customerRepository.countByArea(area);
            long streetCount = streetRepository.countByArea(area);
            if (customerCount > 0 || streetCount > 0) {
                throw new IllegalArgumentException(
                        "Cannot move area to a different city — it still has "
                                + streetCount + " street(s) and " + customerCount + " customer(s)");
            }
        }

        area.setCity(newCity);
        area.setAreaName(newName);
        area.setGracePeriodDay(request.gracePeriodDay());
        area = areaRepository.save(area);
        auditService.log(adminId, "UPDATE_AREA", "Area", area.getAreaId(), null);
        return toResponse(area);
    }

    @Transactional
    public void deleteArea(Long id, Long adminId) {
        Area area = findArea(id);
        long streetCount = streetRepository.countByArea(area);
        if (streetCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete area — " + streetCount + " street(s) still belong to it");
        }
        long customerCount = customerRepository.countByArea(area);
        if (customerCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete area — " + customerCount + " customer(s) still belong to it");
        }
        areaRepository.delete(area);
        auditService.log(adminId, "DELETE_AREA", "Area", id, null);
    }

    private Area findArea(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + id));
    }

    private City findCity(Long id) {
        return cityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("City not found: " + id));
    }

    private AreaResponse toResponse(Area a) {
        City c = a.getCity();
        return new AreaResponse(
                a.getAreaId(),
                a.getAreaName(),
                a.getGracePeriodDay(),
                c.getCityId(),
                c.getCityName()
        );
    }
}
