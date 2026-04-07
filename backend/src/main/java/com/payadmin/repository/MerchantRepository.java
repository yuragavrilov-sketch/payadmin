package com.payadmin.repository;

import com.payadmin.entity.Merchant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MerchantRepository extends JpaRepository<Merchant, Integer> {

    @Query("""
            SELECT m FROM Merchant m
            WHERE (:search IS NULL
                OR UPPER(m.name) LIKE UPPER(CONCAT('%', :search, '%'))
                OR CAST(m.mercid AS string) = :search)
            """)
    Page<Merchant> findBySearch(@Param("search") String search, Pageable pageable);
}
