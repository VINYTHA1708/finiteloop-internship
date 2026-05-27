package com.finiteloop.expensetracker.controller;

import com.finiteloop.expensetracker.dto.AuthResponse;
import com.finiteloop.expensetracker.dto.LoginRequest;
import com.finiteloop.expensetracker.dto.RegisterRequest;
import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match.");
        }

        User user = authService.register(req.getName(), req.getEmail(), req.getPassword());
        
        // Auto-login after registration by generating token
        String token = authService.login(req.getEmail(), req.getPassword());
        
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        String token = authService.login(req.getEmail(), req.getPassword());
        User user = authService.getUserByToken(token);
        
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            authService.logout(token);
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully.");
        return ResponseEntity.ok(response);
    }
}
