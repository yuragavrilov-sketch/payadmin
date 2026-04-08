package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HostCreateDto(
        @NotBlank String hostname,
        @NotNull Integer port,
        Boolean useHttps,
        @NotNull Integer credentialId,
        String description) {
}
