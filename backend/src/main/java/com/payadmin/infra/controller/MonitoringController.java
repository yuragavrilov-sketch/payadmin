package com.payadmin.infra.controller;

import com.payadmin.infra.dto.MonitoringGroupDto;
import com.payadmin.infra.dto.ServiceActionDto;
import com.payadmin.infra.service.MonitoringService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/infra/monitoring")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class MonitoringController {

    private final MonitoringService monitoringService;

    public MonitoringController(MonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping
    public List<MonitoringGroupDto> getStatus() {
        return monitoringService.getGroupedStatus();
    }

    @PostMapping("/action")
    public Map<String, String> executeAction(@Valid @RequestBody ServiceActionDto dto) {
        return Map.of("result", monitoringService.executeAction(dto.serviceId(), dto.action()));
    }
}
