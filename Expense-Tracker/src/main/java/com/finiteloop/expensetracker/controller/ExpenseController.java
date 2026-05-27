package com.finiteloop.expensetracker.controller;

import com.finiteloop.expensetracker.dto.ExpenseDTO;
import com.finiteloop.expensetracker.model.Expense;
import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.service.ExpenseService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    @Autowired
    private ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<Page<ExpenseDTO>> getExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {

        User user = (User) request.getAttribute("currentUser");

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Expense> expensePage = expenseService.getFilteredExpenses(user, categoryId, paymentMethod, startDate, endDate, search, pageable);
        
        // Map Page<Expense> to Page<ExpenseDTO>
        Page<ExpenseDTO> dtoPage = expensePage.map(this::convertToDTO);

        return ResponseEntity.ok(dtoPage);
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@Valid @RequestBody ExpenseDTO dto, HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");
        LocalDate date = LocalDate.parse(dto.getDate());

        // Check if adding this expense exceeds the monthly budget for the category
        boolean budgetExceeded = expenseService.isCategoryBudgetExceeded(user, dto.getCategoryId(), dto.getAmount(), date);

        Expense expense = expenseService.createExpense(dto, user);
        ExpenseDTO savedDto = convertToDTO(expense);

        Map<String, Object> response = new HashMap<>();
        response.put("expense", savedDto);
        response.put("budgetExceeded", budgetExceeded);
        if (budgetExceeded) {
            response.put("warningMessage", "Warning: This transaction exceeds your monthly budget limit for category " + expense.getCategory().getCategoryName() + "!");
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseDTO dto,
            HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");
        LocalDate date = LocalDate.parse(dto.getDate());

        // Exclude the current expense's old amount from the warning check
        Expense oldExpense = expenseService.getExpenseById(id, user);
        Double amountDiff = dto.getAmount() - oldExpense.getAmount();

        boolean budgetExceeded = false;
        if (amountDiff > 0) {
            budgetExceeded = expenseService.isCategoryBudgetExceeded(user, dto.getCategoryId(), amountDiff, date);
        }

        Expense expense = expenseService.updateExpense(id, dto, user);
        ExpenseDTO updatedDto = convertToDTO(expense);

        Map<String, Object> response = new HashMap<>();
        response.put("expense", updatedDto);
        response.put("budgetExceeded", budgetExceeded);
        if (budgetExceeded) {
            response.put("warningMessage", "Warning: This modification exceeds your monthly budget limit for category " + expense.getCategory().getCategoryName() + "!");
        }

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id, HttpServletRequest request) {
        User user = (User) request.getAttribute("currentUser");
        expenseService.deleteExpense(id, user);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Expense deleted successfully.");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ExpenseDTO>> searchExpenses(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search,
            HttpServletRequest request) {
        
        // Search endpoint delegates directly to the comprehensive getExpenses list with filters
        return getExpenses(page, size, sortBy, sortDir, categoryId, paymentMethod, startDate, endDate, search, request);
    }

    private ExpenseDTO convertToDTO(Expense expense) {
        return new ExpenseDTO(
                expense.getExpenseId(),
                expense.getAmount(),
                expense.getCategory().getCategoryId(),
                expense.getCategory().getCategoryName(),
                expense.getDescription(),
                expense.getDate().toString(),
                expense.getPaymentMethod()
        );
    }
}
