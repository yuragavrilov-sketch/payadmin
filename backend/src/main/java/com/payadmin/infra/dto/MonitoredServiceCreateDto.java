package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record MonitoredServiceCreateDto(
        @NotNull Integer hostId,
        @NotNull Integer groupId,
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9_\\-\\.]{1,256}$", message = "Invalid service name") String serviceName,
        String displayName) {
}
