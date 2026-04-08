package com.payadmin.infra.controller;

import com.payadmin.infra.dto.ServiceGroupCreateDto;
import com.payadmin.infra.dto.ServiceGroupDto;
import com.payadmin.infra.service.ServiceGroupService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/service-groups")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class ServiceGroupController {

    private final ServiceGroupService serviceGroupService;

    public ServiceGroupController(ServiceGroupService serviceGroupService) {
        this.serviceGroupService = serviceGroupService;
    }

    @GetMapping
    public List<ServiceGroupDto> list() {
        return serviceGroupService.findAll();
    }

    @PostMapping
    public ServiceGroupDto create(@Valid @RequestBody ServiceGroupCreateDto dto) {
        return serviceGroupService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        serviceGroupService.delete(id);
    }
}
