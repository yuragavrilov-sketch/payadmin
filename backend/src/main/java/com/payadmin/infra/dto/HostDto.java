package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record HostDto(Integer id, String hostname, Integer port, Boolean useHttps,
                      Integer credentialId, String credentialName, String description,
                      Boolean enabled, LocalDateTime lastSeen, long serviceCount) {
}
