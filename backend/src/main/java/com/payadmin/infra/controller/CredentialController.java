package com.payadmin.infra.controller;

import com.payadmin.infra.dto.CredentialCreateDto;
import com.payadmin.infra.dto.CredentialDto;
import com.payadmin.infra.service.CredentialService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/infra/credentials")
@PreAuthorize("hasRole('WINRM_ADMIN')")
public class CredentialController {

    private final CredentialService credentialService;

    public CredentialController(CredentialService credentialService) {
        this.credentialService = credentialService;
    }

    @GetMapping
    public List<CredentialDto> list() {
        return credentialService.findAll();
    }

    @PostMapping
    public CredentialDto create(@Valid @RequestBody CredentialCreateDto dto) {
        return credentialService.create(dto);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Integer id) {
        credentialService.delete(id);
    }
}
