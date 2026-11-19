package com.jarvis.novastra.repository;

import com.jarvis.novastra.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findTopByOrderByUserIdDesc();
}
