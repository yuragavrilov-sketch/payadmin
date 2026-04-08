package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;

public record CredentialCreateDto(
        @NotBlank String name,
        String domain,
        @NotBlank String username,
        @NotBlank String password) {
}
