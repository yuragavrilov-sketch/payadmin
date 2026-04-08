package com.payadmin.infra.controller;

import com.payadmin.infra.dto.AuditLogDto;
import com.payadmin.infra.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/infra/audit")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping
    public Page<AuditLogDto> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            Pageable pageable) {
        return auditLogRepository.findFiltered(from, to, username, action, pageable)
                .map(a -> new AuditLogDto(
                        a.getId(),
                        a.getTimestamp(),
                        a.getUsername(),
                        a.getAction(),
                        a.getHost() != null ? a.getHost().getHostname() : null,
                        a.getServiceName(),
                        a.getResult(),
                        a.getErrorDetail()));
    }
}
