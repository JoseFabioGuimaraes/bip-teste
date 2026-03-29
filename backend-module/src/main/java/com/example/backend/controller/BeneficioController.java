package com.example.backend.controller;

import com.example.backend.dto.BeneficioUpdateRequest;
import com.example.backend.dto.TransferRequest;
import com.example.backend.service.TransferenciaIntegrationService;
import com.example.ejb.model.Beneficio;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/beneficios")
@Tag(name = "Beneficios", description = "API para consulta, atualizacao e transferencia de beneficios")
public class BeneficioController {

    private final TransferenciaIntegrationService transferenciaIntegrationService;

    public BeneficioController(TransferenciaIntegrationService transferenciaIntegrationService) {
        this.transferenciaIntegrationService = transferenciaIntegrationService;
    }

    @GetMapping
        @Operation(summary = "Listar beneficios", description = "Retorna todos os beneficios cadastrados")
    public List<Beneficio> list() {
        return transferenciaIntegrationService.findAll();
    }

    @GetMapping("/{id}")
        @Operation(summary = "Buscar beneficio por ID", description = "Retorna um beneficio especifico pelo identificador")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Beneficio encontrado"),
            @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
        })
    public Beneficio getById(@PathVariable Long id) {
        return transferenciaIntegrationService.findById(id);
    }

    @PutMapping("/{id}")
        @Operation(
            summary = "Atualizar nome e descricao",
            description = "Atualiza os campos nome e descricao de um beneficio",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                required = true,
                content = @Content(
                    mediaType = "application/json",
                    examples = @ExampleObject(
                        name = "AtualizacaoBeneficio",
                        value = "{\n  \"nome\": \"Beneficio A Premium\",\n  \"descricao\": \"Descricao atualizada para auditoria\"\n}"
                    )
                )
            )
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Beneficio atualizado com sucesso"),
            @ApiResponse(responseCode = "400", description = "Dados invalidos"),
            @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
        })
    public Beneficio update(@PathVariable Long id, @RequestBody BeneficioUpdateRequest request) {
        return transferenciaIntegrationService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover beneficio", description = "Remove um beneficio existente pelo identificador")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Beneficio removido com sucesso"),
            @ApiResponse(responseCode = "404", description = "Beneficio nao encontrado")
    })
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        transferenciaIntegrationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/transfer")
        @Operation(
            summary = "Transferir saldo entre beneficios",
            description = "Executa transferencia com lock pessimista para evitar lost update sob concorrencia",
            requestBody = @io.swagger.v3.oas.annotations.parameters.RequestBody(
                required = true,
                content = @Content(
                    mediaType = "application/json",
                    examples = {
                        @ExampleObject(
                            name = "TransferenciaValida",
                            value = "{\n  \"fromId\": 1,\n  \"toId\": 2,\n  \"amount\": 100.00\n}"
                        ),
                        @ExampleObject(
                            name = "SaldoInsuficiente",
                            value = "{\n  \"fromId\": 1,\n  \"toId\": 2,\n  \"amount\": 1001.00\n}"
                        )
                    }
                )
            )
        )
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Transferencia realizada com sucesso"),
            @ApiResponse(responseCode = "400", description = "Erro de negocio (saldo insuficiente ou regra invalida)"),
            @ApiResponse(responseCode = "404", description = "Conta de origem ou destino nao encontrada")
        })
    public ResponseEntity<String> transfer(@RequestBody TransferRequest request) {
        transferenciaIntegrationService.transfer(request);
        return ResponseEntity.ok("transfer successful");
    }
}
