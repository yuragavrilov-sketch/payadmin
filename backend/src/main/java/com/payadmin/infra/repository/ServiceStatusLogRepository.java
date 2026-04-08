package com.payadmin.infra.repository;

import com.payadmin.infra.entity.ServiceStatusLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;

public interface ServiceStatusLogRepository extends JpaRepository<ServiceStatusLog, Long> {
    Optional<ServiceStatusLog> findTopByMonitoredServiceIdOrderByCheckedAtDesc(Integer monitoredServiceId);

    @Modifying
    @Query("DELETE FROM ServiceStatusLog s WHERE s.checkedAt < :before")
    void deleteOlderThan(LocalDateTime before);
}
