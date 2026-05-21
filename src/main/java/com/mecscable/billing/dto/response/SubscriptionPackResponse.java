package com.mecscable.billing.dto.response;

import java.math.BigDecimal;

public record SubscriptionPackResponse(Long packId, String packName, BigDecimal monthlyRate, String description) {}
