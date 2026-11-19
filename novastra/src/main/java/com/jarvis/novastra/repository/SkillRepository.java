package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.Skill;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillRepository extends JpaRepository<Skill, String> {
    Optional<Skill> findBySkillNameAndCategory(String skillName, String category);
    List<Skill> findByCategory(String category);
}
