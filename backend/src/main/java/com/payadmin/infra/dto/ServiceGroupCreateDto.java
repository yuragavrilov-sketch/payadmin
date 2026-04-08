package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;

public record ServiceGroupCreateDto(@NotBlank String name, String description, Integer sortOrder) {
}
