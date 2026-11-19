package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.PortfolioProject;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioProjectRepository extends JpaRepository<PortfolioProject, String> {
    boolean existsByCourseIdAndTitle(String courseId, String title);
    List<PortfolioProject> findByCourseIdIn(Collection<String> courseIds);
}
