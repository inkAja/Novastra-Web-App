package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@IdClass(CareerSkillCalculation.Key.class)
@Table(name = "career_skill_calculation", schema = "public")
public class CareerSkillCalculation {

    @Id
    @Column(name = "role_id", length = 5, nullable = false)
    private String roleId;

    @Id
    @Column(name = "skill_id", length = 5, nullable = false)
    private String skillId;

    @Column(name = "target_level", precision = 5, scale = 2, nullable = false)
    private BigDecimal targetLevel;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public CareerSkillCalculation() {}

    public String getRoleId() { return roleId; }
    public void setRoleId(String roleId) { this.roleId = roleId; }

    public String getSkillId() { return skillId; }
    public void setSkillId(String skillId) { this.skillId = skillId; }

    public BigDecimal getTargetLevel() { return targetLevel; }
    public void setTargetLevel(BigDecimal targetLevel) { this.targetLevel = targetLevel; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public static class Key implements Serializable {
        private String roleId;
        private String skillId;

        public Key() {}
        public Key(String roleId, String skillId) {
            this.roleId = roleId;
            this.skillId = skillId;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof Key other)) return false;
            return Objects.equals(roleId, other.roleId) && Objects.equals(skillId, other.skillId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roleId, skillId);
        }
    }
}
