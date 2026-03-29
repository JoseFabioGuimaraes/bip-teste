package com.example.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Sql(scripts = "classpath:reset-beneficios.sql", executionPhase = Sql.ExecutionPhase.BEFORE_TEST_METHOD)
class TransferenciaConcurrencyTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldTransferSuccessfully() {
        ResponseEntity<String> response = restTemplate.postForEntity(
                url("/api/v1/beneficios/transfer"),
                transferRequest(1L, 2L, "100.00"),
                String.class
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("transfer successful", response.getBody());
    }

    @Test
    void shouldFailWhenInsufficientBalance() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/v1/beneficios/transfer"),
                transferRequest(1L, 2L, "1001.00"),
                Map.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertErrorResponse(response.getBody(), 400, "insufficient balance");
    }

        @Test
        void shouldFailWhenAmountIsNegativeOrZero() {
        ResponseEntity<Map> zeroAmountResponse = restTemplate.postForEntity(
            url("/api/v1/beneficios/transfer"),
            transferRequest(1L, 2L, "0.00"),
            Map.class
        );
        ResponseEntity<Map> negativeAmountResponse = restTemplate.postForEntity(
            url("/api/v1/beneficios/transfer"),
            transferRequest(1L, 2L, "-10.00"),
            Map.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, zeroAmountResponse.getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, negativeAmountResponse.getStatusCode());
        assertErrorResponse(zeroAmountResponse.getBody(), 400, "greater than zero");
        assertErrorResponse(negativeAmountResponse.getBody(), 400, "greater than zero");
        }

        @Test
        void shouldFailWhenTransferringToSameAccount() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
            url("/api/v1/beneficios/transfer"),
            transferRequest(1L, 1L, "100.00"),
            Map.class
        );

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertErrorResponse(response.getBody(), 400, "must be different");
        }

    @Test
    void shouldReturnNotFoundWhenUsingNonExistingIds() {
        ResponseEntity<Map> response = restTemplate.postForEntity(
                url("/api/v1/beneficios/transfer"),
                transferRequest(999L, 2L, "100.00"),
                Map.class
        );

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertErrorResponse(response.getBody(), 404, "not found");
    }

        @Test
        void shouldDeleteBeneficioAndReturnNotFoundAfterwards() {
        ResponseEntity<Void> deleteResponse = restTemplate.exchange(
            url("/api/v1/beneficios/2"),
            HttpMethod.DELETE,
            HttpEntity.EMPTY,
            Void.class
        );

        assertEquals(HttpStatus.NO_CONTENT, deleteResponse.getStatusCode());

        ResponseEntity<Map> getAfterDeleteResponse = restTemplate.getForEntity(
            url("/api/v1/beneficios/2"),
            Map.class
        );

        assertEquals(HttpStatus.NOT_FOUND, getAfterDeleteResponse.getStatusCode());
        assertErrorResponse(getAfterDeleteResponse.getBody(), 404, "not found");
        }

    @Test
    void shouldHandleConcurrentTransfersCorrectly() throws Exception {
        int totalThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch readyLatch = new CountDownLatch(totalThreads);
        CountDownLatch startLatch = new CountDownLatch(1);

        List<Future<ResponseEntity<String>>> futures = new ArrayList<>();
        for (int i = 0; i < totalThreads; i++) {
            futures.add(executor.submit(() -> {
                readyLatch.countDown();
                startLatch.await();
                return restTemplate.postForEntity(
                        url("/api/v1/beneficios/transfer"),
                        transferRequest(1L, 2L, "100.00"),
                        String.class
                );
            }));
        }

        assertTrue(readyLatch.await(5, TimeUnit.SECONDS), "Threads did not become ready in time");
        startLatch.countDown();

        for (Future<ResponseEntity<String>> future : futures) {
            ResponseEntity<String> response = future.get(10, TimeUnit.SECONDS);
            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        executor.shutdown();
        assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS), "Executor did not finish in time");

        ResponseEntity<BeneficioPayload> contaAResponse = restTemplate.getForEntity(
                url("/api/v1/beneficios/1"),
                BeneficioPayload.class
        );
        ResponseEntity<BeneficioPayload> contaBResponse = restTemplate.getForEntity(
                url("/api/v1/beneficios/2"),
                BeneficioPayload.class
        );

        assertEquals(HttpStatus.OK, contaAResponse.getStatusCode());
        assertEquals(HttpStatus.OK, contaBResponse.getStatusCode());

        BeneficioPayload contaA = contaAResponse.getBody();
        BeneficioPayload contaB = contaBResponse.getBody();

        assertNotNull(contaA);
        assertNotNull(contaB);
        assertEquals(new BigDecimal("0.00"), contaA.getValor());
        assertEquals(new BigDecimal("1500.00"), contaB.getValor());
    }

    private String url(String path) {
        return "http://localhost:" + port + path;
    }

    private Map<String, Object> transferRequest(Long fromId, Long toId, String amount) {
        return Map.of(
                "fromId", fromId,
                "toId", toId,
                "amount", amount
        );
    }

    private void assertErrorResponse(Map body, int expectedStatus, String expectedMessageFragment) {
        assertNotNull(body);
        assertEquals(expectedStatus, body.get("status"));
        Object error = body.get("error");
        assertNotNull(error);
        assertTrue(error.toString().toLowerCase().contains(expectedMessageFragment));
    }

    public static class BeneficioPayload {
        private Long id;
        private String nome;
        private String descricao;
        private BigDecimal valor;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getNome() {
            return nome;
        }

        public void setNome(String nome) {
            this.nome = nome;
        }

        public String getDescricao() {
            return descricao;
        }

        public void setDescricao(String descricao) {
            this.descricao = descricao;
        }

        public BigDecimal getValor() {
            return valor;
        }

        public void setValor(BigDecimal valor) {
            this.valor = valor;
        }
    }
}
