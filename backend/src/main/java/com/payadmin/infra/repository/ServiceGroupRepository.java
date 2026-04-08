package com.payadmin.infra.repository;

import com.payadmin.infra.entity.ServiceGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceGroupRepository extends JpaRepository<ServiceGroup, Integer> {
    List<ServiceGroup> findAllByOrderBySortOrderAsc();
}
