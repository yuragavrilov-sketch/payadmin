package com.payadmin.infra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ServiceActionDto(@NotNull Integer serviceId, @NotBlank String action) {
}
