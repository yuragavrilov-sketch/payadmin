package com.payadmin.infra.service;

import com.payadmin.infra.dto.MonitoredServiceCreateDto;
import com.payadmin.infra.dto.MonitoredServiceDto;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.entity.MonitoredService;
import com.payadmin.infra.entity.ServiceGroup;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import com.payadmin.infra.repository.ServiceGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MonitoredServiceService {

    private final MonitoredServiceRepository monitoredServiceRepository;
    private final HostRepository hostRepository;
    private final ServiceGroupRepository serviceGroupRepository;
    private final AuditService auditService;

    public MonitoredServiceService(MonitoredServiceRepository monitoredServiceRepository,
                                   HostRepository hostRepository,
                                   ServiceGroupRepository serviceGroupRepository,
                                   AuditService auditService) {
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.hostRepository = hostRepository;
        this.serviceGroupRepository = serviceGroupRepository;
        this.auditService = auditService;
    }

    @Transactional("managementTransactionManager")
    public List<MonitoredServiceDto> findByHost(Integer hostId) {
        return monitoredServiceRepository.findByHostId(hostId).stream()
                .map(ms -> new MonitoredServiceDto(
                        ms.getId(),
                        ms.getHost().getId(),
                        ms.getHost().getHostname(),
                        ms.getGroup().getId(),
                        ms.getGroup().getName(),
                        ms.getServiceName(),
                        ms.getDisplayName()))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public MonitoredServiceDto create(MonitoredServiceCreateDto dto) {
        Host host = hostRepository.findById(dto.hostId())
                .orElseThrow(() -> new IllegalArgumentException("Host not found: " + dto.hostId()));
        ServiceGroup group = serviceGroupRepository.findById(dto.groupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + dto.groupId()));

        MonitoredService ms = new MonitoredService();
        ms.setHost(host);
        ms.setGroup(group);
        ms.setServiceName(dto.serviceName());
        ms.setDisplayName(dto.displayName());

        MonitoredService saved = monitoredServiceRepository.save(ms);
        auditService.log("SERVICE_ADD", host, dto.serviceName(), "OK", null);

        return new MonitoredServiceDto(
                saved.getId(),
                host.getId(),
                host.getHostname(),
                group.getId(),
                group.getName(),
                saved.getServiceName(),
                saved.getDisplayName());
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        MonitoredService ms = monitoredServiceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("MonitoredService not found: " + id));
        monitoredServiceRepository.delete(ms);
        auditService.log("SERVICE_DELETE", ms.getHost(), ms.getServiceName(), "OK", null);
    }

    @Transactional("managementTransactionManager")
    public void deleteWithOwnerCheck(Integer hostId, Integer serviceId) {
        MonitoredService ms = monitoredServiceRepository.findById(serviceId)
                .orElseThrow(() -> new IllegalArgumentException("Monitored service not found"));
        if (!ms.getHost().getId().equals(hostId)) {
            throw new IllegalArgumentException("Service does not belong to this host");
        }
        auditService.log("SERVICE_DELETE", ms.getHost(), ms.getServiceName(), "Success", null);
        monitoredServiceRepository.delete(ms);
    }
}
