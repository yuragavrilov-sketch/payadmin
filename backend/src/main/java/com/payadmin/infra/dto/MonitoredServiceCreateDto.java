package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record MonitoredServiceCreateDto(
        @NotNull Integer hostId,
        @NotNull Integer groupId,
        @NotBlank String serviceName,
        String displayName) {
}
