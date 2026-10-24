package com.supermart.backend.dao;

import com.supermart.backend.dto.CreateManagerRequest;
import com.supermart.backend.dto.RegisterRequest;
import com.supermart.backend.dto.UpdateProfileRequest;
import com.supermart.backend.model.User;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pure JDBC Data Access Object for Users
 * Strictly NO ORM - Uses raw SQL and MySQL Stored Procedures
 */
@Repository
public class UserDao {

    private final JdbcTemplate jdbcTemplate;

    public UserDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<User> userRowMapper = (rs, rowNum) -> {
        User u = new User();
        u.setUserId(rs.getInt("user_id"));
        u.setRoleId(rs.getInt("role_id"));
        u.setFirstName(rs.getString("first_name"));
        u.setLastName(rs.getString("last_name"));
        u.setEmail(rs.getString("email"));
        u.setMobilePhone(rs.getString("mobile_phone"));
        u.setUsername(rs.getString("username"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setNicNumber(rs.getString("nic_number"));
        u.setGender(rs.getString("gender"));
        u.setIsActive(rs.getBoolean("is_active"));
        u.setCreatedAt(rs.getTimestamp("created_at"));
        try {
            u.setRoleName(rs.getString("role_name"));
        } catch (Exception ignored) {}
        return u;
    };

    /**
     * Find user by username, email, or mobile phone (Allows flexible login)
     */
    public Optional<User> findByLoginIdentifier(String identifier) {
        String sql = """
            SELECT u.*, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = ? OR u.email = ? OR u.mobile_phone = ?
            LIMIT 1
        """;
        List<User> list = jdbcTemplate.query(sql, userRowMapper, identifier, identifier, identifier);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Optional<User> findById(int userId) {
        String sql = """
            SELECT u.*, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.user_id = ?
        """;
        List<User> list = jdbcTemplate.query(sql, userRowMapper, userId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    /**
     * Register Customer by invoking MySQL Stored Procedure: sp_register_customer
     */
    public Map<String, Object> registerCustomer(RegisterRequest req) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("supermart_db")
                .withoutProcedureColumnMetaDataAccess()
                .withProcedureName("sp_register_customer")
                .declareParameters(
                        new SqlParameter("p_first_name", Types.VARCHAR),
                        new SqlParameter("p_last_name", Types.VARCHAR),
                        new SqlParameter("p_email", Types.VARCHAR),
                        new SqlParameter("p_mobile", Types.VARCHAR),
                        new SqlParameter("p_password", Types.VARCHAR),
                        new SqlOutParameter("p_user_id", Types.INTEGER),
                        new SqlOutParameter("p_status_msg", Types.VARCHAR)
                );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_first_name", req.getFirstName());
        inParams.put("p_last_name", req.getLastName());
        inParams.put("p_email", req.getEmail());
        inParams.put("p_mobile", req.getMobilePhone());
        inParams.put("p_password", req.getPassword()); // Stored credential

        return call.execute(inParams);
    }

    /**
     * Super Admin creates Operational Manager via Stored Procedure: sp_create_operational_manager
     */
    public Map<String, Object> createOperationalManager(int adminId, CreateManagerRequest req) {
        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withCatalogName("supermart_db")
                .withoutProcedureColumnMetaDataAccess()
                .withProcedureName("sp_create_operational_manager")
                .declareParameters(
                        new SqlParameter("p_admin_id", Types.INTEGER),
                        new SqlParameter("p_first_name", Types.VARCHAR),
                        new SqlParameter("p_last_name", Types.VARCHAR),
                        new SqlParameter("p_email", Types.VARCHAR),
                        new SqlParameter("p_mobile", Types.VARCHAR),
                        new SqlParameter("p_nic", Types.VARCHAR),
                        new SqlParameter("p_gender", Types.VARCHAR),
                        new SqlParameter("p_password", Types.VARCHAR),
                        new SqlOutParameter("p_new_user_id", Types.INTEGER),
                        new SqlOutParameter("p_status_msg", Types.VARCHAR)
                );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_admin_id", adminId);
        inParams.put("p_first_name", req.getFirstName());
        inParams.put("p_last_name", req.getLastName());
        inParams.put("p_email", req.getEmail());
        inParams.put("p_mobile", req.getMobilePhone());
        inParams.put("p_nic", req.getNicNumber());
        inParams.put("p_gender", req.getGender());
        inParams.put("p_password", req.getPassword());

        return call.execute(inParams);
    }

    /**
     * Get all Operational Managers for Admin Dashboard
     */
    public List<User> findAllManagers() {
        String sql = """
            SELECT u.*, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.role_id = 2
            ORDER BY u.created_at DESC
        """;
        return jdbcTemplate.query(sql, userRowMapper);
    }

    /**
     * Update Profile with role-based restrictions
     * - Admin can change username and password
     * - Managers and Customers can change profile details and password, but NOT username
     */
    public int updateProfile(int userId, UpdateProfileRequest req, boolean isAdmin) {
        StringBuilder sql = new StringBuilder("UPDATE users SET first_name = ?, last_name = ?, email = ?, mobile_phone = ?");
        
        if (isAdmin && req.getUsername() != null && !req.getUsername().isBlank()) {
            sql.append(", username = '").append(req.getUsername().trim()).append("'");
        }
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            sql.append(", password_hash = '").append(req.getNewPassword().trim()).append("'");
        }
        sql.append(" WHERE user_id = ?");

        return jdbcTemplate.update(sql.toString(), req.getFirstName(), req.getLastName(), req.getEmail(), req.getMobilePhone(), userId);
    }

    public int toggleUserStatus(int userId, boolean isActive) {
        String sql = "UPDATE users SET is_active = ? WHERE user_id = ?";
        return jdbcTemplate.update(sql, isActive, userId);
    }
}
