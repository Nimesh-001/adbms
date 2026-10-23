package com.supermart.backend.controller;

import com.supermart.backend.dao.AddressDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.model.CustomerAddress;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/addresses")
public class AddressController {

    private final AddressDao addressDao;

    public AddressController(AddressDao addressDao) {
        this.addressDao = addressDao;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<CustomerAddress>>> getUserAddresses(@PathVariable int userId) {
        return ResponseEntity.ok(ApiResponse.ok("Addresses loaded", addressDao.getAddressesByUserId(userId)));
    }

    /**
     * Add Address via Stored Procedure: sp_add_customer_address
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> addAddress(@RequestBody CustomerAddress address) {
        int addressId = addressDao.addAddress(address);
        Map<String, Object> data = new HashMap<>();
        data.put("addressId", addressId);
        return ResponseEntity.ok(ApiResponse.ok("Address added successfully", data));
    }
}
