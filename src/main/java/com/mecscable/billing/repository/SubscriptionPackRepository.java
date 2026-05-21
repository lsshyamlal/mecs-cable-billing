package com.mecscable.billing.repository;

import com.mecscable.billing.entity.SubscriptionPack;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubscriptionPackRepository extends JpaRepository<SubscriptionPack, Long> {
    List<SubscriptionPack> findAllByOrderByPackNameAsc();
    boolean existsByPackNameIgnoreCase(String packName);
}
