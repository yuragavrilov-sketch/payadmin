package com.payadmin.infra.repository;

import com.payadmin.infra.entity.Host;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HostRepository extends JpaRepository<Host, Integer> {
    List<Host> findByEnabledTrue();
    long countByCredentialId(Integer credentialId);
}
