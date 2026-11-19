package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.CareerRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CareerRoleRepository extends JpaRepository<CareerRole, String> {
    Optional<CareerRole> findByRoleName(String roleName);
}
