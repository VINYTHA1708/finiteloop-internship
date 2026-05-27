package com.habittracker.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class Habit {

    @Id
    @GeneratedValue(
            strategy
            = GenerationType.IDENTITY
    )
    private Integer habitId;

    private String habitName;

    private String category;

    private Integer targetDays;

    private Boolean completedToday;

    private Integer currentStreak;

    private LocalDate completedDate;

    @ManyToOne(
            fetch
            = FetchType.EAGER
    )

    @JoinColumn(
            name = "user_id"
    )

    @JsonIgnoreProperties({
        "password"
    })

    private User user;


    /* GETTERS */
    public Integer getHabitId() {
        return habitId;
    }

    public String getHabitName() {
        return habitName;
    }

    public String getCategory() {
        return category;
    }

    public Integer getTargetDays() {
        return targetDays;
    }

    public Boolean getCompletedToday() {
        return completedToday;
    }

    public Integer getCurrentStreak() {
        return currentStreak;
    }

    public User getUser() {
        return user;
    }


    /* SETTERS */
    public void setHabitId(Integer habitId) {
        this.habitId = habitId;
    }

    public void setHabitName(String habitName) {
        this.habitName = habitName;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setTargetDays(Integer targetDays) {
        this.targetDays = targetDays;
    }

    public void setCompletedToday(Boolean completedToday) {
        this.completedToday = completedToday;
    }

    public void setCurrentStreak(Integer currentStreak) {
        this.currentStreak = currentStreak;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public LocalDate getCompletedDate() {
        return completedDate;
    }

    public void setCompletedDate(
            LocalDate completedDate
    ) {
        this.completedDate
                = completedDate;
    }

}
