package com.habittracker.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import com.habittracker.dto.LoginRequest;
import com.habittracker.model.User;
import com.habittracker.repository.UserRepository;

@Service

public class AuthService {

    private final UserRepository repo;

    public User register(
            User user
    ) {

        return repo.save(
                user
        );

    }

    public AuthService(
            UserRepository repo
    ) {
        this.repo = repo;
    }

    public User login(
            LoginRequest req
    ) {

        Optional<User> user
                = repo.findByEmail(
                        req.getEmail()
                );

        if (user.isPresent()
                && user.get()
                        .getPassword()
                        .equals(
                                req.getPassword()
                        )) {

            return user.get();

        }

        return null;

    }

}
