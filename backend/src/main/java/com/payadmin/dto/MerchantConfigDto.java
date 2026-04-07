package com.payadmin.dto;

import java.time.LocalDate;

public record MerchantConfigDto(
        String parameterName,
        String parameterValue,
        LocalDate dateBegin,
        LocalDate dateEnd
) {}
