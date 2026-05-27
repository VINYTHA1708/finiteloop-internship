package com.habittracker.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.habittracker.dto.LoginRequest;
import com.habittracker.model.User;
import com.habittracker.service.AuthService;

@RestController

@RequestMapping(
        "/api/auth"
)

@CrossOrigin("*")

public class AuthController {

    private final AuthService service;

    public AuthController(
            AuthService service
    ) {
        this.service = service;
    }

    @PostMapping(
            "/register"
    )

    public User register(
            @RequestBody User user
    ) {

        return service
                .register(user);

    }

    @PostMapping("/login")
    public User login(
            @RequestBody LoginRequest req
    ) {

        return service.login(req);

    }

}
