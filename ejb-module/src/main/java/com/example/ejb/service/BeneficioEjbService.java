package com.example.ejb.service;

import com.example.ejb.model.Beneficio;
import jakarta.ejb.Stateless;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;

import java.math.BigDecimal;
import java.util.List;

@Stateless
public class BeneficioEjbService {

    @PersistenceContext
    private EntityManager em;

    public List<Beneficio> findAll() {
        return em.createQuery("SELECT b FROM Beneficio b ORDER BY b.id", Beneficio.class)
                .getResultList();
    }

    public Beneficio findById(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("beneficio id is required");
        }

        Beneficio beneficio = em.find(Beneficio.class, id);
        if (beneficio == null) {
            throw new EntityNotFoundException("beneficio not found for id " + id);
        }
        return beneficio;
    }

    public Beneficio update(Long id, String nome, String descricao) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("beneficio nome is required");
        }

        Beneficio beneficio = findById(id);
        beneficio.setNome(nome);
        beneficio.setDescricao(descricao);
        return em.merge(beneficio);
    }

    public void delete(Long id) {
        Beneficio beneficio = findById(id);
        em.remove(beneficio);
    }

    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        if (fromId == null || toId == null) {
            throw new IllegalArgumentException("fromId and toId are required");
        }
        if (fromId.equals(toId)) {
            throw new IllegalArgumentException("source and target must be different");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("transfer amount must be greater than zero");
        }

        Long firstLockId = Math.min(fromId, toId);
        Long secondLockId = Math.max(fromId, toId);

        Beneficio firstLocked = em.find(Beneficio.class, firstLockId, LockModeType.PESSIMISTIC_WRITE);
        Beneficio secondLocked = em.find(Beneficio.class, secondLockId, LockModeType.PESSIMISTIC_WRITE);

        Beneficio from = fromId.equals(firstLockId) ? firstLocked : secondLocked;
        Beneficio to = toId.equals(firstLockId) ? firstLocked : secondLocked;

        if (from == null || to == null) {
            throw new EntityNotFoundException("beneficio not found for source or target id");
        }
        if (from.getValor() == null || to.getValor() == null) {
            throw new IllegalStateException("beneficio balance is not initialized");
        }
        if (from.getValor().compareTo(amount) < 0) {
            throw new IllegalStateException("insufficient balance for transfer");
        }

        from.setValor(from.getValor().subtract(amount));
        to.setValor(to.getValor().add(amount));

        em.merge(from);
        em.merge(to);
    }
}
