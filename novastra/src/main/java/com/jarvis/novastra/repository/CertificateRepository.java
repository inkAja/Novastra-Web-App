package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.Certificate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CertificateRepository extends JpaRepository<Certificate, String> {
    boolean existsByCourseId(String courseId);
    List<Certificate> findByUserIdOrderByIssueDateDesc(String userId);
    void deleteByUserId(String userId);
}
