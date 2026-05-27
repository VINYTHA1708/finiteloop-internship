package com.finiteloop.expensetracker.service;

import com.finiteloop.expensetracker.dto.ExpenseDTO;
import com.finiteloop.expensetracker.model.Category;
import com.finiteloop.expensetracker.model.Expense;
import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.repository.CategoryRepository;
import com.finiteloop.expensetracker.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

@Service
public class ExpenseService {

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    public Page<Expense> getFilteredExpenses(User user, Long categoryId, String paymentMethod, 
                                             String startDate, String endDate, String search, Pageable pageable) {
        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId).orElse(null);
        }
        
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate) : null;
        String query = (search != null && !search.isBlank()) ? search.trim() : null;

        return expenseRepository.filterExpenses(user, category, paymentMethod, start, end, query, pageable);
    }

    public List<Expense> getFilteredExpensesList(User user, Long categoryId, String paymentMethod, 
                                                 String startDate, String endDate, String search, Sort sort) {
        Category category = null;
        if (categoryId != null) {
            category = categoryRepository.findById(categoryId).orElse(null);
        }
        
        LocalDate start = (startDate != null && !startDate.isBlank()) ? LocalDate.parse(startDate) : null;
        LocalDate end = (endDate != null && !endDate.isBlank()) ? LocalDate.parse(endDate) : null;
        String query = (search != null && !search.isBlank()) ? search.trim() : null;

        return expenseRepository.filterExpensesList(user, category, paymentMethod, start, end, query, sort);
    }

    public Expense getExpenseById(Long id, User user) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found with ID: " + id));
        if (!expense.getUser().getUserId().equals(user.getUserId())) {
            throw new SecurityException("Unauthorized: You do not own this expense record.");
        }
        return expense;
    }

    public Expense createExpense(ExpenseDTO dto, User user) {
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + dto.getCategoryId()));

        LocalDate date = LocalDate.parse(dto.getDate());
        Expense expense = new Expense(null, dto.getAmount(), dto.getDescription(), date, dto.getPaymentMethod(), user, category);
        
        return expenseRepository.save(expense);
    }

    public Expense updateExpense(Long id, ExpenseDTO dto, User user) {
        Expense expense = getExpenseById(id, user);
        Category category = categoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + dto.getCategoryId()));

        expense.setAmount(dto.getAmount());
        expense.setDescription(dto.getDescription());
        expense.setDate(LocalDate.parse(dto.getDate()));
        expense.setPaymentMethod(dto.getPaymentMethod());
        expense.setCategory(category);

        return expenseRepository.save(expense);
    }

    public void deleteExpense(Long id, User user) {
        Expense expense = getExpenseById(id, user);
        expenseRepository.delete(expense);
    }

    public boolean isCategoryBudgetExceeded(User user, Long categoryId, Double newAmount, LocalDate date) {
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null || category.getBudgetLimit() <= 0) {
            return false;
        }

        // Get start and end of the month for the given expense date
        LocalDate startOfMonth = date.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = date.with(TemporalAdjusters.lastDayOfMonth());

        // Find all expenses in this category for this month
        List<Expense> expenses = expenseRepository.filterExpensesList(user, category, null, startOfMonth, endOfMonth, null, Sort.unsorted());
        double totalSpentThisMonth = expenses.stream()
                .mapToDouble(Expense::getAmount)
                .sum();

        return (totalSpentThisMonth + newAmount) > category.getBudgetLimit();
    }
}
