# Load Testing & Production Readiness - TODO List

**Project Goal:** Evaluate EMS system's ability to handle 2,500 concurrent users and write a proposal documenting findings.

**Timeline:** 3-4 weeks (21-28 days)
**Detailed Plan:** [Load Testing Plan](.claude/plans/graceful-swinging-hejlsberg.md)

---

## 📌 Quick Links

- **Detailed Plan Document:** `.claude/plans/graceful-swinging-hejlsberg.md`
- **CLAUDE.md (Architecture Guide):** `CLAUDE.md`
- **k6 Documentation:** https://k6.io/docs/
- **Spring Boot Actuator Guide:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html

---

## 🗓️ Week 1: Setup & Baseline Testing (Days 1-7)

### Day 1-2: Environment Setup

- [ ] **Task 1:** Install k6 load testing tool
  - Download from: https://k6.io/docs/get-started/installation/
  - Verify: `k6 version`
  - Windows: `choco install k6` or direct download

- [ ] **Task 2:** Enable Spring Boot Actuator endpoints
  - **File:** `backend/src/main/resources/application.properties`
  - Add:
    ```properties
    management.endpoints.web.exposure.include=health,metrics,info
    management.endpoint.health.show-details=always
    management.metrics.export.simple.enabled=true
    ```
  - Test: http://localhost:8080/actuator/metrics

- [ ] **Task 3:** Enable SQL query logging
  - **File:** `backend/src/main/resources/application.properties`
  - Add:
    ```properties
    spring.jpa.show-sql=true
    spring.jpa.properties.hibernate.format_sql=true
    logging.level.org.hibernate.SQL=DEBUG
    logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
    ```

### Day 3-4: Test Data Preparation

- [ ] **Task 4:** Create SQL script to generate 10,000 test student accounts
  - **New File:** `backend/src/test/resources/load-test-data.sql`
  - Generate users with pattern: `student1@university.edu` to `student10000@university.edu`
  - Pre-hash passwords with BCrypt (all same password for testing)

- [ ] **Task 5:** Create 100 test events with varying capacities
  - Mix of capacities: 10, 50, 100, 500 spots
  - Spread across different dates/times for schedule conflict testing
  - Assign to test event organizers

- [ ] **Task 6:** Generate JWT tokens for all test users and save to CSV
  - **New File:** `load-tests/student_tokens.csv`
  - Format: `student_id,email,jwt_token`
  - Use existing `/api/auth/login` endpoint or create utility script
  - Store tokens for reuse (valid for 6 months per current config)

### Day 5-7: Test Script Creation & Baseline Testing

- [ ] **Task 7:** Write k6 script for Test Scenario 1 (Single Event Registration)
  - **New File:** `load-tests/single-event-registration.js`
  - 500 VUs attempting to register for 1 event (capacity = 100)
  - Tests: Optimistic locking mechanism, race condition handling
  - See plan file for complete script

- [ ] **Task 8:** Write k6 script for Test Scenario 2 (Distributed Load)
  - **New File:** `load-tests/distributed-load.js`
  - 500 VUs distributed across 50 events
  - Tests: Database connection pool limits, overall throughput
  - See plan file for complete script

- [ ] **Task 9:** Run baseline tests and capture metrics
  - Run both test scripts without optimizations
  - Export results: `k6 run --out json=results-baseline.json test.js`
  - Capture:
    - Response times (p50, p95, p99)
    - Success/error rates
    - Database connection pool utilization (from Actuator)
    - Screenshots of errors

- [ ] **Task 10:** Document baseline test results with screenshots
  - Create comparison table (see plan for format)
  - Take screenshots of:
    - k6 terminal output
    - Actuator metrics (connection pool)
    - Error logs showing connection timeouts
  - Save in `load-tests/results/baseline/` directory

---

## 🔧 Week 2: Core Optimizations (Days 8-14)

### Day 8-9: Connection Pool & Email Configuration

- [ ] **Task 11:** Implement connection pool tuning
  - **File:** `backend/src/main/resources/application.properties`
  - Add HikariCP configuration:
    ```properties
    spring.datasource.hikari.maximum-pool-size=50
    spring.datasource.hikari.minimum-idle=20
    spring.datasource.hikari.connection-timeout=10000
    spring.datasource.hikari.idle-timeout=300000
    spring.datasource.hikari.max-lifetime=600000
    spring.datasource.hikari.leak-detection-threshold=60000
    ```

- [ ] **Task 12:** Create AsyncConfig.java for email thread pool
  - **New File:** `backend/src/main/java/com/ems/backend/config/AsyncConfig.java`
  - Configure ThreadPoolTaskExecutor with bounded pool (10 core, 50 max, 500 queue)
  - See plan file for complete implementation
  - Update `OutlookEmailAdapter.java` to use `@Async("taskExecutor")`

### Day 10-11: JWT User Caching (CRITICAL OPTIMIZATION)

- [ ] **Task 13:** Modify JwtUtils.java to include user claims in JWT token
  - **File:** `backend/src/main/java/com/ems/backend/security/JwtUtils.java`
  - Add claims to `generateToken()`:
    - `userID` (Long)
    - `role` (String)
    - `firstName` (String)
  - See plan file for complete code

- [ ] **Task 14:** Modify JwtAuthenticationFilter.java to extract user from JWT claims
  - **File:** `backend/src/main/java/com/ems/backend/security/JwtAuthenticationFilter.java`
  - Replace `loadUserByUsername()` with JWT claim extraction
  - Create lightweight `CustomUserDetails` from claims (no DB fetch)
  - **Impact:** Eliminates 2,500 DB queries per load test!
  - See plan file for complete code

### Day 12-13: Database Indexes

- [ ] **Task 15:** Add database indexes to Registration.java entity
  - **File:** `backend/src/main/java/com/ems/backend/entity/Registration.java`
  - Add `@Index` annotations:
    - `idx_student_status` on (student_id, status)
    - `idx_event_date` on (event_id)
  - See plan file for complete code

- [ ] **Task 16:** Add database indexes to Event.java entity
  - **File:** `backend/src/main/java/com/ems/backend/entity/Event.java`
  - Add `@Index` annotations:
    - `idx_organizer_status` on (organizer_id, status)
    - `idx_event_date_time` on (event_date, start_time, end_time)
  - See plan file for complete code

### Day 14: Validation Testing

- [ ] **Task 17:** Test optimizations individually and verify each works
  - Restart backend after each change
  - Test connection pool: Check Actuator metrics show increased pool size
  - Test JWT caching: Verify no `SELECT` queries on authenticated requests
  - Test indexes: Check query execution times in logs
  - Fix any issues before proceeding

---

## 🚀 Week 3: Additional Improvements & Validation (Days 15-21)

### Day 15-16: Advanced Optimizations

- [ ] **Task 18:** Implement exponential backoff in RegistrationServiceImpl.java
  - **File:** `backend/src/main/java/com/ems/backend/service/impl/RegistrationServiceImpl.java`
  - Replace fixed 50ms backoff with exponential + jitter
  - Formula: `backoffMs = (long) (Math.pow(2, attempt) * 25 + Math.random() * 25)`
  - Cap at 200ms
  - See plan file for complete code (lines 107-110)

- [ ] **Task 19:** Add @Transactional(readOnly=true) to read methods
  - **File:** `backend/src/main/java/com/ems/backend/service/impl/EventServiceImpl.java`
  - Add to: `getAllEvents()`, `getEventById()`, etc.
  - MySQL optimization hint for better query plans

### Day 17-18: Final Load Tests

- [ ] **Task 20:** Run complete post-optimization load tests (all scenarios)
  - Run both k6 scripts with all optimizations enabled
  - Export results: `k6 run --out json=results-optimized.json test.js`
  - Capture same metrics as baseline for comparison
  - Monitor:
    - Response times (should be 85%+ faster)
    - Success rates (should be 98-100%)
    - Connection pool utilization (should not saturate)

### Day 19-20: Results Documentation

- [ ] **Task 21:** Create before/after comparison charts and graphs
  - Use k6 JSON output or Excel
  - Required charts:
    1. Response time comparison (box plot)
    2. Throughput over time (line graph)
    3. Error rate by concurrent users (bar chart)
    4. Database connection pool utilization (time series)
  - Save as images for presentation

- [ ] **Task 22:** Capture screenshots of Actuator metrics during tests
  - HikariCP pool metrics during baseline vs optimized
  - JVM heap memory usage
  - HTTP request metrics (count, duration)
  - Save in `load-tests/results/optimized/` directory

---

## 📝 Week 4: Documentation & Presentation (Days 22-28)

### Day 22-24: Technical Brief

- [ ] **Task 23:** Write technical brief document (5-10 pages)
  - **New File:** `docs/load-testing-proposal.md` or `.docx`
  - **Structure:** (see plan file Section 7.1 PART 2)
    1. Executive Summary (1 page)
    2. System Overview (1 page)
    3. Load Testing Methodology (1-2 pages)
    4. Results & Analysis (2-3 pages) - Include comparison tables
    5. Implemented Optimizations (1-2 pages)
    6. Recommendations (1 page)
    7. Appendices (code diffs, k6 scripts, metrics screenshots)
  - Use tables and charts from Task 21

### Day 25-26: Presentation Creation

- [ ] **Task 24:** Create PowerPoint presentation (15-20 slides)
  - **New File:** `docs/load-testing-presentation.pptx`
  - **Structure:** (see plan file Section 7.1 PART 1)
    - Slides 1-3: Intro, problem, agenda
    - Slides 4-7: System architecture, test approach
    - Slide 8: Baseline results (red/yellow - the bad news)
    - Slides 9-11: The 5 critical bottlenecks
    - Slides 12-15: Solutions summary
    - Slide 16: Post-optimization results (green - the good news)
    - Slide 17: Before/after comparison chart (show +1,000% improvement)
    - Slides 18-20: Scalability analysis, recommendations, conclusion
  - Use charts from Task 21
  - Keep visual - more diagrams, less text

### Day 27: Rehearsal

- [ ] **Task 25:** Rehearse presentation and refine slides
  - Practice explaining technical concepts simply
  - Time yourself (aim for 15-20 minutes)
  - Prepare for questions:
    - Why optimistic locking vs pessimistic locking?
    - What if we had 10,000 concurrent users?
    - What about cloud deployment?
  - Refine slides based on rehearsal

### Day 28: Final Review

- [ ] **Task 26:** Final review of all deliverables and submit
  - Review technical brief for typos, clarity
  - Check all charts/screenshots are high quality
  - Verify code references are accurate
  - Ensure Git branch is clean: `feature/load-testing-optimizations`
  - Commit all changes with descriptive messages
  - Submit deliverables to instructor

---

## 🎯 Success Criteria Checklist

Your proposal will be successful if you demonstrate:

- [ ] **Systematic approach** - Followed scientific method (baseline → optimization → validation)
- [ ] **Quantitative results** - Concrete metrics showing improvements
- [ ] **Problem identification** - Clearly identified 5 bottlenecks with evidence
- [ ] **Solution implementation** - Actually implemented and tested optimizations (not just theory)
- [ ] **Reproducibility** - Included k6 test scripts and setup instructions
- [ ] **Production readiness** - System handles 2,500 concurrent users with <5% error rate
- [ ] **Professional documentation** - Well-structured proposal with graphs, tables, code references

---

## 📊 Expected Results Summary

After completing all optimizations, you should achieve:

| Metric | Baseline | Optimized | Improvement |
|--------|----------|-----------|-------------|
| **Success Rate** | 8-20% | 98-100% | **+1,000%** |
| **Avg Response Time** | 1,250ms | 180ms | **85% faster** |
| **p95 Response Time** | 2,500ms | 320ms | **87% faster** |
| **DB Queries per Request** | 2 (user fetch) | 0 (JWT claims) | **100% reduction** |
| **Connection Pool Capacity** | 10 connections | 50 connections | **+400%** |
| **Concurrent User Capacity** | ~100 users | 2,500+ users | **+2,400%** |

---

## 🔍 Critical Files Reference

### Files to Modify (Backend)
- `backend/src/main/resources/application.properties` - Connection pool, monitoring, SQL logging
- `backend/src/main/java/com/ems/backend/security/JwtUtils.java` - Add user claims to JWT
- `backend/src/main/java/com/ems/backend/security/JwtAuthenticationFilter.java` - Extract from JWT claims
- `backend/src/main/java/com/ems/backend/config/AsyncConfig.java` - Email thread pool (NEW FILE)
- `backend/src/main/java/com/ems/backend/entity/Registration.java` - Add indexes
- `backend/src/main/java/com/ems/backend/entity/Event.java` - Add indexes
- `backend/src/main/java/com/ems/backend/service/impl/RegistrationServiceImpl.java` - Exponential backoff
- `backend/src/main/java/com/ems/backend/service/impl/EventServiceImpl.java` - Read-only transactions

### Files to Create (Load Testing)
- `load-tests/single-event-registration.js` - k6 script for scenario 1
- `load-tests/distributed-load.js` - k6 script for scenario 2
- `load-tests/student_tokens.csv` - Pre-generated JWT tokens
- `backend/src/test/resources/load-test-data.sql` - Test data generation script

### Files to Create (Documentation)
- `docs/load-testing-proposal.md` or `.docx` - Technical brief (5-10 pages)
- `docs/load-testing-presentation.pptx` - Presentation (15-20 slides)

---

## 💡 Pro Tips

### Time-Saving Strategies
1. **Focus on Top 3 Optimizations** if time is tight:
   - Connection pool tuning (easiest, high impact)
   - JWT user caching (medium difficulty, **highest impact**)
   - Database indexes (easy, high impact)

2. **Reuse Existing Resources:**
   - Architecture diagrams from your original project docs
   - k6's built-in HTML reports instead of custom charts
   - Spring Boot Actuator screenshots (no need for Prometheus/Grafana)

3. **Test Incrementally:**
   - Test each optimization individually before moving to next
   - Commit after each successful optimization
   - Easier to debug if something breaks

### Documentation Best Practices
1. **Screenshot Everything:**
   - k6 terminal output (baseline and optimized)
   - Error messages (connection timeouts, optimistic locking failures)
   - Actuator metrics (before/after comparison)
   - SQL query logs showing execution times

2. **Version Control:**
   - Create branch: `feature/load-testing-optimizations`
   - One commit per optimization with clear message
   - Makes it easy to show instructor your incremental progress

3. **Local Machine Specs:**
   - Document your hardware specs in proposal:
     - CPU model and cores
     - RAM amount
     - MySQL version: 8.0
     - Java version: 21
     - k6 version
   - Note: "All tests conducted on single machine (backend + database co-located)"
   - This actually makes your test MORE challenging (more impressive results)

---

## 🆘 Troubleshooting Common Issues

### Issue: k6 won't install on Windows
- **Solution:** Try direct download from GitHub releases: https://github.com/grafana/k6/releases
- Extract to `C:\k6` and add to PATH

### Issue: MySQL connection pool not increasing
- **Solution:** Restart Spring Boot app after modifying `application.properties`
- Verify with Actuator: http://localhost:8080/actuator/metrics/hikaricp.connections.max

### Issue: JWT tokens expiring during tests
- **Current config:** Tokens expire after 6 months (not 24 hours as documented)
- **If needed:** Regenerate tokens with longer expiration

### Issue: Local machine overloaded during 500 VU test
- **Solution:** Reduce VUs to 250-300 and increase iterations
- Or use staged ramping: 0→250→500→250→0

### Issue: Database schema not updating with new indexes
- **Solution:** Drop and recreate tables OR manually add indexes via SQL:
  ```sql
  CREATE INDEX idx_student_status ON registrations(student_id, status);
  ```

---

## 📞 Need Help?

Refer back to:
- **Detailed Plan:** `.claude/plans/graceful-swinging-hejlsberg.md` (complete implementation guide)
- **CLAUDE.md:** Project architecture and design patterns
- **k6 Documentation:** https://k6.io/docs/
- **Spring Boot Actuator:** https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html

---

**Last Updated:** 2026-02-06
**Project:** Extracurricular Management System (EMS)
**Instructor Assignment:** Evaluate system capacity for 2,500 concurrent users
