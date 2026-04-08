package com.payadmin.infra.service;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.entity.Credential;
import com.payadmin.infra.repository.CredentialRepository;
import com.payadmin.infra.repository.HostRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CredentialServiceTest {

    @Mock private CredentialRepository credentialRepository;
    @Mock private HostRepository hostRepository;
    @Mock private CryptoService cryptoService;
    @Mock private AuditService auditService;
    @InjectMocks private CredentialService credentialService;

    @Test
    void create_encryptsPasswordAndSaves() {
        when(cryptoService.encrypt("secret")).thenReturn("encrypted_secret");
        Credential saved = new Credential();
        saved.setId(1);
        saved.setName("prod");
        saved.setDomain("CORP");
        saved.setUsername("admin");
        saved.setPasswordEncrypted("encrypted_secret");
        when(credentialRepository.save(any())).thenReturn(saved);

        CredentialDto result = credentialService.create(
                new CredentialCreateDto("prod", "CORP", "admin", "secret"));
        assertThat(result.id()).isEqualTo(1);
        assertThat(result.name()).isEqualTo("prod");
    }

    @Test
    void delete_blockedWhenUsedByHosts() {
        when(hostRepository.countByCredentialId(1)).thenReturn(2L);
        assertThatThrownBy(() -> credentialService.delete(1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("2 host(s)");
    }
}
