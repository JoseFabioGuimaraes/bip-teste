package com.example.backend.service;

import com.example.backend.dto.BeneficioUpdateRequest;
import com.example.backend.dto.TransferRequest;
import com.example.ejb.model.Beneficio;
import com.example.ejb.service.BeneficioEjbService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class TransferenciaIntegrationService {

    private final BeneficioEjbService beneficioEjbService;

    public TransferenciaIntegrationService(BeneficioEjbService beneficioEjbService) {
        this.beneficioEjbService = beneficioEjbService;
    }

    @Transactional(readOnly = true)
    public List<Beneficio> findAll() {
        return beneficioEjbService.findAll();
    }

    @Transactional(readOnly = true)
    public Beneficio findById(Long id) {
        return beneficioEjbService.findById(id);
    }

    @Transactional
    public Beneficio update(Long id, BeneficioUpdateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("beneficio update request is required");
        }
        return beneficioEjbService.update(id, request.nome(), request.descricao());
    }

    @Transactional
    public void delete(Long id) {
        beneficioEjbService.delete(id);
    }

    @Transactional
    public void transfer(TransferRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("transfer request is required");
        }
        beneficioEjbService.transfer(request.fromId(), request.toId(), request.amount());
    }
}