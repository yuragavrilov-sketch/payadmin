package com.payadmin.infra.controller;

import com.payadmin.infra.dto.HostCreateDto;
import com.payadmin.infra.dto.HostDto;
import com.payadmin.infra.dto.MonitoredServiceCreateDto;
import com.payadmin.infra.dto.MonitoredServiceDto;
import com.payadmin.infra.dto.WindowsServiceDto;
import com.payadmin.infra.service.HostService;
import com.payadmin.infra.service.MonitoredServiceService;
import com.payadmin.infra.service.MonitoringService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/hosts")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class HostController {

    private final HostService hostService;
    private final MonitoredServiceService monitoredServiceService;
    private final MonitoringService monitoringService;

    public HostController(HostService hostService,
                          MonitoredServiceService monitoredServiceService,
                          MonitoringService monitoringService) {
        this.hostService = hostService;
        this.monitoredServiceService = monitoredServiceService;
        this.monitoringService = monitoringService;
    }

    @GetMapping
    public List<HostDto> list() {
        return hostService.findAll();
    }

    @PostMapping
    public HostDto create(@Valid @RequestBody HostCreateDto dto) {
        return hostService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        hostService.delete(id);
    }

    @GetMapping("/{id}/services")
    public List<MonitoredServiceDto> listServices(@PathVariable Integer id) {
        return monitoredServiceService.findByHost(id);
    }

    @PostMapping("/{id}/services")
    public MonitoredServiceDto addService(@PathVariable Integer id,
                                          @Valid @RequestBody MonitoredServiceCreateDto dto) {
        if (!id.equals(dto.hostId())) {
            throw new IllegalArgumentException("Host ID mismatch");
        }
        return monitoredServiceService.create(dto);
    }

    @DeleteMapping("/{hostId}/services/{serviceId}")
    public void removeService(@PathVariable Integer hostId, @PathVariable Integer serviceId) {
        monitoredServiceService.deleteWithOwnerCheck(hostId, serviceId);
    }

    @GetMapping("/{id}/windows-services")
    public List<WindowsServiceDto> listWindowsServices(@PathVariable Integer id) {
        return monitoringService.listWindowsServices(id);
    }
}
