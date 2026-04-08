package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record AuditLogDto(Long id, LocalDateTime timestamp, String username, String action,
                           String hostname, String serviceName, String result, String errorDetail) {
}
