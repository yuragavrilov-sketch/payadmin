package com.payadmin.infra.repository;

import com.payadmin.infra.entity.MonitoredService;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MonitoredServiceRepository extends JpaRepository<MonitoredService, Integer> {
    List<MonitoredService> findByHostId(Integer hostId);
    long countByGroupId(Integer groupId);
    long countByHostId(Integer hostId);
}
