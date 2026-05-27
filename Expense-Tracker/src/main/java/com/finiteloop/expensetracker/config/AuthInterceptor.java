package com.finiteloop.expensetracker.config;

import com.finiteloop.expensetracker.model.User;
import com.finiteloop.expensetracker.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Autowired
    private AuthService authService;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        // Pass CORS preflight requests
        if (request.getMethod().equalsIgnoreCase("OPTIONS")) {
            return true;
        }

        String path = request.getRequestURI();
        
        // Exclude authentication endpoints, error pages, and static frontend assets
        if (path.startsWith("/api/auth/register") || 
            path.startsWith("/api/auth/login") || 
            path.equals("/error") || 
            !path.startsWith("/api/")) {
            return true;
        }

        // Get Authorization header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            User user = authService.getUserByToken(token);
            if (user != null) {
                // Attach the current user to the request context
                request.setAttribute("currentUser", user);
                return true;
            }
        }

        // Return SC_UNAUTHORIZED (401)
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\": \"Unauthorized: Please login to access this resource.\"}");
        return false;
    }
}
