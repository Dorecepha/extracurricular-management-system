package com.ems.backend.service;

import com.ems.backend.entity.AttendanceRecord;
import com.ems.backend.enums.AttendanceType;
import com.ems.backend.enums.OrganizationType;
import com.ems.backend.repository.UserRepository;
import com.ems.backend.entity.Student;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceExcelParserService {

    private final UserRepository userRepository;

    // Column header constants for Youth Union template
    private static final String COL_MSSV = "mssv";
    private static final String COL_HO_VA_TEN = "họ và tên";
    private static final String COL_KHOA_BO_MON = "khoa/bộ môn";
    private static final String COL_VAI_TRO = "vai trò";
    private static final String COL_GHI_CHU = "ghi chú";
    private static final String COL_NHAN_GCN = "nhận gcn";

    public List<AttendanceRecord> parseAttendanceExcel(
            MultipartFile file,
            Long eventID,
            Long reportID,
            OrganizationType organizationType) throws IOException {

        List<AttendanceRecord> records = new ArrayList<>();

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            if (organizationType == OrganizationType.YOUTH_UNION) {
                records.addAll(parseYouthUnionTemplate(workbook, eventID, reportID));
            } else {
                records.addAll(parseStudentAssociationTemplate(workbook, eventID, reportID));
            }
        }

        return records;
    }

    private List<AttendanceRecord> parseYouthUnionTemplate(Workbook workbook, Long eventID, Long reportID) {
        List<AttendanceRecord> records = new ArrayList<>();
        Sheet sheet = workbook.getSheetAt(0);

        Map<String, Integer> headerMap = mapHeaders(sheet.getRow(0));
        if (!headerMap.containsKey(COL_MSSV) || !headerMap.containsKey(COL_HO_VA_TEN)) {
            throw new IllegalArgumentException("Invalid Youth Union template: missing required columns");
        }

        int mssvIdx = headerMap.get(COL_MSSV);
        int nameIdx = headerMap.get(COL_HO_VA_TEN);
        int facultyIdx = headerMap.getOrDefault(COL_KHOA_BO_MON, -1);
        int roleIdx = headerMap.getOrDefault(COL_VAI_TRO, -1);
        int noteIdx = headerMap.getOrDefault(COL_GHI_CHU, -1);
        int certIdx = headerMap.getOrDefault(COL_NHAN_GCN, -1);

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String mssv = getCellValueAsString(row.getCell(mssvIdx));
            String fullName = getCellValueAsString(row.getCell(nameIdx));

            if (mssv == null || fullName == null || mssv.isBlank() || fullName.isBlank()) {
                continue;
            }

            String faculty = facultyIdx >= 0 ? getCellValueAsString(row.getCell(facultyIdx)) : null;
            String role = roleIdx >= 0 ? getCellValueAsString(row.getCell(roleIdx)) : null;
            String note = noteIdx >= 0 ? getCellValueAsString(row.getCell(noteIdx)) : null;
            boolean certEligible = certIdx >= 0 && isCertEligible(getCellValueAsString(row.getCell(certIdx)));

            // Try to find student by MSSV
            Optional<Student> studentOpt = userRepository.findByStudentID(mssv);
            AttendanceType type = studentOpt.isPresent() ? AttendanceType.REGISTERED : AttendanceType.WALK_IN;

            AttendanceRecord record = AttendanceRecord.builder()
                    .reportID(reportID)
                    .eventID(eventID)
                    .studentID(studentOpt.map(s -> s.getUserID()).orElse(null))
                    .mssv(mssv)
                    .fullName(fullName)
                    .faculty(faculty)
                    .role(role)
                    .attendanceType(type)
                    .certEligible(certEligible)
                    .prizeNote(note)
                    .confirmedAt(new java.util.Date().toString().contains("2026") ?
                            java.time.LocalDateTime.now() : null)
                    .build();

            records.add(record);
        }

        return records;
    }

    private List<AttendanceRecord> parseStudentAssociationTemplate(Workbook workbook, Long eventID, Long reportID) {
        List<AttendanceRecord> records = new ArrayList<>();
        Map<String, Integer> allHeaders = new HashMap<>();

        // Detect sheets: "LCH" or "CLBĐN"
        Sheet lchSheet = null;
        Sheet clbdnSheet = null;

        for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
            String sheetName = workbook.getSheetAt(i).getSheetName().toLowerCase();
            if (sheetName.contains("lch")) {
                lchSheet = workbook.getSheetAt(i);
            } else if (sheetName.contains("clbđn") || sheetName.contains("clbdn")) {
                clbdnSheet = workbook.getSheetAt(i);
            }
        }

        // If no special sheets found, use first sheet
        if (lchSheet == null && clbdnSheet == null) {
            lchSheet = workbook.getSheetAt(0);
        }

        // Process LCH sheet
        if (lchSheet != null) {
            allHeaders.putAll(mapHeaders(lchSheet.getRow(0)));
            records.addAll(parseSheetWithHeaders(lchSheet, eventID, reportID, allHeaders));
        }

        // Process CLBĐN sheet and merge (dedupe by MSSV)
        if (clbdnSheet != null) {
            Map<String, AttendanceRecord> existingByMssv = new HashMap<>();
            for (AttendanceRecord r : records) {
                if (r.getMssv() != null) {
                    existingByMssv.put(r.getMssv(), r);
                }
            }

            Map<String, Integer> clbdnHeaders = mapHeaders(clbdnSheet.getRow(0));
            for (AttendanceRecord r : parseSheetWithHeaders(clbdnSheet, eventID, reportID, clbdnHeaders)) {
                if (r.getMssv() != null && !existingByMssv.containsKey(r.getMssv())) {
                    records.add(r);
                }
            }
        }

        return records;
    }

    private List<AttendanceRecord> parseSheetWithHeaders(Sheet sheet, Long eventID, Long reportID, Map<String, Integer> headerMap) {
        List<AttendanceRecord> records = new ArrayList<>();

        int mssvIdx = headerMap.getOrDefault(COL_MSSV, -1);
        int nameIdx = headerMap.getOrDefault("họ tên", headerMap.getOrDefault("ho ten", -1));
        int facultyIdx = headerMap.getOrDefault(COL_KHOA_BO_MON, -1);
        int roleIdx = headerMap.getOrDefault(COL_VAI_TRO, -1);
        int noteIdx = headerMap.getOrDefault(COL_GHI_CHU, -1);
        int certIdx = headerMap.getOrDefault(COL_NHAN_GCN, -1);

        if (mssvIdx < 0 || nameIdx < 0) {
            return records;
        }

        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String mssv = getCellValueAsString(row.getCell(mssvIdx));
            String fullName = getCellValueAsString(row.getCell(nameIdx));

            if (mssv == null || fullName == null || mssv.isBlank() || fullName.isBlank()) {
                continue;
            }

            String faculty = facultyIdx >= 0 ? getCellValueAsString(row.getCell(facultyIdx)) : null;
            String role = roleIdx >= 0 ? getCellValueAsString(row.getCell(roleIdx)) : null;
            String note = noteIdx >= 0 ? getCellValueAsString(row.getCell(noteIdx)) : null;
            boolean certEligible = certIdx >= 0 && isCertEligible(getCellValueAsString(row.getCell(certIdx)));

            Optional<Student> studentOpt = userRepository.findByStudentID(mssv);
            AttendanceType type = studentOpt.isPresent() ? AttendanceType.REGISTERED : AttendanceType.WALK_IN;

            AttendanceRecord record = AttendanceRecord.builder()
                    .reportID(reportID)
                    .eventID(eventID)
                    .studentID(studentOpt.map(s -> s.getUserID()).orElse(null))
                    .mssv(mssv)
                    .fullName(fullName)
                    .faculty(faculty)
                    .role(role)
                    .attendanceType(type)
                    .certEligible(certEligible)
                    .prizeNote(note)
                    .build();

            records.add(record);
        }

        return records;
    }

    private Map<String, Integer> mapHeaders(Row headerRow) {
        Map<String, Integer> headerMap = new HashMap<>();
        if (headerRow == null) return headerMap;

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            Cell cell = headerRow.getCell(i);
            String header = getCellValueAsString(cell);
            if (header != null) {
                headerMap.put(header.toLowerCase().trim(), i);
            }
        }
        return headerMap;
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return null;

        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell)) {
                    yield cell.getDateCellValue().toString();
                }
                long numVal = (long) cell.getNumericCellValue();
                yield String.valueOf(numVal);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try {
                    yield cell.getStringCellValue();
                } catch (Exception e) {
                    yield String.valueOf(cell.getNumericCellValue());
                }
            }
            default -> null;
        };
    }

    private boolean isCertEligible(String value) {
        if (value == null) return false;
        String lower = value.toLowerCase().trim();
        return lower.equals("x") || lower.equals("có") || lower.equals("co") ||
               lower.equals("yes") || lower.equals("1") || lower.equals("true");
    }
}
