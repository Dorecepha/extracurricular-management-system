package com.ems.backend.repository;

import com.ems.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipient_UserIDOrderBySentAtDesc(Long userId);
    List<Notification> findByRecipient_UserIDAndIsReadFalse(Long userId);
}