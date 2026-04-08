package com.payadmin.infra.dto;

import java.util.List;

public record MonitoringGroupDto(Integer groupId, String groupName, String groupDescription,
                                  List<MonitoringServiceDto> services,
                                  long runningCount, long stoppedCount, long unreachableCount) {
}
