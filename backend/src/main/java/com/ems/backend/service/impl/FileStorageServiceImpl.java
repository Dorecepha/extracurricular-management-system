package com.ems.backend.service.impl;

import com.ems.backend.service.FileStorageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {
    private final String uploadDir = "uploads/proposals/";

    @Override
    public String storeFiles(MultipartFile[] files) {
        if (files == null || files.length == 0) {
            return "[]";
        }

        List<Map<String, String>> metadata = new ArrayList<>();

        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile file : files) {
                String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                Files.copy(file.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);

                Map<String, String> fileInfo = new HashMap<>();
                fileInfo.put("name", file.getOriginalFilename());
                fileInfo.put("path", uploadDir + fileName);
                fileInfo.put("size", (file.getSize() / 1024) + " KB");
                metadata.add(fileInfo);
            }

            return new ObjectMapper().writeValueAsString(metadata);
        } catch (Exception e) {
            throw new RuntimeException("Could not store files: " + e.getMessage());
        }
    }
}
