package com.habittracker.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habittracker.model.User;
import com.habittracker.repository.UserRepository;

@RestController

@RequestMapping("/api/users")

@CrossOrigin("*")

public class UserController {

    private final UserRepository repo;

    public UserController(
            UserRepository repo
    ) {
        this.repo = repo;
    }

    @GetMapping
    public List<User> getAll() {

        return repo.findAll();

    }

    @GetMapping("/{id}")
    public User getById(
            @PathVariable Integer id
    ) {

        return repo.findById(id)
                .orElse(null);

    }

    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Integer id
    ) {

        repo.deleteById(id);

    }

}
