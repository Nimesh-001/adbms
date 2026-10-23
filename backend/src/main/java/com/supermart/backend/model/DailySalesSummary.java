package com.supermart.backend.model;

import java.math.BigDecimal;
import java.sql.Date;

public class DailySalesSummary {
    private Date salesDate;
    private Integer totalOrders;
    private BigDecimal grossSubtotal;
    private BigDecimal totalDiscountsGiven;
    private BigDecimal totalDeliveryCollected;
    private BigDecimal totalRevenue;

    public DailySalesSummary() {}

    public Date getSalesDate() { return salesDate; }
    public void setSalesDate(Date salesDate) { this.salesDate = salesDate; }

    public Integer getTotalOrders() { return totalOrders; }
    public void setTotalOrders(Integer totalOrders) { this.totalOrders = totalOrders; }

    public BigDecimal getGrossSubtotal() { return grossSubtotal; }
    public void setGrossSubtotal(BigDecimal grossSubtotal) { this.grossSubtotal = grossSubtotal; }

    public BigDecimal getTotalDiscountsGiven() { return totalDiscountsGiven; }
    public void setTotalDiscountsGiven(BigDecimal totalDiscountsGiven) { this.totalDiscountsGiven = totalDiscountsGiven; }

    public BigDecimal getTotalDeliveryCollected() { return totalDeliveryCollected; }
    public void setTotalDeliveryCollected(BigDecimal totalDeliveryCollected) { this.totalDeliveryCollected = totalDeliveryCollected; }

    public BigDecimal getTotalRevenue() { return totalRevenue; }
    public void setTotalRevenue(BigDecimal totalRevenue) { this.totalRevenue = totalRevenue; }
}
