package com.payadmin.infra.repository;

import com.payadmin.infra.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query(value = "SELECT a FROM AuditLog a LEFT JOIN FETCH a.host WHERE " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) AND " +
           "(:username IS NULL OR a.username = :username) AND " +
           "(:action IS NULL OR a.action = :action) " +
           "ORDER BY a.timestamp DESC",
           countQuery = "SELECT COUNT(a) FROM AuditLog a WHERE " +
           "(:from IS NULL OR a.timestamp >= :from) AND " +
           "(:to IS NULL OR a.timestamp <= :to) AND " +
           "(:username IS NULL OR a.username = :username) AND " +
           "(:action IS NULL OR a.action = :action)")
    Page<AuditLog> findFiltered(LocalDateTime from, LocalDateTime to,
                                String username, String action, Pageable pageable);
}
