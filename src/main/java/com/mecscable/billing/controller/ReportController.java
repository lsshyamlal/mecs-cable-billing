package com.mecscable.billing.controller;

import com.mecscable.billing.dto.response.CustomerResponse;
import com.mecscable.billing.dto.response.PaymentReportRow;
import com.mecscable.billing.service.ReportService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    // ── Payment report ────────────────────────────────────────

    @GetMapping("/payments")
    public ResponseEntity<List<PaymentReportRow>> paymentReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long areaId) {
        return ResponseEntity.ok(reportService.getPaymentReport(from, to, areaId));
    }

    @GetMapping("/payments/export")
    public void exportPayments(
            HttpServletResponse response,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) Long areaId,
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        if ("excel".equalsIgnoreCase(format)) {
            byte[] data = reportService.exportPaymentsExcel(from, to, areaId);
            writeFile(response, data, "payments_report.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            byte[] data = reportService.exportPaymentsCsv(from, to, areaId);
            writeFile(response, data, "payments_report.csv", "text/csv;charset=UTF-8");
        }
    }

    // ── Customer report ───────────────────────────────────────

    @GetMapping("/customers")
    public ResponseEntity<List<CustomerResponse>> customerReport(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long areaId) {
        return ResponseEntity.ok(reportService.getCustomerReport(status, areaId));
    }

    @GetMapping("/customers/export")
    public void exportCustomers(
            HttpServletResponse response,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long areaId,
            @RequestParam(defaultValue = "csv") String format) throws IOException {
        if ("excel".equalsIgnoreCase(format)) {
            byte[] data = reportService.exportCustomersExcel(status, areaId);
            writeFile(response, data, "customers_report.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        } else {
            byte[] data = reportService.exportCustomersCsv(status, areaId);
            writeFile(response, data, "customers_report.csv", "text/csv;charset=UTF-8");
        }
    }

    // ── helper ────────────────────────────────────────────────

    private void writeFile(HttpServletResponse response, byte[] data, String filename, String contentType)
            throws IOException {
        response.setContentType(contentType);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        response.setContentLength(data.length);
        response.getOutputStream().write(data);
        response.getOutputStream().flush();
    }
}
