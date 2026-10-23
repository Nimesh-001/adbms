package com.supermart.backend.controller;

import com.supermart.backend.dao.AnalyticsDao;
import com.supermart.backend.dao.UserDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.LoginRequest;
import com.supermart.backend.dto.RegisterRequest;
import com.supermart.backend.dto.UpdateProfileRequest;
import com.supermart.backend.model.User;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserDao userDao;
    private final AnalyticsDao analyticsDao;

    public AuthController(UserDao userDao, AnalyticsDao analyticsDao) {
        this.userDao = userDao;
        this.analyticsDao = analyticsDao;
    }

    /**
     * Customer Self-Registration
     * Enforces validation: min 8 char password, 10 digit phone, valid email
     * Invokes Stored Procedure sp_register_customer
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(@Valid @RequestBody RegisterRequest req) {
        Map<String, Object> result = userDao.registerCustomer(req);
        Integer userId = (Integer) result.get("p_user_id");
        String message = (String) result.get("p_status_msg");

        if (userId != null && userId > 0) {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", userId);
            data.put("email", req.getEmail());
            data.put("role", "ROLE_CUSTOMER");
            return ResponseEntity.ok(ApiResponse.ok(message, data));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error(message));
        }
    }

    /**
     * Unified Login for Customer, Operational Manager, and Super Admin
     * Customer can enter either Email OR Mobile Phone as username.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(@Valid @RequestBody LoginRequest req) {
        Optional<User> userOpt = userDao.findByLoginIdentifier(req.getUsername().trim());

        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid username/email/mobile or user not found"));
        }

        User user = userOpt.get();

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Account is deactivated. Please contact support."));
        }

        // Validate password
        if (!user.getPasswordHash().equals(req.getPassword())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Incorrect password"));
        }

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("userId", user.getUserId());
        responseData.put("roleId", user.getRoleId());
        responseData.put("roleName", user.getRoleName());
        responseData.put("firstName", user.getFirstName());
        responseData.put("lastName", user.getLastName());
        responseData.put("email", user.getEmail());
        responseData.put("mobilePhone", user.getMobilePhone());
        responseData.put("username", user.getUsername());

        return ResponseEntity.ok(ApiResponse.ok("Login successful", responseData));
    }

    /**
     * Get user profile details
     */
    @GetMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@PathVariable int userId) {
        Optional<User> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User u = userOpt.get();
        Map<String, Object> data = new HashMap<>();
        data.put("userId", u.getUserId());
        data.put("roleId", u.getRoleId());
        data.put("roleName", u.getRoleName());
        data.put("firstName", u.getFirstName());
        data.put("lastName", u.getLastName());
        data.put("email", u.getEmail());
        data.put("mobilePhone", u.getMobilePhone());
        data.put("username", u.getUsername());
        data.put("nicNumber", u.getNicNumber());
        data.put("gender", u.getGender());
        data.put("createdAt", u.getCreatedAt());

        // If customer, fetch lifetime spending from Stored Function: fn_customer_lifetime_spending
        if (u.getRoleId() == 3) {
            BigDecimal lifetime = analyticsDao.getCustomerLifetimeSpending(userId);
            data.put("lifetimeSpending", lifetime);
        }

        return ResponseEntity.ok(ApiResponse.ok("Profile loaded", data));
    }

    /**
     * Update Profile
     */
    @PutMapping("/profile/{userId}")
    public ResponseEntity<ApiResponse<String>> updateProfile(@PathVariable int userId, @RequestBody UpdateProfileRequest req) {
        Optional<User> userOpt = userDao.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User u = userOpt.get();
        boolean isAdmin = (u.getRoleId() == 1);

        userDao.updateProfile(userId, req, isAdmin);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully"));
    }
}
