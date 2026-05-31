package com.mecscable.billing.dto.request;

import java.time.LocalDate;

public record DeactivateSubscriptionRequest(
        LocalDate deactivationDate,
        String notes,
        Boolean paymentCollected) {}
