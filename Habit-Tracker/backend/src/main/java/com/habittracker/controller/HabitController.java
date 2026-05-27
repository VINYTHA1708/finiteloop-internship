package com.habittracker.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habittracker.dto.HabitRequest;
import com.habittracker.model.Habit;
import com.habittracker.model.User;
import com.habittracker.repository.HabitRepository;
import com.habittracker.repository.UserRepository;

@RestController
@RequestMapping("/api/habits")
@CrossOrigin("*")

public class HabitController {

    private final HabitRepository repo;
    private final UserRepository userRepo;

    public HabitController(
            HabitRepository repo,
            UserRepository userRepo
    ) {
        this.repo = repo;
        this.userRepo = userRepo;
    }

    @GetMapping
    public List<Habit> getAll() {
        return repo.findAll();
    }

    @GetMapping("/dashboard/{userId}")
    public Map<String, Object> dashboard(
            @PathVariable Integer userId
    ) {

        List<Habit> habits
                = repo.findByUserUserId(
                        userId
                );

        int total
                = habits.size();

        int completed
                = (int) habits.stream()
                        .filter(
                                Habit::getCompletedToday
                        )
                        .count();

        int streak
                = habits.stream()
                        .mapToInt(
                                Habit::getCurrentStreak
                        )
                        .max()
                        .orElse(0);

        Map<String, Object> data
                = new HashMap<>();

        data.put(
                "totalHabits",
                total
        );

        data.put(
                "completedToday",
                completed
        );

        data.put(
                "currentStreak",
                streak
        );

        return data;

    }

    @PostMapping
    public Habit add(
            @RequestBody HabitRequest request
    ) {

        User user = userRepo
                .findById(request.getUserId())
                .orElseThrow();

        Habit habit = new Habit();

        habit.setHabitName(request.getHabitName());
        habit.setCategory(request.getCategory());
        habit.setTargetDays(request.getTargetDays());
        habit.setCompletedToday(request.getCompletedToday());
        habit.setCurrentStreak(request.getCurrentStreak());

        habit.setUser(user);

        return repo.save(habit);
    }

    @GetMapping("/{id}")
    public Habit getById(
            @PathVariable Integer id
    ) {

        return repo.findById(id)
                .orElse(null);

    }

    @PutMapping("/{id}")
    public Habit update(
            @PathVariable Integer id,
            @RequestBody Habit incoming
    ) {

        Habit existing
                = repo
                        .findById(id)
                        .orElseThrow();

        existing.setHabitName(
                incoming.getHabitName()
        );

        existing.setCategory(
                incoming.getCategory()
        );

        existing.setTargetDays(
                incoming.getTargetDays()
        );

        existing.setCompletedToday(
                incoming.getCompletedToday()
        );

        existing.setCurrentStreak(
                incoming.getCurrentStreak()
        );

        existing.setCompletedDate(
                incoming.getCompletedDate()
        );

        if (incoming.getUser() != null) {

            existing.setUser(
                    incoming.getUser()
            );

        }

        return repo.save(
                existing
        );

    }

    @DeleteMapping("/{id}")
    public String delete(
            @PathVariable Integer id
    ) {

        repo.deleteById(id);

        return "Habit Deleted";

    }
}
