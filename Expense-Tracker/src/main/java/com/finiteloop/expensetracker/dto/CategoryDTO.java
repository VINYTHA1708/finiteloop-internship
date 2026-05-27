package com.finiteloop.expensetracker.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CategoryDTO {

    private Long categoryId;

    @NotBlank(message = "Category name is required")
    private String categoryName;

    @NotNull(message = "Budget limit is required")
    @Min(value = 0, message = "Budget limit must be non-negative")
    private Double budgetLimit;

    public CategoryDTO() {}

    public CategoryDTO(Long categoryId, String categoryName, Double budgetLimit) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.budgetLimit = budgetLimit;
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

    public Double getBudgetLimit() {
        return budgetLimit;
    }

    public void setBudgetLimit(Double budgetLimit) {
        this.budgetLimit = budgetLimit;
    }
}
