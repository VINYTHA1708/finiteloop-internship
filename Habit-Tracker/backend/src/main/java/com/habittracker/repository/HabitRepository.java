package com.habittracker.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.habittracker.model.Habit;

public interface HabitRepository
        extends JpaRepository<Habit, Integer> {

    List<Habit>
            findByUserUserId(
                    Integer userId
            );

}
