package com.finiteloop.expensetracker.service;

import com.finiteloop.expensetracker.dto.CategoryDTO;
import com.finiteloop.expensetracker.model.Category;
import com.finiteloop.expensetracker.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + id));
    }

    public Category createCategory(CategoryDTO dto) {
        if (categoryRepository.existsByCategoryName(dto.getCategoryName())) {
            throw new IllegalArgumentException("Category with name '" + dto.getCategoryName() + "' already exists.");
        }
        Category category = new Category(null, dto.getCategoryName(), dto.getBudgetLimit());
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryDTO dto) {
        Category category = getCategoryById(id);
        
        // If changing name, verify uniqueness
        if (!category.getCategoryName().equalsIgnoreCase(dto.getCategoryName())) {
            if (categoryRepository.existsByCategoryName(dto.getCategoryName())) {
                throw new IllegalArgumentException("Category with name '" + dto.getCategoryName() + "' already exists.");
            }
        }
        
        category.setCategoryName(dto.getCategoryName());
        category.setBudgetLimit(dto.getBudgetLimit());
        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        Category category = getCategoryById(id);
        categoryRepository.delete(category);
    }
}
