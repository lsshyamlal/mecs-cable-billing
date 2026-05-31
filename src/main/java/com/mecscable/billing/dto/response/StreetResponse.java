package com.mecscable.billing.dto.response;

public record StreetResponse(
        Long streetId,
        String streetName,
        Long areaId,
        String areaName,
        Long cityId,
        String cityName
) {}
