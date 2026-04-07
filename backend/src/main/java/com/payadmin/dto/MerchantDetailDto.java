package com.payadmin.dto;

public record MerchantDetailDto(
        Integer mercid,
        String name,
        String initiator,
        String circuit,
        Integer hierarchyId,
        String paLogin,
        String apiLogin
) {}
