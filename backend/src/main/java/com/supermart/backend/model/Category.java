package com.supermart.backend.model;

public class Category {
    private Integer categoryId;
    private String categoryName;
    private String description;
    private String imageUrl;
    private Boolean isActive;
    private Integer productCount;

    public Category() {}

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Integer getProductCount() { return productCount; }
    public void setProductCount(Integer productCount) { this.productCount = productCount; }
}
