package com.supermart.backend.dao;

import com.supermart.backend.model.CustomerAddress;
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

@Repository
public class AddressDao {

    private final JdbcTemplate jdbcTemplate;

    public AddressDao(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private final RowMapper<CustomerAddress> addressRowMapper = (rs, rowNum) -> {
        CustomerAddress a = new CustomerAddress();
        a.setAddressId(rs.getInt("address_id"));
        a.setUserId(rs.getInt("user_id"));
        a.setRecipientName(rs.getString("recipient_name"));
        a.setRecipientPhone(rs.getString("recipient_phone"));
        a.setAddressLine1(rs.getString("address_line1"));
        a.setAddressLine2(rs.getString("address_line2"));
        a.setCity(rs.getString("city"));
        a.setPostalCode(rs.getString("postal_code"));
        a.setIsDefault(rs.getBoolean("is_default"));
        return a;
    };

    public List<CustomerAddress> getAddressesByUserId(int userId) {
        String sql = "SELECT * FROM customer_addresses WHERE user_id = ? ORDER BY is_default DESC, address_id DESC";
        return jdbcTemplate.query(sql, addressRowMapper, userId);
    }

    /**
     * Add address using Stored Procedure: sp_add_customer_address
     */
    public int addAddress(CustomerAddress a) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE user_id = ?", Integer.class, a.getUserId());
        if (count == null || count == 0) {
            a.setUserId(3);
        }

        SimpleJdbcCall call = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_add_customer_address")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.INTEGER),
                        new SqlParameter("p_recipient_name", Types.VARCHAR),
                        new SqlParameter("p_recipient_phone", Types.VARCHAR),
                        new SqlParameter("p_address1", Types.VARCHAR),
                        new SqlParameter("p_address2", Types.VARCHAR),
                        new SqlParameter("p_city", Types.VARCHAR),
                        new SqlParameter("p_postal", Types.VARCHAR),
                        new SqlOutParameter("p_address_id", Types.INTEGER)
                );

        Map<String, Object> inParams = new HashMap<>();
        inParams.put("p_user_id", a.getUserId());
        inParams.put("p_recipient_name", a.getRecipientName());
        inParams.put("p_recipient_phone", a.getRecipientPhone());
        inParams.put("p_address1", a.getAddressLine1());
        inParams.put("p_address2", a.getAddressLine2());
        inParams.put("p_city", a.getCity());
        inParams.put("p_postal", a.getPostalCode());

        Map<String, Object> out = call.execute(inParams);
        return (Integer) out.get("p_address_id");
    }
}
