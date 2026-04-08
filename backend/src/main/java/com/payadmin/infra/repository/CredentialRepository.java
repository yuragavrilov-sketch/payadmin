package com.payadmin.infra.repository;

import com.payadmin.infra.entity.Credential;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CredentialRepository extends JpaRepository<Credential, Integer> {
}
