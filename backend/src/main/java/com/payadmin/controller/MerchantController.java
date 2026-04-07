package com.payadmin.controller;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.service.MerchantService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/merchants")
public class MerchantController {

    private final MerchantService merchantService;

    public MerchantController(MerchantService merchantService) {
        this.merchantService = merchantService;
    }

    @GetMapping
    public Page<MerchantListDto> list(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return merchantService.list(search, pageable);
    }

    @GetMapping("/{id}")
    public MerchantDetailDto getById(@PathVariable("id") Integer id) {
        return merchantService.getById(id);
    }

    @GetMapping("/{id}/config")
    public List<MerchantConfigDto> getConfig(@PathVariable("id") Integer id) {
        return merchantService.getConfig(id);
    }
}
