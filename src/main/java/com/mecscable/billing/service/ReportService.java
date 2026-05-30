package com.mecscable.billing.service;

import com.mecscable.billing.dto.response.CustomerResponse;
import com.mecscable.billing.dto.response.PaymentReportRow;
import com.mecscable.billing.entity.Customer;
import com.mecscable.billing.entity.Payment;
import com.mecscable.billing.repository.PaymentRepository;
import com.opencsv.CSVWriter;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ReportService {

    private static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final PaymentRepository paymentRepository;
    private final CustomerService customerService;

    public ReportService(PaymentRepository paymentRepository, CustomerService customerService) {
        this.paymentRepository = paymentRepository;
        this.customerService = customerService;
    }

    // ── Payment report ────────────────────────────────────────

    public List<PaymentReportRow> getPaymentReport(LocalDate from, LocalDate to, Long areaId) {
        List<Payment> payments = fetchPayments(from, to);
        return payments.stream()
                .filter(p -> areaId == null || p.getCustomer().getArea().getAreaId().equals(areaId))
                .map(this::toPaymentReportRow)
                .toList();
    }

    public byte[] exportPaymentsCsv(LocalDate from, LocalDate to, Long areaId) {
        List<PaymentReportRow> rows = getPaymentReport(from, to, areaId);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        baos.writeBytes(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF}); // UTF-8 BOM for Excel
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.writeNext(paymentCsvHeaders());
            for (PaymentReportRow r : rows) {
                writer.writeNext(paymentCsvRow(r));
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return baos.toByteArray();
    }

    public byte[] exportPaymentsExcel(LocalDate from, LocalDate to, Long areaId) {
        List<PaymentReportRow> rows = getPaymentReport(from, to, areaId);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Payments");
            CellStyle headerStyle = boldStyle(wb);

            Row header = sheet.createRow(0);
            String[] headers = paymentCsvHeaders();
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (PaymentReportRow r : rows) {
                Row row = sheet.createRow(rowNum++);
                String[] values = paymentCsvRow(r);
                for (int i = 0; i < values.length; i++) {
                    row.createCell(i).setCellValue(values[i]);
                }
            }
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    // ── Customer report ───────────────────────────────────────

    public List<CustomerResponse> getCustomerReport(String status, Long areaId) {
        return customerService.listCustomers(status, null, areaId);
    }

    public byte[] exportCustomersCsv(String status, Long areaId) {
        List<CustomerResponse> rows = getCustomerReport(status, areaId);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        baos.writeBytes(new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF});
        try (CSVWriter writer = new CSVWriter(new OutputStreamWriter(baos, StandardCharsets.UTF_8))) {
            writer.writeNext(customerCsvHeaders());
            for (CustomerResponse r : rows) {
                writer.writeNext(customerCsvRow(r));
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return baos.toByteArray();
    }

    public byte[] exportCustomersExcel(String status, Long areaId) {
        List<CustomerResponse> rows = getCustomerReport(status, areaId);
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Customers");
            CellStyle headerStyle = boldStyle(wb);

            Row header = sheet.createRow(0);
            String[] headers = customerCsvHeaders();
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;
            for (CustomerResponse r : rows) {
                Row row = sheet.createRow(rowNum++);
                String[] values = customerCsvRow(r);
                for (int i = 0; i < values.length; i++) {
                    row.createCell(i).setCellValue(values[i]);
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            wb.write(baos);
            return baos.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    // ── private helpers ───────────────────────────────────────

    private List<Payment> fetchPayments(LocalDate from, LocalDate to) {
        if (from != null && to != null) {
            OffsetDateTime fromOdt = from.atStartOfDay(IST).toOffsetDateTime();
            OffsetDateTime toOdt = to.atTime(LocalTime.MAX).atZone(IST).toOffsetDateTime();
            return paymentRepository.findByPaymentDateBetweenOrderByPaymentDateDesc(fromOdt, toOdt);
        }
        return paymentRepository.findAll();
    }

    private PaymentReportRow toPaymentReportRow(Payment p) {
        Customer c = p.getCustomer();
        LocalDate forMonth = p.getSubscription() != null ? p.getSubscription().getStartDate().withDayOfMonth(1) : null;
        return new PaymentReportRow(
                p.getPaymentId(),
                p.getPaymentDate(),
                forMonth,
                c.getCustomerId(),
                c.getFirstName() + (c.getLastName() != null ? " " + c.getLastName() : ""),
                c.getArea().getAreaName(),
                c.getPhone(),
                p.getAmount(),
                p.getPaymentMethod(),
                p.getRecordedBy().getFirstName() + (p.getRecordedBy().getLastName() != null ? " " + p.getRecordedBy().getLastName() : ""),
                p.getNotes()
        );
    }

    private String[] paymentCsvHeaders() {
        return new String[]{"Payment ID", "Payment Date", "For Month", "Customer ID", "Customer Name", "Area", "Phone", "Amount (₹)", "Method", "Recorded By", "Notes"};
    }

    private String[] paymentCsvRow(PaymentReportRow r) {
        return new String[]{
                String.valueOf(r.paymentId()),
                str(r.paymentDate()),
                str(r.forMonth()),
                String.valueOf(r.customerId()),
                r.customerName(),
                r.areaName(),
                r.phone(),
                str(r.amount()),
                r.paymentMethod() != null ? r.paymentMethod() : "",
                r.recordedByName(),
                r.notes() != null ? r.notes() : ""
        };
    }

    private String[] customerCsvHeaders() {
        return new String[]{"Customer ID", "First Name", "Last Name", "Area", "Door No", "Street", "Phone", "Email", "STB ID", "Status", "Current Amount (₹)", "Last Payment Date", "Subscription Start", "Subscription End"};
    }

    private String[] customerCsvRow(CustomerResponse r) {
        return new String[]{
                String.valueOf(r.customerId()),
                r.firstName(),
                r.lastName() != null ? r.lastName() : "",
                r.areaName(),
                r.doorNumber() != null ? r.doorNumber() : "",
                r.streetName() != null ? r.streetName() : "",
                r.phone(),
                r.email() != null ? r.email() : "",
                r.stbId() != null ? r.stbId() : "",
                r.status(),
                str(r.currentPaymentAmount()),
                str(r.lastPaymentDate()),
                str(r.currentSubscriptionStart()),
                str(r.currentSubscriptionEnd())
        };
    }

    private CellStyle boldStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        return style;
    }

    private String str(Object val) {
        return val != null ? val.toString() : "";
    }
}
