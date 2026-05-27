package com.finiteloop.expensetracker.service;

import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    // In-memory token store for session tracking
    private final Map<String, User> activeSessions = new ConcurrentHashMap<>();

    public User register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long.");
        }

        // Hash password using BCrypt
        String hashedPassword = BCrypt.hashpw(password, BCrypt.gensalt());
        User user = new User(null, name, email, hashedPassword);
        return userRepository.save(user);
    }

    public String login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        User user = userOpt.get();
        // Check password hash
        if (!BCrypt.checkpw(password, user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }

        // Generate dynamic session UUID token
        String token = UUID.randomUUID().toString();
        activeSessions.put(token, user);
        return token;
    }

    public void logout(String token) {
        if (token != null) {
            activeSessions.remove(token);
        }
    }

    public User getUserByToken(String token) {
        if (token == null) return null;
        return activeSessions.get(token);
    }
}
