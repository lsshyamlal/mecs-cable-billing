package com.mecscable.billing.repository;

import com.mecscable.billing.entity.Area;
import com.mecscable.billing.entity.City;
import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.CustomerStatus;
import com.mecscable.billing.entity.Street;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE c.area.city.company.companyId = :companyId")
    List<Customer> findByAreaCityCompanyId(@Param("companyId") Long companyId);

    List<Customer> findByStatus(CustomerStatus status);

    List<Customer> findByArea(Area area);

    List<Customer> findByAreaAndStatus(Area area, CustomerStatus status);

    List<Customer> findByStreet(Street street);

    List<Customer> findByAreaCity(City city);

    Optional<Customer> findByStbIdAndStatus(String stbId, CustomerStatus status);

    long countByStatus(CustomerStatus status);

    long countByArea(Area area);

    long countByStreet(Street street);

    long countByAreaCity(City city);

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhoneOrEmail(String phone, String email);
}
