package com.payadmin.repository;

import com.payadmin.entity.MercConfig;
import com.payadmin.entity.MercConfigId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MercConfigRepository extends JpaRepository<MercConfig, MercConfigId> {

    @Query("""
            SELECT mc FROM MercConfig mc
            WHERE mc.mercid = :mercid
              AND mc.dateBegin <= CURRENT_DATE
              AND mc.dateEnd > CURRENT_DATE
            ORDER BY mc.parameterName
            """)
    List<MercConfig> findActiveByMercid(@Param("mercid") Integer mercid);
}
