package com.payadmin.infra.repository;

import com.payadmin.infra.entity.Host;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface HostRepository extends JpaRepository<Host, Integer> {
    @Query("SELECT h FROM Host h JOIN FETCH h.credential WHERE h.enabled = true")
    List<Host> findByEnabledTrue();

    long countByCredentialId(Integer credentialId);
}
