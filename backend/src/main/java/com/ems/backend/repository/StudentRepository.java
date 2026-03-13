package com.ems.backend.repository;

import com.ems.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByStudentID(String studentID);

    boolean existsByStudentID(String studentID);
}
