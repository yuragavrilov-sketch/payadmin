package com.payadmin.infra.service;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CredentialService {

    private final CredentialRepository credentialRepository;
    private final HostRepository hostRepository;
    private final CryptoService cryptoService;
    private final AuditService auditService;

    public CredentialService(CredentialRepository credentialRepository,
                             HostRepository hostRepository,
                             CryptoService cryptoService,
                             AuditService auditService) {
        this.credentialRepository = credentialRepository;
        this.hostRepository = hostRepository;
        this.cryptoService = cryptoService;
        this.auditService = auditService;
    }

    @Transactional("managementTransactionManager")
    public List<CredentialDto> findAll() {
        return credentialRepository.findAll().stream()
                .map(c -> new CredentialDto(
                        c.getId(),
                        c.getName(),
                        c.getDomain(),
                        c.getUsername(),
                        hostRepository.countByCredentialId(c.getId())))
                .toList();
    }

    @Transactional("managementTransactionManager")
    public CredentialDto create(CredentialCreateDto dto) {
        Credential credential = new Credential();
        credential.setName(dto.name());
        credential.setDomain(dto.domain());
        credential.setUsername(dto.username());
        credential.setPasswordEncrypted(cryptoService.encrypt(dto.password()));
        Credential saved = credentialRepository.save(credential);
        auditService.log("CRED_ADD", null, null, "OK", null);
        return new CredentialDto(
                saved.getId(),
                saved.getName(),
                saved.getDomain(),
                saved.getUsername(),
                0L);
    }

    @Transactional("managementTransactionManager")
    public void delete(Integer id) {
        long count = hostRepository.countByCredentialId(id);
        if (count > 0) {
            throw new IllegalStateException("Cannot delete credential: used by " + count + " host(s)");
        }
        credentialRepository.deleteById(id);
        auditService.log("CRED_DELETE", null, null, "OK", null);
    }
}
