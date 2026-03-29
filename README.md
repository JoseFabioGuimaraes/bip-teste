# Sistema Fullstack de Gerenciamento de Beneficios

## Visao Geral
Este projeto implementa uma aplicacao Fullstack para gerenciamento de beneficios, com operacoes de consulta, atualizacao, exclusao e transferencia de saldo entre contas de beneficio.
O foco tecnico da solucao esta na transferencia segura sob concorrencia, garantindo consistencia de dados, atomicidade transacional e previsibilidade em cenarios com multiplas requisicoes simultaneas.

## Stack Tecnologico
- Backend: Java 17 + Spring Boot
- Logica de Negocio Legada: EJB (`BeneficioEjbService`)
- Persistencia: JPA/Hibernate
- Banco de Dados: SQL (scripts `schema.sql` e `seed.sql`; ambiente local de desenvolvimento com H2)
- Frontend: Angular
- Documentacao de API: Swagger/OpenAPI

## Como Executar o Projeto

### 1. Pre-requisitos
- Java 17
- Maven 3.9+
- Node.js 18+ e npm
- Banco de dados compativel com os scripts SQL (ou uso do H2 no backend local)

### 2. Executar scripts de banco de dados
Utilize os scripts da pasta `db/` na ordem abaixo:
1. `db/schema.sql`
2. `db/seed.sql`

Exemplo (ajuste para seu cliente SQL):
```sql
-- 1) Estrutura
\i db/schema.sql

-- 2) Carga inicial
\i db/seed.sql
```

### 3. Build do modulo EJB
O backend depende do artefato do modulo EJB no repositorio local Maven.

```bash
cd ejb-module
mvn clean install
```

### 4. Executar o Backend (Spring Boot)
```bash
cd ../backend-module
mvn spring-boot:run
```

Backend disponivel em:
- `http://localhost:8081`

### 5. Executar o Frontend (Angular)
```bash
cd ../frontend
npm install
npm start
```

Frontend disponivel em:
- `http://localhost:4200`

## A Resolucao do Bug (Concorrencia)
O bug critico de transferencia foi tratado com uma estrategia de consistencia forte no acesso concorrente:

1. Validacoes de regra de negocio antes da mutacao
- Contas de origem e destino obrigatorias
- Proibicao de transferencia para a mesma conta
- Valor de transferencia maior que zero
- Verificacao de saldo suficiente

2. Pessimistic Locking no carregamento das contas
- As entidades envolvidas na operacao sao buscadas com `PESSIMISTIC_WRITE`, garantindo bloqueio de escrita durante a transacao.
- Isso elimina risco de `lost update` em transferencias simultaneas sobre os mesmos registros.

3. Mitigacao de Deadlock por ordenacao deterministica de locks
- Antes de adquirir os locks no banco, os IDs de origem e destino sao ordenados.
- Com a aquisicao sempre na mesma ordem global (menor ID primeiro), evita-se o cenario classico de espera circular entre transacoes concorrentes.

4. Atomicidade transacional
- Debito e credito ocorrem dentro da mesma transacao (`@Transactional`), com rollback automatico em caso de erro de negocio ou falha de persistencia.

## Decisoes Arquiteturais
Integracao do Modulo EJB e Modernizacao: Optou-se por uma abordagem de modernizacao pragmatica para a integracao do EJB. Em vez de acoplar a aplicacao a um conteiner Java EE pesado (como WildFly ou JBoss) apenas para realizar o lookup via JNDI, o servico EJB foi acoplado ao ecossistema Spring Boot, atuando puramente como o nucleo de regras de negocio. Com essa adaptacao, a responsabilidade pelo gerenciamento do ciclo de vida, controle transacional e concorrencia (Pessimistic Locking) foi delegada ao Spring e ao Hibernate (via @Transactional). Esta decisao arquitetural garante a integridade atomica das operacoes financeiras, simplifica drasticamente a esteira de deploy, facilita a cobertura de testes e alinha o projeto com praticas modernas de arquiteturas cloud-native.

## Escopo funcional entregue
Funcionalidades entregues nesta versao:

- Consulta de beneficios (`GET /beneficios` e `GET /beneficios/{id}`).
- Atualizacao de beneficio (`PUT /beneficios/{id}`).
- Exclusao de beneficio (`DELETE /beneficios/{id}`).
- Transferencia com validacoes de negocio, lock pessimista e testes de concorrencia (`POST /beneficios/transfer`).

Observacao de escopo: a criacao de beneficio (`POST /beneficios`) nao foi implementada nesta iteracao. A prioridade foi resolver o bug critico de concorrencia da transferencia e garantir consistencia transacional ponta a ponta.

## Documentacao da API
Apos subir o backend, os contratos da API ficam disponiveis via Swagger/OpenAPI em:

- Swagger UI: `http://localhost:8081/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8081/v3/api-docs`
