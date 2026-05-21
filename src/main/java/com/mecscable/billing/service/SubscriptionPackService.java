package com.mecscable.billing.service;

import com.mecscable.billing.dto.request.CreateSubscriptionPackRequest;
import com.mecscable.billing.dto.response.SubscriptionPackResponse;
import com.mecscable.billing.entity.SubscriptionPack;
import com.mecscable.billing.repository.SubscriptionPackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class SubscriptionPackService {

    private final SubscriptionPackRepository packRepository;

    public SubscriptionPackService(SubscriptionPackRepository packRepository) {
        this.packRepository = packRepository;
    }

    public List<SubscriptionPackResponse> getAllPacks() {
        return packRepository.findAllByOrderByPackNameAsc()
                .stream()
                .map(p -> new SubscriptionPackResponse(p.getPackId(), p.getPackName(), p.getMonthlyRate(), p.getDescription()))
                .toList();
    }

    @Transactional
    public SubscriptionPackResponse createPack(CreateSubscriptionPackRequest request) {
        if (packRepository.existsByPackNameIgnoreCase(request.packName())) {
            throw new IllegalArgumentException("Subscription pack already exists: " + request.packName());
        }
        SubscriptionPack pack = new SubscriptionPack();
        pack.setPackName(request.packName().trim());
        pack.setMonthlyRate(request.monthlyRate());
        pack.setDescription(request.description() != null ? request.description().trim() : null);
        pack = packRepository.save(pack);
        return new SubscriptionPackResponse(pack.getPackId(), pack.getPackName(), pack.getMonthlyRate(), pack.getDescription());
    }

    @Transactional
    public SubscriptionPackResponse updatePack(Long id, CreateSubscriptionPackRequest request) {
        SubscriptionPack pack = packRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Subscription pack not found: " + id));
        String trimmedName = request.packName().trim();
        if (!pack.getPackName().equalsIgnoreCase(trimmedName)
                && packRepository.existsByPackNameIgnoreCase(trimmedName)) {
            throw new IllegalArgumentException("Subscription pack already exists: " + trimmedName);
        }
        pack.setPackName(trimmedName);
        pack.setMonthlyRate(request.monthlyRate());
        pack.setDescription(request.description() != null ? request.description().trim() : null);
        pack = packRepository.save(pack);
        return new SubscriptionPackResponse(pack.getPackId(), pack.getPackName(), pack.getMonthlyRate(), pack.getDescription());
    }
}
