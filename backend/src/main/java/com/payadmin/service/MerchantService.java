package com.payadmin.service;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.entity.Merchant;
import com.payadmin.repository.MercConfigRepository;
import com.payadmin.repository.MerchantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MerchantService {

    private final MerchantRepository merchantRepository;
    private final MercConfigRepository mercConfigRepository;

    public MerchantService(MerchantRepository merchantRepository,
                           MercConfigRepository mercConfigRepository) {
        this.merchantRepository = merchantRepository;
        this.mercConfigRepository = mercConfigRepository;
    }

    public Page<MerchantListDto> list(String search, Pageable pageable) {
        return merchantRepository.findBySearch(search, pageable)
                .map(m -> new MerchantListDto(
                        m.getMercid(),
                        m.getName(),
                        m.getInitiator(),
                        m.getCircuit(),
                        m.getHierarchyId()
                ));
    }

    public MerchantDetailDto getById(Integer mercid) {
        Merchant m = merchantRepository.findById(mercid)
                .orElseThrow(() -> new MerchantNotFoundException(mercid));
        return new MerchantDetailDto(
                m.getMercid(),
                m.getName(),
                m.getInitiator(),
                m.getCircuit(),
                m.getHierarchyId(),
                m.getPaLogin(),
                m.getApiLogin()
        );
    }

    public List<MerchantConfigDto> getConfig(Integer mercid) {
        merchantRepository.findById(mercid)
                .orElseThrow(() -> new MerchantNotFoundException(mercid));
        return mercConfigRepository.findActiveByMercid(mercid).stream()
                .map(mc -> new MerchantConfigDto(
                        mc.getParameterName(),
                        mc.getParameterValue(),
                        mc.getDateBegin(),
                        mc.getDateEnd()
                ))
                .toList();
    }
}
