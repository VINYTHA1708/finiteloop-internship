package com.finiteloop.expensetracker.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ExpenseDTO {

    private Long expenseId;

    @NotNull(message = "Amount is required")
    @Min(value = 1, message = "Amount must be greater than zero")
    private Double amount;

    @NotNull(message = "Category ID is required")
    private Long categoryId;

    private String categoryName;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Date is required")
    private String date; // Format: YYYY-MM-DD

    @NotBlank(message = "Payment method is required")
    private String paymentMethod;

    public ExpenseDTO() {}

    public ExpenseDTO(Long expenseId, Double amount, Long categoryId, String categoryName, String description, String date, String paymentMethod) {
        this.expenseId = expenseId;
        this.amount = amount;
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.description = description;
        this.date = date;
        this.paymentMethod = paymentMethod;
    }

    public Long getExpenseId() {
        return expenseId;
    }

    public void setExpenseId(Long expenseId) {
        this.expenseId = expenseId;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public Long getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(Long categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
