package com.payadmin.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class MerchantNotFoundException extends RuntimeException {

    public MerchantNotFoundException(Integer mercid) {
        super("Merchant not found: " + mercid);
    }
}
