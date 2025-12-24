package com.ems.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Get the absolute path to the project root 'uploads' directory
        String uploadPath = Paths.get("uploads").toAbsolutePath().toUri().toString();

        // Maps http://localhost:8080/api/uploads/** (and /uploads/**) to the physical folder
        registry.addResourceHandler("/uploads/**", "/api/uploads/**")
                .addResourceLocations(uploadPath); // Uses file:/// syntax automatically
    }
}
