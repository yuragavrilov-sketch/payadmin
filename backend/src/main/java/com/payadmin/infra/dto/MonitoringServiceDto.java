package com.payadmin.infra.dto;

import java.time.LocalDateTime;

public record MonitoringServiceDto(Integer serviceId, String serviceName, String displayName,
                                    Integer hostId, String hostname, String status,
                                    Integer pid, LocalDateTime checkedAt, String errorMessage) {
}
