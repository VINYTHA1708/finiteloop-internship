package com.finiteloop.expensetracker.repository;

import com.finiteloop.expensetracker.model.Category;
import com.finiteloop.expensetracker.model.Expense;
import com.finiteloop.expensetracker.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByUser(User user);

    List<Expense> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);

    @Query("SELECT e FROM Expense e WHERE e.user = :user AND " +
           "(:category IS NULL OR e.category = :category) AND " +
           "(:paymentMethod IS NULL OR e.paymentMethod = :paymentMethod) AND " +
           "(:startDate IS NULL OR e.date >= :startDate) AND " +
           "(:endDate IS NULL OR e.date <= :endDate) AND " +
           "(:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Expense> filterExpenses(
            @Param("user") User user,
            @Param("category") Category category,
            @Param("paymentMethod") String paymentMethod,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("SELECT e FROM Expense e WHERE e.user = :user AND " +
           "(:category IS NULL OR e.category = :category) AND " +
           "(:paymentMethod IS NULL OR e.paymentMethod = :paymentMethod) AND " +
           "(:startDate IS NULL OR e.date >= :startDate) AND " +
           "(:endDate IS NULL OR e.date <= :endDate) AND " +
           "(:search IS NULL OR LOWER(e.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Expense> filterExpensesList(
            @Param("user") User user,
            @Param("category") Category category,
            @Param("paymentMethod") String paymentMethod,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Sort sort
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.user = :user")
    Double getTotalSpentByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM Expense e WHERE e.user = :user AND e.date BETWEEN :start AND :end")
    Double getTotalSpentByUserInPeriod(@Param("user") User user, @Param("start") LocalDate start, @Param("end") LocalDate end);
}
