package com.payadmin.infra.dto;

public record MonitoredServiceDto(Integer id, Integer hostId, String hostname,
                                   Integer groupId, String groupName,
                                   String serviceName, String displayName) {
}
