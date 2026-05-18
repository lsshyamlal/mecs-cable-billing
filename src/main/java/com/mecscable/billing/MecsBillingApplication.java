package com.mecscable.billing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MecsBillingApplication {

    public static void main(String[] args) {
        SpringApplication.run(MecsBillingApplication.class, args);
    }
}
