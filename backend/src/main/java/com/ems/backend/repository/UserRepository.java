package com.ems.backend.repository;

import com.ems.backend.entity.User;
import com.ems.backend.entity.Student;
import com.ems.backend.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    long countByRole(UserRole role);

    @org.springframework.data.jpa.repository.Query("SELECT u FROM Student u WHERE u.studentID = :studentID")
    Optional<Student> findByStudentID(String studentID);
}
