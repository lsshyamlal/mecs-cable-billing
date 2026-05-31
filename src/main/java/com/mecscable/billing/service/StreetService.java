package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateStreetRequest;
import com.mecscable.billing.dto.response.StreetResponse;
import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.Street;
import com.mecscable.billing.exception.ResourceNotFoundException;
import com.mecscable.billing.repository.AreaRepository;
import com.mecscable.billing.repository.CustomerRepository;
import com.mecscable.billing.repository.StreetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StreetService {

    private final StreetRepository streetRepository;
    private final AreaRepository areaRepository;
    private final CustomerRepository customerRepository;
    private final AuditService auditService;

    public StreetService(StreetRepository streetRepository,
                         AreaRepository areaRepository,
                         CustomerRepository customerRepository,
                         AuditService auditService) {
        this.streetRepository = streetRepository;
        this.areaRepository = areaRepository;
        this.customerRepository = customerRepository;
        this.auditService = auditService;
    }

    public List<StreetResponse> getStreets(Long areaId) {
        List<Street> streets = areaId != null
                ? streetRepository.findByAreaOrderByStreetNameAsc(findArea(areaId))
                : streetRepository.findAllByOrderByStreetNameAsc();
        return streets.stream().map(this::toResponse).toList();
    }

    @Transactional
    public StreetResponse createStreet(CreateStreetRequest request, Long adminId) {
        Area area = findArea(request.areaId());
        String name = request.streetName().trim();
        if (streetRepository.existsByAreaAndStreetNameIgnoreCase(area, name)) {
            throw new IllegalArgumentException("Street already exists in this area: " + name);
        }
        Street street = new Street();
        street.setArea(area);
        street.setStreetName(name);
        street = streetRepository.save(street);
        auditService.log(adminId, "CREATE_STREET", "Street", street.getStreetId(), null);
        return toResponse(street);
    }

    @Transactional
    public StreetResponse updateStreet(Long id, CreateStreetRequest request, Long adminId) {
        Street street = findStreet(id);
        Area newArea = findArea(request.areaId());
        String newName = request.streetName().trim();

        boolean areaChanged = !street.getArea().getAreaId().equals(newArea.getAreaId());
        boolean nameChanged = !street.getStreetName().equalsIgnoreCase(newName);

        if ((areaChanged || nameChanged)
                && streetRepository.existsByAreaAndStreetNameIgnoreCase(newArea, newName)
                && !(newArea.getAreaId().equals(street.getArea().getAreaId())
                     && street.getStreetName().equalsIgnoreCase(newName))) {
            throw new IllegalArgumentException("Street already exists in target area: " + newName);
        }

        if (areaChanged) {
            long customerCount = customerRepository.countByStreet(street);
            if (customerCount > 0) {
                throw new IllegalArgumentException(
                        "Cannot move street to a different area — " + customerCount
                                + " customer(s) still belong to it");
            }
        }

        street.setArea(newArea);
        street.setStreetName(newName);
        street = streetRepository.save(street);
        auditService.log(adminId, "UPDATE_STREET", "Street", street.getStreetId(), null);
        return toResponse(street);
    }

    @Transactional
    public void deleteStreet(Long id, Long adminId) {
        Street street = findStreet(id);
        long customerCount = customerRepository.countByStreet(street);
        if (customerCount > 0) {
            throw new IllegalArgumentException(
                    "Cannot delete street — " + customerCount + " customer(s) still reference it");
        }
        streetRepository.delete(street);
        auditService.log(adminId, "DELETE_STREET", "Street", id, null);
    }

    private Street findStreet(Long id) {
        return streetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Street not found: " + id));
    }

    private Area findArea(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + id));
    }

    private StreetResponse toResponse(Street s) {
        Area a = s.getArea();
        return new StreetResponse(
                s.getStreetId(),
                s.getStreetName(),
                a.getAreaId(),
                a.getAreaName(),
                a.getCity().getCityId(),
                a.getCity().getCityName()
        );
    }
}
