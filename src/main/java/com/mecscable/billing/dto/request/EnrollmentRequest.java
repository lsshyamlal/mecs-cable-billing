package com.mecscable.billing.dto.request;

import java.time.LocalDate;

public record EnrollmentRequest(
        LocalDate startDate
) {}
