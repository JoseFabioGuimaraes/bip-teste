package com.example.backend.dto;

import java.math.BigDecimal;

public record TransferRequest(Long fromId, Long toId, BigDecimal amount) {
}