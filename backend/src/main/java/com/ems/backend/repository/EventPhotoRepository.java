package com.ems.backend.repository;

import com.ems.backend.entity.EventPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventPhotoRepository extends JpaRepository<EventPhoto, Long> {

    List<EventPhoto> findByReportIDOrderByOrderIndexAsc(Long reportID);

    void deleteByReportID(Long reportID);
}
