# Extracurricular Management System - AI Agent Instructions

## Project Overview
This is a Spring Boot 3.3.5 application (Java 21) for managing extracurricular activities at educational institutions. The system supports three user roles: Students, Event Organizers, and Administrators.

## Architecture
- **Backend**: Spring Boot REST API with JWT authentication
- **Frontend**: [TBD - currently empty]
- **Database**: MySQL with Spring Data JPA
- **File Storage**: AWS S3 for event-related documents/images
- **Package Structure**: `com.ems.backend.*`

## Key Dependencies & Patterns
- **Security**: Spring Security + JWT tokens (io.jsonwebtoken:0.12.6)
- **Data Mapping**: ModelMapper (3.2.1) for Entity ↔ DTO conversions
- **Validation**: Bean Validation with custom constraints
- **Database**: JPA repositories with MySQL connector
- **Utilities**: Lombok for boilerplate reduction

## Development Workflow
- **Build**: `mvn clean compile` (requires Java 21)
- **Run**: `mvn spring-boot:run` (default profile)
- **Test**: `mvn test` (JUnit 5 + Spring Security Test)
- **Database**: Configure MySQL connection in `application.properties`

## Code Conventions
- **Entities**: JPA entities in `entity` package with Lombok annotations
- **DTOs**: Request/Response DTOs in `dto` package, mapped via ModelMapper
- **Controllers**: REST controllers in `controller` package with validation
- **Services**: Business logic in `service` package with `@Service`
- **Security**: JWT-based auth with role-based access control
- **Configuration**: Spring config classes in `config` package

## Domain Model
Based on system diagrams in `Documents/Diagrams/`:
- **Users**: Students, Organizers, Admins with role-based permissions
- **Events**: Extracurricular activities with registration, proposals, updates
- **Authentication**: Token-based with sequence flows in diagrams
- **Workflows**: Event lifecycle from proposal → approval → registration → execution

## Integration Points
- **AWS S3**: File uploads for event materials (bucket configuration needed)
- **MySQL**: User data, event details, registration records
- **JWT**: Stateless authentication with refresh token patterns

## Common Patterns
- Use `@Valid` on controller methods for request validation
- ModelMapper for Entity→DTO conversions: `modelMapper.map(entity, Dto.class)`
- JWT utilities in security package for token generation/validation
- Exception handling with custom `@ControllerAdvice`

## File Storage
Reference `Documents/Diagrams/` for complete workflow understanding before implementing features.