package com.finiteloop.expensetracker.controller;

import com.finiteloop.expensetracker.model.Category;
import com.finiteloop.expensetracker.model.Expense;
import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.service.CategoryService;
import com.finiteloop.expensetracker.service.ExpenseService;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.awt.Color;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private CategoryService categoryService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");

        LocalDate today = LocalDate.now();
        LocalDate startOfMonth = today.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());

        // All expenses
        List<Expense> allExpenses = expenseService.getFilteredExpensesList(user, null, null, null, null, null, Sort.by("date").descending());
        List<Category> allCategories = categoryService.getAllCategories();

        double totalSpent = allExpenses.stream().mapToDouble(Expense::getAmount).sum();
        
        // This Month's Expenses
        List<Expense> currentMonthExpenses = allExpenses.stream()
                .filter(e -> !e.getDate().isBefore(startOfMonth) && !e.getDate().isAfter(endOfMonth))
                .collect(Collectors.toList());
        double currentMonthSpent = currentMonthExpenses.stream().mapToDouble(Expense::getAmount).sum();

        // Highest Category Expense
        Map<String, Double> categoryTotals = new HashMap<>();
        for (Expense e : allExpenses) {
            String catName = e.getCategory().getCategoryName();
            categoryTotals.put(catName, categoryTotals.getOrDefault(catName, 0.0) + e.getAmount());
        }

        String highestCategoryName = "None";
        double highestCategoryAmt = 0.0;
        for (Map.Entry<String, Double> entry : categoryTotals.entrySet()) {
            if (entry.getValue() > highestCategoryAmt) {
                highestCategoryAmt = entry.getValue();
                highestCategoryName = entry.getKey();
            }
        }

        // Remaining Budget Calculation (Sum of Categories limits - Current month spent on them)
        double totalBudgetLimit = allCategories.stream().mapToDouble(Category::getBudgetLimit).sum();
        double remainingBudget = totalBudgetLimit - currentMonthSpent;

        // Monthly Trend (Last 6 Months)
        Map<String, Double> monthlyTrend = new LinkedHashMap<>();
        for (int i = 5; i >= 0; i--) {
            LocalDate targetDate = today.minusMonths(i);
            String monthName = targetDate.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH) + " " + targetDate.getYear();
            LocalDate monthStart = targetDate.with(TemporalAdjusters.firstDayOfMonth());
            LocalDate monthEnd = targetDate.with(TemporalAdjusters.lastDayOfMonth());
            
            double spentInMonth = allExpenses.stream()
                    .filter(e -> !e.getDate().isBefore(monthStart) && !e.getDate().isAfter(monthEnd))
                    .mapToDouble(Expense::getAmount)
                    .sum();
            
            monthlyTrend.put(monthName, spentInMonth);
        }

        // Recent Transactions (Limit 5)
        List<Map<String, Object>> recentTx = allExpenses.stream()
                .limit(5)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("expenseId", e.getExpenseId());
                    map.put("amount", e.getAmount());
                    map.put("description", e.getDescription());
                    map.put("date", e.getDate().toString());
                    map.put("paymentMethod", e.getPaymentMethod());
                    map.put("categoryName", e.getCategory().getCategoryName());
                    return map;
                })
                .collect(Collectors.toList());

        // Prepare Summary Payload
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalSpent", totalSpent);
        summary.put("currentMonthSpent", currentMonthSpent);
        summary.put("highestCategory", highestCategoryName);
        summary.put("highestCategoryAmount", highestCategoryAmt);
        summary.put("transactionsCount", allExpenses.size());
        summary.put("categoriesCount", allCategories.size());
        summary.put("remainingBudget", remainingBudget);
        summary.put("totalBudget", totalBudgetLimit);
        summary.put("categorySpent", categoryTotals);
        summary.put("monthlyTrend", monthlyTrend);
        summary.put("recentExpenses", recentTx);

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/filter")
    public ResponseEntity<List<Expense>> getFilteredReports(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {
        
        User user = (User) request.getAttribute("currentUser");
        List<Expense> expenses = expenseService.getFilteredExpensesList(user, categoryId, paymentMethod, startDate, endDate, null, Sort.by("date").descending());
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCSV(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) {

        User user = (User) request.getAttribute("currentUser");
        List<Expense> expenses = expenseService.getFilteredExpensesList(user, categoryId, paymentMethod, startDate, endDate, null, Sort.by("date").descending());

        StringBuilder csvContent = new StringBuilder();
        csvContent.append("ID,Date,Category,Description,Payment Method,Amount\n");
        for (Expense e : expenses) {
            csvContent.append(e.getExpenseId()).append(",")
                      .append(e.getDate()).append(",")
                      .append("\"").append(e.getCategory().getCategoryName().replace("\"", "\"\"")).append("\",")
                      .append("\"").append(e.getDescription().replace("\"", "\"\"")).append("\",")
                      .append(e.getPaymentMethod()).append(",")
                      .append(e.getAmount()).append("\n");
        }

        byte[] csvBytes = csvContent.toString().getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "expenses_report_" + LocalDate.now() + ".csv");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok().headers(headers).body(csvBytes);
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPDF(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request) throws IOException {

        User user = (User) request.getAttribute("currentUser");
        List<Expense> expenses = expenseService.getFilteredExpensesList(user, categoryId, paymentMethod, startDate, endDate, null, Sort.by("date").descending());

        // Report Statistics: Total, Average, Highest
        double totalSpent = expenses.stream().mapToDouble(Expense::getAmount).sum();
        double averageSpent = expenses.isEmpty() ? 0.0 : totalSpent / expenses.size();
        double highestSpent = expenses.stream().mapToDouble(Expense::getAmount).max().orElse(0.0);

        // Build OpenPDF Document
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 54, 54);
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font Settings
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Color.DARK_GRAY);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            Font statTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.DARK_GRAY);
            Font statValFont = FontFactory.getFont(FontFactory.HELVETICA, 12, Color.BLACK);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.BLACK);

            // Document Header
            Paragraph title = new Paragraph("Expense Tracker Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph subtitle = new Paragraph("Personal Finance Management System - Prepared for " + user.getName(), subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            subtitle.setSpacingAfter(20);
            document.add(subtitle);

            // Statistics Section (Total, Average, Highest)
            PdfPTable statTable = new PdfPTable(3);
            statTable.setWidthPercentage(100);
            statTable.setSpacingAfter(25);
            
            PdfPCell cell1 = new PdfPCell(new Paragraph("Total Spent", statTitleFont));
            cell1.setBackgroundColor(new Color(240, 240, 240));
            cell1.setPadding(8);
            cell1.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            PdfPCell cell2 = new PdfPCell(new Paragraph("Average Expense", statTitleFont));
            cell2.setBackgroundColor(new Color(240, 240, 240));
            cell2.setPadding(8);
            cell2.setHorizontalAlignment(Element.ALIGN_CENTER);

            PdfPCell cell3 = new PdfPCell(new Paragraph("Highest Transaction", statTitleFont));
            cell3.setBackgroundColor(new Color(240, 240, 240));
            cell3.setPadding(8);
            cell3.setHorizontalAlignment(Element.ALIGN_CENTER);

            statTable.addCell(cell1);
            statTable.addCell(cell2);
            statTable.addCell(cell3);

            PdfPCell valCell1 = new PdfPCell(new Paragraph(String.format("INR %.2f", totalSpent), statValFont));
            valCell1.setPadding(10);
            valCell1.setHorizontalAlignment(Element.ALIGN_CENTER);

            PdfPCell valCell2 = new PdfPCell(new Paragraph(String.format("INR %.2f", averageSpent), statValFont));
            valCell2.setPadding(10);
            valCell2.setHorizontalAlignment(Element.ALIGN_CENTER);

            PdfPCell valCell3 = new PdfPCell(new Paragraph(String.format("INR %.2f", highestSpent), statValFont));
            valCell3.setPadding(10);
            valCell3.setHorizontalAlignment(Element.ALIGN_CENTER);

            statTable.addCell(valCell1);
            statTable.addCell(valCell2);
            statTable.addCell(valCell3);

            document.add(statTable);

            // Expense Records Title
            Paragraph recordsTitle = new Paragraph("Detailed Transaction Logs", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, Color.BLACK));
            recordsTitle.setSpacingAfter(10);
            document.add(recordsTitle);

            // Table of expenses (5 columns)
            PdfPTable table = new PdfPTable(new float[] { 2f, 3f, 4f, 2.5f, 2.5f });
            table.setWidthPercentage(100);
            table.setSpacingAfter(15);

            String[] columns = {"Date", "Category", "Description", "Payment Method", "Amount"};
            for (String colName : columns) {
                PdfPCell headCell = new PdfPCell(new Paragraph(colName, headFont));
                headCell.setBackgroundColor(new Color(11, 15, 25)); // Modern deep gray
                headCell.setPadding(6);
                headCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(headCell);
            }

            for (Expense e : expenses) {
                PdfPCell dateC = new PdfPCell(new Paragraph(e.getDate().toString(), bodyFont));
                dateC.setPadding(5);
                dateC.setHorizontalAlignment(Element.ALIGN_CENTER);

                PdfPCell catC = new PdfPCell(new Paragraph(e.getCategory().getCategoryName(), bodyFont));
                catC.setPadding(5);

                PdfPCell descC = new PdfPCell(new Paragraph(e.getDescription(), bodyFont));
                descC.setPadding(5);

                PdfPCell payC = new PdfPCell(new Paragraph(e.getPaymentMethod(), bodyFont));
                payC.setPadding(5);
                payC.setHorizontalAlignment(Element.ALIGN_CENTER);

                PdfPCell amtC = new PdfPCell(new Paragraph(String.format("INR %.2f", e.getAmount()), bodyFont));
                amtC.setPadding(5);
                amtC.setHorizontalAlignment(Element.ALIGN_RIGHT);

                table.addCell(dateC);
                table.addCell(catC);
                table.addCell(descC);
                table.addCell(payC);
                table.addCell(amtC);
            }

            document.add(table);
            
            if (expenses.isEmpty()) {
                Paragraph noRecords = new Paragraph("No transactions found matching the filter criteria.", bodyFont);
                noRecords.setAlignment(Element.ALIGN_CENTER);
                document.add(noRecords);
            }

        } catch (DocumentException de) {
            throw new IOException(de.getMessage());
        } finally {
            document.close();
        }

        byte[] pdfBytes = out.toByteArray();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "expenses_report_" + LocalDate.now() + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok().headers(headers).body(pdfBytes);
    }
}
