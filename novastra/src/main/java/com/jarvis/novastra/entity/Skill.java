package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "skill", schema = "public")
public class Skill {

    @Id
    @Column(name = "skill_id", length = 5)
    private String skillId;

    @Column(name = "skill_name", length = 60, nullable = false)
    private String skillName;

    @Column(name = "category", length = 60, nullable = false)
    private String category;

    public Skill() {}

    public String getSkillId() { return skillId; }
    public void setSkillId(String skillId) { this.skillId = skillId; }

    public String getSkillName() { return skillName; }
    public void setSkillName(String skillName) { this.skillName = skillName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
