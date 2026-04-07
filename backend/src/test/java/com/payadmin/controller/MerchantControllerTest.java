package com.payadmin.controller;

import com.payadmin.dto.MerchantConfigDto;
import com.payadmin.dto.MerchantDetailDto;
import com.payadmin.dto.MerchantListDto;
import com.payadmin.service.MerchantNotFoundException;
import com.payadmin.service.MerchantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(MerchantController.class)
class MerchantControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private MerchantService merchantService;

    @Test
    void listMerchants_returns200WithPage() throws Exception {
        var dto = new MerchantListDto(1001, "OOO Romashka", "system", "VISA", 10);
        var page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);
        when(merchantService.list(eq(null), any())).thenReturn(page);

        mockMvc.perform(get("/api/merchants")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].mercid").value(1001))
                .andExpect(jsonPath("$.content[0].name").value("OOO Romashka"))
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void listMerchants_withSearch_passesParam() throws Exception {
        var dto = new MerchantListDto(1001, "OOO Romashka", "system", "VISA", 10);
        var page = new PageImpl<>(List.of(dto), PageRequest.of(0, 20), 1);
        when(merchantService.list(eq("romashka"), any())).thenReturn(page);

        mockMvc.perform(get("/api/merchants?search=romashka")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].mercid").value(1001));
    }

    @Test
    void getMerchant_returns200WithDetail() throws Exception {
        var dto = new MerchantDetailDto(1001, "OOO Romashka", "system", "VISA", 10, "merchant01", "api_rom");
        when(merchantService.getById(1001)).thenReturn(dto);

        mockMvc.perform(get("/api/merchants/1001")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mercid").value(1001))
                .andExpect(jsonPath("$.paLogin").value("merchant01"));
    }

    @Test
    void getMerchant_notFound_returns404() throws Exception {
        when(merchantService.getById(9999)).thenThrow(new MerchantNotFoundException(9999));

        mockMvc.perform(get("/api/merchants/9999")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isNotFound());
    }

    @Test
    void getConfig_returns200WithList() throws Exception {
        var dto = new MerchantConfigDto("CURRENCY", "RUB",
                LocalDate.of(2024, 1, 1), LocalDate.of(2050, 1, 1));
        when(merchantService.getConfig(1001)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/merchants/1001/config")
                        .with(SecurityMockMvcRequestPostProcessors.jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].parameterName").value("CURRENCY"))
                .andExpect(jsonPath("$[0].parameterValue").value("RUB"));
    }

    @Test
    void listMerchants_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/merchants"))
                .andExpect(status().isUnauthorized());
    }
}
