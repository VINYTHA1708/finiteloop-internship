package com.habittracker.dto;

public class HabitRequest {

    private Integer userId;

    private String habitName;

    private String category;

    private Integer targetDays;

    private Boolean completedToday;

    private Integer currentStreak;

    public Integer getUserId() {
        return userId;
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

    public void setUserId(Integer userId) {
        this.userId = userId;
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
}
