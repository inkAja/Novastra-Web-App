package com.jarvis.novastra.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "career_role", schema = "public")
public class CareerRole {

    @Id
    @Column(name = "role_id", length = 5)
    private String roleId;

    @Column(name = "role_name", length = 60, nullable = false)
    private String roleName;

    @Column(name = "description")
    private String description;

    public CareerRole() {}

    public String getRoleId() { return roleId; }
    public void setRoleId(String roleId) { this.roleId = roleId; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
