package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.CareerSkillCalculation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CareerSkillCalculationRepository extends JpaRepository<CareerSkillCalculation, CareerSkillCalculation.Key> {
    boolean existsByRoleIdAndSkillId(String roleId, String skillId);
    List<CareerSkillCalculation> findByRoleId(String roleId);
}
