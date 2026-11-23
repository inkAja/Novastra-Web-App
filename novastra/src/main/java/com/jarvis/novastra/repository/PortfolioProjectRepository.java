package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.PortfolioProject;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioProjectRepository extends JpaRepository<PortfolioProject, String> {
    boolean existsByCourseId(String courseId);
    boolean existsByCourseIdAndTitle(String courseId, String title);
    List<PortfolioProject> findByCourseIdOrderByProjectIdAsc(String courseId);
    List<PortfolioProject> findByCourseIdIn(Collection<String> courseIds);
    Optional<PortfolioProject> findTopByProjectIdStartingWithOrderByProjectIdDesc(String prefix);
}
