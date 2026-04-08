package com.payadmin.infra.service;

import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CryptoServiceTest {
    private final CryptoService cryptoService = new CryptoService("test-key-at-least-16chars!");

    @Test
    void encryptAndDecrypt_roundTrip() {
        String plaintext = "my-secret-password";
        String encrypted = cryptoService.encrypt(plaintext);
        assertThat(encrypted).isNotEqualTo(plaintext);
        assertThat(cryptoService.decrypt(encrypted)).isEqualTo(plaintext);
    }

    @Test
    void encrypt_producesDifferentCiphertexts() {
        String encrypted1 = cryptoService.encrypt("password");
        String encrypted2 = cryptoService.encrypt("password");
        assertThat(encrypted1).isNotEqualTo(encrypted2);
    }

    @Test
    void decrypt_withWrongKey_throws() {
        String encrypted = cryptoService.encrypt("secret");
        CryptoService other = new CryptoService("different-key-16chars!!");
        assertThatThrownBy(() -> other.decrypt(encrypted))
                .isInstanceOf(RuntimeException.class);
    }
}
