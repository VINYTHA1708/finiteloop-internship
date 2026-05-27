package com.finiteloop.expensetracker;

import com.finiteloop.expensetracker.dto.CategoryDTO;
import com.finiteloop.expensetracker.dto.ExpenseDTO;
import com.finiteloop.expensetracker.model.Category;
import com.finiteloop.expensetracker.model.Expense;
import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.repository.CategoryRepository;
import com.finiteloop.expensetracker.repository.ExpenseRepository;
import com.finiteloop.expensetracker.repository.UserRepository;
import com.finiteloop.expensetracker.service.AuthService;
import com.finiteloop.expensetracker.service.CategoryService;
import com.finiteloop.expensetracker.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class ExpenseTrackerApplicationTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    @InjectMocks
    private AuthService authService;

    @InjectMocks
    private CategoryService categoryService;

    @InjectMocks
    private ExpenseService expenseService;

    private User sampleUser;
    private Category sampleCategory;
    private Expense sampleExpense;

    @BeforeEach
    void setUp() {
        sampleUser = new User(1L, "Test User", "test@example.com", "hashed_password");
        sampleCategory = new Category(1L, "Food", 5000.0);
        sampleExpense = new Expense(1L, 500.0, "Grocery", LocalDate.now(), "Cash", sampleUser, sampleCategory);
    }

    // --- Authentication Tests ---

    @Test
    void testRegisterUser_Success() {
        when(userRepository.existsByEmail("new@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(new User(2L, "New User", "new@example.com", "hashed"));

        User registered = authService.register("New User", "new@example.com", "securePassword123");
        assertNotNull(registered);
        assertEquals("New User", registered.getName());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterUser_DuplicateEmail() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            authService.register("Test User", "test@example.com", "securePassword123");
        });
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegisterUser_PasswordTooShort() {
        assertThrows(IllegalArgumentException.class, () -> {
            authService.register("Short Pass", "short@example.com", "12345");
        });
    }

    // --- Category Service Tests ---

    @Test
    void testCreateCategory_Success() {
        CategoryDTO dto = new CategoryDTO(null, "Travel", 2000.0);
        when(categoryRepository.existsByCategoryName("Travel")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(new Category(2L, "Travel", 2000.0));

        Category created = categoryService.createCategory(dto);
        assertNotNull(created);
        assertEquals("Travel", created.getCategoryName());
        verify(categoryRepository, times(1)).save(any(Category.class));
    }

    @Test
    void testCreateCategory_DuplicateName() {
        CategoryDTO dto = new CategoryDTO(null, "Food", 5000.0);
        when(categoryRepository.existsByCategoryName("Food")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> {
            categoryService.createCategory(dto);
        });
    }

    // --- Expense Service Tests ---

    @Test
    void testCreateExpense_Success() {
        ExpenseDTO dto = new ExpenseDTO(null, 350.0, 1L, "Food", "Lunch", LocalDate.now().toString(), "UPI");
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(expenseRepository.save(any(Expense.class))).thenReturn(new Expense(2L, 350.0, "Lunch", LocalDate.now(), "UPI", sampleUser, sampleCategory));

        Expense created = expenseService.createExpense(dto, sampleUser);
        assertNotNull(created);
        assertEquals(350.0, created.getAmount());
        assertEquals("Food", created.getCategory().getCategoryName());
        verify(expenseRepository, times(1)).save(any(Expense.class));
    }

    @Test
    void testGetExpenseById_Authorized() {
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(sampleExpense));

        Expense found = expenseService.getExpenseById(1L, sampleUser);
        assertNotNull(found);
        assertEquals(sampleExpense.getExpenseId(), found.getExpenseId());
    }

    @Test
    void testGetExpenseById_Unauthorized() {
        User otherUser = new User(99L, "Intruder", "intruder@example.com", "password");
        when(expenseRepository.findById(1L)).thenReturn(Optional.of(sampleExpense));

        assertThrows(SecurityException.class, () -> {
            expenseService.getExpenseById(1L, otherUser);
        });
    }

    // --- Budget Warning Alert Tests ---

    @Test
    void testIsCategoryBudgetExceeded_Safe() {
        // Budget limit is 5000. New expense is 1500. Total is 1500 (safe).
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        when(expenseRepository.filterExpensesList(any(), any(), any(), any(), any(), any(), any())).thenReturn(Collections.emptyList());

        boolean exceeded = expenseService.isCategoryBudgetExceeded(sampleUser, 1L, 1500.0, LocalDate.now());
        assertFalse(exceeded);
    }

    @Test
    void testIsCategoryBudgetExceeded_Breach() {
        // Budget limit is 5000. Existing spent this month is 4800. New expense is 300. Total is 5100 (breach!).
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
        
        Expense oldExpense = new Expense(9L, 4800.0, "Old Rent", LocalDate.now(), "Card", sampleUser, sampleCategory);
        when(expenseRepository.filterExpensesList(any(), any(), any(), any(), any(), any(), any())).thenReturn(List.of(oldExpense));

        boolean exceeded = expenseService.isCategoryBudgetExceeded(sampleUser, 1L, 300.0, LocalDate.now());
        assertTrue(exceeded);
    }
}
