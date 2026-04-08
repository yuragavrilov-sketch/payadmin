package com.payadmin.infra.service;

import com.payadmin.infra.dto.AuditLogDto;
import com.payadmin.infra.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@Transactional(value = "managementTransactionManager", readOnly = true)
public class AuditQueryService {

    private final AuditLogRepository auditLogRepository;

    public AuditQueryService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public Page<AuditLogDto> findFiltered(LocalDateTime from, LocalDateTime to,
                                           String username, String action, Pageable pageable) {
        return auditLogRepository.findFiltered(from, to, username, action, pageable)
                .map(a -> new AuditLogDto(a.getId(), a.getTimestamp(), a.getUsername(), a.getAction(),
                        a.getHost() != null ? a.getHost().getHostname() : null,
                        a.getServiceName(), a.getResult(), a.getErrorDetail()));
    }
}
