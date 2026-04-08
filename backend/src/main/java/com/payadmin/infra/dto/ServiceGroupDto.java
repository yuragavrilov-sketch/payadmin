package com.payadmin.infra.dto;

public record ServiceGroupDto(Integer id, String name, String description, Integer sortOrder, long serviceCount) {
}
