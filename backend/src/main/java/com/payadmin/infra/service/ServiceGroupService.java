package com.payadmin.infra.service;

import com.payadmin.infra.dto.ServiceGroupCreateDto;
import com.payadmin.infra.dto.ServiceGroupDto;
import com.payadmin.infra.entity.ServiceGroup;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import com.payadmin.infra.repository.ServiceGroupRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ServiceGroupService {

    private final ServiceGroupRepository serviceGroupRepository;
    private final MonitoredServiceRepository monitoredServiceRepository;

    public ServiceGroupService(ServiceGroupRepository serviceGroupRepository,
                               MonitoredServiceRepository monitoredServiceRepository) {
        this.serviceGroupRepository = serviceGroupRepository;
        this.monitoredServiceRepository = monitoredServiceRepository;
    }

    @Transactional("managementTransactionManager")
    public List<ServiceGroupDto> findAll() {
        return serviceGroupRepository.findAllByOrderBySortOrderAsc().stream()
                .map(g -> new ServiceGroupDto(
                        g.getId(),
                        g.getName(),
                        g.getDescription(),
                        g.getSortOrder(),
                        monitoredServiceRepository.countByGroupId(g.getId())))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public ServiceGroupDto create(ServiceGroupCreateDto dto) {
        ServiceGroup group = new ServiceGroup();
        group.setName(dto.name());
        group.setDescription(dto.description());
        group.setSortOrder(dto.sortOrder() != null ? dto.sortOrder() : 0);

        ServiceGroup saved = serviceGroupRepository.save(group);
        return new ServiceGroupDto(
                saved.getId(),
                saved.getName(),
                saved.getDescription(),
                saved.getSortOrder(),
                0L);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        long count = monitoredServiceRepository.countByGroupId(id);
        if (count > 0) {
            throw new IllegalStateException("Cannot delete group: used by " + count + " service(s)");
        }
        serviceGroupRepository.deleteById(id);
    }
}
