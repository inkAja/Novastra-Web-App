package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

@Entity
@IdClass(UserSkillGap.Key.class)
@Table(name = "user_skill_gap", schema = "public")
public class UserSkillGap {

    @Id
    @Column(name = "user_id", length = 5, nullable = false)
    private String userId;

    @Id
    @Column(name = "skill_id", length = 5, nullable = false)
    private String skillId;

    @Column(name = "current_level", precision = 5, scale = 2, nullable = false)
    private BigDecimal currentLevel = BigDecimal.ZERO;

    @Column(name = "is_priority", nullable = false)
    private Boolean isPriority = false;

    public UserSkillGap() {}

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getSkillId() { return skillId; }
    public void setSkillId(String skillId) { this.skillId = skillId; }

    public BigDecimal getCurrentLevel() { return currentLevel; }
    public void setCurrentLevel(BigDecimal currentLevel) { this.currentLevel = currentLevel; }

    public Boolean getIsPriority() { return isPriority; }
    public void setIsPriority(Boolean isPriority) { this.isPriority = isPriority; }

    public static class Key implements Serializable {
        private String userId;
        private String skillId;

        public Key() {}
        public Key(String userId, String skillId) {
            this.userId = userId;
            this.skillId = skillId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key other)) return false;
            return Objects.equals(userId, other.userId) && Objects.equals(skillId, other.skillId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(userId, skillId);
        }
    }
}
