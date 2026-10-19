package com.supermart.backend.controller;

import com.supermart.backend.dao.OrderDao;
import com.supermart.backend.dto.ApiResponse;
import com.supermart.backend.dto.CheckoutRequest;
import com.supermart.backend.model.Order;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderDao orderDao;

    public OrderController(OrderDao orderDao) {
        this.orderDao = orderDao;
    }

    /**
     * ACID Transactional Order Placement:
     * Executes sp_place_order_transaction and inserts line items (firing stock deduction trigger).
     */
    @PostMapping("/checkout")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkout(@RequestBody CheckoutRequest req) {
        try {
            Map<String, Object> result = orderDao.placeOrder(req);
            Integer orderId = (Integer) result.get("p_order_id");
            String message = (String) result.get("p_status_msg");

            if (orderId != null && orderId > 0) {
                return ResponseEntity.ok(ApiResponse.ok(message, result));
            } else {
                return ResponseEntity.badRequest().body(ApiResponse.error(message));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Checkout failed: " + e.getMessage()));
        }
    }

    /**
     * Customer order history from View: v_customer_order_history
     */
    @GetMapping("/customer/{userId}")
    public ResponseEntity<ApiResponse<List<Order>>> getCustomerOrders(@PathVariable int userId) {
        return ResponseEntity.ok(ApiResponse.ok("Customer orders loaded", orderDao.getOrdersByUserId(userId)));
    }

    /**
     * All orders for Operational Manager & Admin
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getAllOrders() {
        return ResponseEntity.ok(ApiResponse.ok("All orders loaded", orderDao.getAllOrders()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderDetails(@PathVariable int id) {
        return orderDao.getOrderById(id)
                .map(order -> ResponseEntity.ok(ApiResponse.ok("Order details loaded", order)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Update order fulfillment status (Fires trg_after_order_status_update_audit trigger)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateStatus(
            @PathVariable int id, 
            @RequestParam String status) {
        orderDao.updateOrderStatus(id, status.toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok("Order status updated to " + status));
    }
}
