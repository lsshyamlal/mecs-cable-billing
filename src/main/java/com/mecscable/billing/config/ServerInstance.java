package com.mecscable.billing.config;

import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
public class ServerInstance {
    private final String instanceId = UUID.randomUUID().toString();
    public String getInstanceId() { return instanceId; }
}
