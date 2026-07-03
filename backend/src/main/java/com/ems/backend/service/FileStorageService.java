package com.ems.backend.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface FileStorageService {
    String storeFiles(MultipartFile[] files);

    String storeFilesInFolder(MultipartFile[] files, String folder);

    Map<String, String> storeSingleFile(MultipartFile file, String folder);
}
