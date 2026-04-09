package com.payadmin.infra.service;

import com.payadmin.infra.dto.HostCreateDto;
import com.payadmin.infra.dto.HostDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.entity.Host;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import com.payadmin.infra.repository.MonitoredServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HostService {

    private final HostRepository hostRepository;
    private final CredentialRepository credentialRepository;
    private final MonitoredServiceRepository monitoredServiceRepository;
    private final AuditService auditService;

    public HostService(HostRepository hostRepository,
                       CredentialRepository credentialRepository,
                       MonitoredServiceRepository monitoredServiceRepository,
                       AuditService auditService) {
        this.hostRepository = hostRepository;
        this.credentialRepository = credentialRepository;
        this.monitoredServiceRepository = monitoredServiceRepository;
        this.auditService = auditService;
    }

    @Transactional("managementTransactionManager")
    public List<HostDto> findAll() {
        return hostRepository.findAll().stream()
                .map(h -> new HostDto(
                        h.getId(),
                        h.getHostname(),
                        h.getPort(),
                        h.getUseHttps(),
                        h.getCredential().getId(),
                        h.getCredential().getName(),
                        h.getDescription(),
                        h.getEnabled(),
                        h.getLastSeen(),
                        monitoredServiceRepository.countByHostId(h.getId())))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public HostDto create(HostCreateDto dto) {
        Credential credential = credentialRepository.findById(dto.credentialId())
                .orElseThrow(() -> new IllegalArgumentException("Credential not found: " + dto.credentialId()));

        Host host = new Host();
        host.setHostname(dto.hostname());
        host.setPort(dto.port());
        host.setUseHttps(dto.useHttps() != null ? dto.useHttps() : false);
        host.setCredential(credential);
        host.setDescription(dto.description());

        Host saved = hostRepository.save(host);
        auditService.log("HOST_ADD", null, saved.getHostname(), "Success", null);

        return new HostDto(
                saved.getId(),
                saved.getHostname(),
                saved.getPort(),
                saved.getUseHttps(),
                credential.getId(),
                credential.getName(),
                saved.getDescription(),
                saved.getEnabled(),
                saved.getLastSeen(),
                0L);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        Host host = hostRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Host not found: " + id));
        hostRepository.delete(host);
        auditService.log("HOST_DELETE", null, null, "OK", null);
    }
}
