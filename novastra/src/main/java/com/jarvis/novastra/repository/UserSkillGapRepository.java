package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.UserSkillGap;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSkillGapRepository extends JpaRepository<UserSkillGap, UserSkillGap.Key> {
    List<UserSkillGap> findByUserId(String userId);
    void deleteByUserId(String userId);
}
