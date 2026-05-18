package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateAreaRequest;
import com.mecscable.billing.dto.response.AreaResponse;
import com.mecscable.billing.entity.Area;
import com.mecscable.billing.repository.AreaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AreaService {

    private final AreaRepository areaRepository;

    public AreaService(AreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    public List<AreaResponse> getAllAreas() {
        return areaRepository.findAllByOrderByAreaNameAsc()
                .stream()
                .map(a -> new AreaResponse(a.getAreaId(), a.getAreaName(), a.getGracePeriodDay()))
                .toList();
    }

    @Transactional
    public AreaResponse createArea(CreateAreaRequest request) {
        if (areaRepository.existsByAreaNameIgnoreCase(request.areaName())) {
            throw new IllegalArgumentException("Area already exists: " + request.areaName());
        }
        Area area = new Area();
        area.setAreaName(request.areaName().trim());
        area.setGracePeriodDay(request.gracePeriodDay());
        area = areaRepository.save(area);
        return new AreaResponse(area.getAreaId(), area.getAreaName(), area.getGracePeriodDay());
    }
}
