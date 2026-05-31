package com.mecscable.billing.service;

import com.mecscable.billing.entity.AuditLog;
import com.mecscable.billing.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(Long actorId, String action, String entityType, Long entityId, String details) {
        logWithRole(actorId, "ADMIN", action, entityType, entityId, details);
    }

    public void logWithRole(Long actorId, String role, String action, String entityType, Long entityId, String details) {
        AuditLog entry = new AuditLog();
        entry.setActorId(actorId);
        entry.setActorRole(role);
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }

    public void logSystem(String action, String entityType, Long entityId, String details) {
        AuditLog entry = new AuditLog();
        entry.setActorId(0L);
        entry.setActorRole("SYSTEM");
        entry.setAction(action);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setDetails(details);
        auditLogRepository.save(entry);
    }
}
