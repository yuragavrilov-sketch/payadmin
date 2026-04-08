package com.payadmin.service;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.entity.MercConfig;
import com.payadmin.entity.Merchant;
import com.payadmin.repository.MercConfigRepository;
import com.payadmin.repository.MerchantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MerchantServiceTest {

    @Mock
    private MerchantRepository merchantRepository;

    @Mock
    private MercConfigRepository mercConfigRepository;

    @InjectMocks
    private MerchantService merchantService;

    private Merchant sampleMerchant;

    @BeforeEach
    void setUp() {
        sampleMerchant = new Merchant();
        sampleMerchant.setMercid(1001);
        sampleMerchant.setName("OOO Romashka");
        sampleMerchant.setInitiator("system");
        sampleMerchant.setCircuit("VISA");
        sampleMerchant.setHierarchyId(10);
        sampleMerchant.setPaLogin("merchant01");
        sampleMerchant.setApiLogin("api_romashka");
    }

    @Test
    void list_returnsMerchantListDtos() {
        Page<Merchant> page = new PageImpl<>(List.of(sampleMerchant));
        when(merchantRepository.findBySearch(eq(null), any(Pageable.class))).thenReturn(page);

        Page<MerchantListDto> result = merchantService.list(null, PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
        MerchantListDto dto = result.getContent().get(0);
        assertThat(dto.mercid()).isEqualTo(1001);
        assertThat(dto.name()).isEqualTo("OOO Romashka");
        assertThat(dto.initiator()).isEqualTo("system");
        assertThat(dto.circuit()).isEqualTo("VISA");
        assertThat(dto.hierarchyId()).isEqualTo(10);
    }

    @Test
    void list_withSearch_passesSearchToRepo() {
        Page<Merchant> page = new PageImpl<>(List.of(sampleMerchant));
        when(merchantRepository.findBySearch(eq("romashka"), any(Pageable.class))).thenReturn(page);

        Page<MerchantListDto> result = merchantService.list("romashka", PageRequest.of(0, 20));

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    void getById_returnsMerchantDetailDto_withoutPasswords() {
        when(merchantRepository.findById(1001)).thenReturn(Optional.of(sampleMerchant));

        MerchantDetailDto dto = merchantService.getById(1001);

        assertThat(dto.mercid()).isEqualTo(1001);
        assertThat(dto.paLogin()).isEqualTo("merchant01");
        assertThat(dto.apiLogin()).isEqualTo("api_romashka");
    }

    @Test
    void getById_notFound_throwsException() {
        when(merchantRepository.findById(9999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> merchantService.getById(9999))
                .isInstanceOf(MerchantNotFoundException.class);
    }

    @Test
    void getConfig_returnsActiveConfigs() {
        MercConfig config = new MercConfig();
        config.setMercid(1001);
        config.setParameterName("CURRENCY");
        config.setParameterValue("RUB");
        config.setDateBegin(LocalDate.of(2024, 1, 1));
        config.setDateEnd(LocalDate.of(2050, 1, 1));

        when(merchantRepository.findById(1001)).thenReturn(Optional.of(sampleMerchant));
        when(mercConfigRepository.findActiveByMercid(1001)).thenReturn(List.of(config));

        List<MerchantConfigDto> result = merchantService.getConfig(1001);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).parameterName()).isEqualTo("CURRENCY");
        assertThat(result.get(0).parameterValue()).isEqualTo("RUB");
    }
}
