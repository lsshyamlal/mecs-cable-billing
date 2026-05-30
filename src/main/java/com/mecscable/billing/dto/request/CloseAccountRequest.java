package com.mecscable.billing.dto.request;

public record CloseAccountRequest(boolean paymentCollected, String notes) {}
