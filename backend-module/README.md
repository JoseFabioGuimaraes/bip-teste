# Backend Module

## Visao geral
Este modulo expoe a API REST de beneficios e integra a regra transacional legada via EJB, mantendo separacao de responsabilidades por camadas.

## Arquitetura em camadas
Fluxo principal da aplicacao:

`Controller -> Service -> EJB Integration -> EJB Service`

- `Controller` (`com.example.backend.controller`): recebe requisicoes HTTP, valida contrato de entrada e retorna respostas REST.
- `Service` (`com.example.backend.service`): orquestra casos de uso e centraliza regras de aplicacao do backend.
- `EJB Integration` (`com.example.backend.config.EjbIntegrationConfig`): registra o bean de integracao com o modulo EJB.
- `EJB Service` (`com.example.ejb.service.BeneficioEjbService`): executa logica transacional e acesso ao banco via `EntityManager`.

Essa composicao evita acoplamento entre API e persistencia, facilita testes de integracao e melhora manutenabilidade.

## Decisao de integracao EJB (escopo do desafio)
Este projeto utiliza o `ejb-module` como nucleo legado de regra de negocio dentro do runtime Spring Boot.

- O foco do desafio foi preservar as regras legadas do `BeneficioEjbService` e corrigir concorrencia/transacoes.
- Nao foi adotado deploy em container EJB dedicado (com lookup JNDI remoto), para manter simplicidade operacional no escopo da avaliacao.
- O gerenciamento transacional e de persistencia ocorre no ecossistema Spring + JPA/Hibernate, mantendo separacao de responsabilidades entre API, aplicacao e dominio.

Essa escolha segue principios de arquitetura limpa e SOLID:
- `SRP`: controller trata HTTP, service orquestra caso de uso, modulo legado concentra regra de negocio.
- `DIP`: camadas externas dependem de contratos/servicos, nao de detalhes de UI ou infraestrutura.
- `OCP`: regras de transferencia permanecem encapsuladas e extensiveis sem alterar a borda HTTP.

## Lock pessimista e integridade transacional
As transferencias usam `LockModeType.PESSIMISTIC_WRITE` para bloquear as linhas de origem e destino durante a transacao.

No H2, isso gera SQL equivalente a `SELECT ... FOR UPDATE`, impedindo concorrencia suja no mesmo registro enquanto a transacao atual nao termina.

Beneficios dessa estrategia:
- Evita `Lost Update` em transferencias simultaneas.
- Garante consistencia de saldo sob alta concorrencia.
- Mantem previsibilidade em cenarios de disputa de escrita.

## Tratamento de erros padronizado
A classe `GlobalExceptionHandler` responde em JSON padrao:

```json
{
  "error": "mensagem do erro",
  "status": 400
}
```

Mapeamentos principais:
- `400`: `IllegalArgumentException`, `IllegalStateException`
- `404`: `EntityNotFoundException`

## Escopo funcional entregue
Endpoints implementados e auditados:

- `GET /api/v1/beneficios`: listar beneficios.
- `GET /api/v1/beneficios/{id}`: consultar beneficio por ID.
- `PUT /api/v1/beneficios/{id}`: atualizar nome/descricao.
- `DELETE /api/v1/beneficios/{id}`: excluir beneficio.
- `POST /api/v1/beneficios/transfer`: transferir saldo com lock pessimista.

Observacao de escopo: o endpoint de criacao (`POST /api/v1/beneficios`) nao foi implementado nesta entrega, pois a prioridade tecnica foi a correcao do bug critico de concorrencia na transferencia e a integracao fim a fim DB -> EJB -> Spring -> Angular.

## Como executar
Pre-requisitos:
- Java 17
- Maven 3.9+

Ordem recomendada (devido a dependencia entre modulos):

```bash
cd ejb-module
mvn clean install

cd ../backend-module
mvn spring-boot:run
```

A API sobe em `http://localhost:8081`.

## Swagger (OpenAPI)
Com `springdoc-openapi-starter-webmvc-ui` configurado:

- UI: `http://localhost:8081/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`

Os endpoints documentados incluem exemplos reais de corpo JSON para transferencia e atualizacao.

## Exemplos de chamadas da API
Listar beneficios:

```bash
curl -X GET http://localhost:8081/api/v1/beneficios
```

Buscar por id:

```bash
curl -X GET http://localhost:8081/api/v1/beneficios/1
```

Atualizar nome e descricao:

```bash
curl -X PUT http://localhost:8081/api/v1/beneficios/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Beneficio A Premium",
    "descricao": "Descricao atualizada para auditoria"
  }'
```

Transferir saldo:

```bash
curl -X POST http://localhost:8081/api/v1/beneficios/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "fromId": 1,
    "toId": 2,
    "amount": 100.00
  }'
```

Exemplo de erro de negocio (400):

```json
{
  "error": "insufficient balance for transfer",
  "status": 400
}
```

Exemplo de nao encontrado (404):

```json
{
  "error": "beneficio not found for source or target id",
  "status": 404
}
```
