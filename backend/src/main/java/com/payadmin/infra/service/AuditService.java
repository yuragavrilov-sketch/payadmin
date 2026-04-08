package com.payadmin.infra.service;

import com.payadmin.infra.entity.AuditLog;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.AuditLogRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional(value = "managementTransactionManager", propagation = Propagation.REQUIRES_NEW)
    public void log(String action, Host host, String serviceName, String result, String errorDetail) {
        AuditLog entry = new AuditLog();
        entry.setUsername(getCurrentUsername());
        entry.setAction(action);
        entry.setHost(host);
        entry.setServiceName(serviceName);
        entry.setResult(result);
        entry.setErrorDetail(errorDetail);
        auditLogRepository.save(entry);
    }

    private String getCurrentUsername() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }
}
