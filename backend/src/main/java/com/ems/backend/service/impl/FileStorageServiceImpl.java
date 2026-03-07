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
    private final ObjectMapper objectMapper; // Injected from JacksonConfig bean

    public FileStorageServiceImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public String storeFiles(MultipartFile[] files) {
        return storeFilesInFolder(files, "proposals");
    }

    @Override
    public String storeFilesInFolder(MultipartFile[] files, String folder) {
        if (files == null || files.length == 0) {
            return "[]";
        }

        List<Map<String, String>> metadata = new ArrayList<>();

        try {
            String dir = "uploads/" + folder + "/";
            Path uploadPath = Paths.get(dir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            for (MultipartFile file : files) {
                String originalFilename = file.getOriginalFilename() != null
                        ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                        : "file";
                String fileName = UUID.randomUUID() + "_" + originalFilename;
                Path resolvedPath = uploadPath.resolve(fileName).normalize();
                if (!resolvedPath.startsWith(uploadPath.toAbsolutePath().normalize())) {
                    throw new RuntimeException("Invalid file path detected");
                }
                Files.copy(file.getInputStream(), resolvedPath, StandardCopyOption.REPLACE_EXISTING);

                Map<String, String> fileInfo = new HashMap<>();
                fileInfo.put("name", file.getOriginalFilename());
                fileInfo.put("path", dir + fileName);
                fileInfo.put("size", (file.getSize() / 1024) + " KB");
                metadata.add(fileInfo);
            }

            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            throw new RuntimeException("Could not store files: " + e.getMessage());
        }
    }

    @Override
    public Map<String, String> storeSingleFile(MultipartFile file, String folder) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        try {
            String dir = "uploads/" + folder + "/";
            Path uploadPath = Paths.get(dir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename() != null
                    ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                    : "file";
            String fileName = UUID.randomUUID() + "_" + originalFilename;
            Path resolvedPath = uploadPath.resolve(fileName).normalize();
            if (!resolvedPath.startsWith(uploadPath.toAbsolutePath().normalize())) {
                throw new RuntimeException("Invalid file path detected");
            }
            Files.copy(file.getInputStream(), resolvedPath, StandardCopyOption.REPLACE_EXISTING);

            Map<String, String> fileInfo = new HashMap<>();
            fileInfo.put("name", originalFilename);
            fileInfo.put("path", dir + fileName);
            fileInfo.put("size", (file.getSize() / 1024) + " KB");
            return fileInfo;
        } catch (Exception e) {
            throw new RuntimeException("Could not store file: " + e.getMessage());
        }
    }
}
