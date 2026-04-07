package com.payadmin.dto;

public record MerchantListDto(
        Integer mercid,
        String name,
        String initiator,
        String circuit,
        Integer hierarchyId
) {}
