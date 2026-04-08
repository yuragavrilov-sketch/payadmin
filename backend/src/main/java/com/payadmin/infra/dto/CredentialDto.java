package com.payadmin.infra.dto;

public record CredentialDto(Integer id, String name, String domain, String username, long hostCount) {
}
