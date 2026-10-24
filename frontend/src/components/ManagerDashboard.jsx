import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Tag, Clock, Plus, RefreshCw, CheckCircle, Edit2, Layers, Search, Award, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

export default function ManagerDashboard({ user, onOpenProfile, onRefreshCatalog }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'alerts', 'categories', 'brands', 'coupons', 'orders'

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search filters
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [brandSearch, setBrandSearch] = useState('');

  // Category management modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');
  const [categoryImage, setCategoryImage] = useState('');

  // Brand management modal state
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandName, setBrandName] = useState('');
  const [brandDesc, setBrandDesc] = useState('');

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restockMsg, setRestockMsg] = useState('');

  // Add Product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductBrandId, setNewProductBrandId] = useState('');
  const [newProductUnitType, setNewProductUnitType] = useState('100g');
  const [newProductBasePrice, setNewProductBasePrice] = useState('75.00');
  const [newProductUnitPrice, setNewProductUnitPrice] = useState('100.00');
  const [newProductStock, setNewProductStock] = useState(100);
  const [newProductMinStock, setNewProductMinStock] = useState(15);
  const [newProductImage, setNewProductImage] = useState('');

  // Create / Edit Coupon modal state
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('3000');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponFreeDel, setNewCouponFreeDel] = useState(true);

  // Edit Price modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editBasePrice, setEditBasePrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes, alertRes, couponRes, orderRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(true),
        api.getBrands(true),
        api.getLowStockAlerts(),
        api.getAllCoupons(),
        api.getAllOrders(),
      ]);

      const loadedCats = catRes.data || [];
      const loadedBrands = brandRes.data || [];

      setProducts(prodRes.data || []);
      setCategories(loadedCats);
      setBrands(loadedBrands);
      setLowStockAlerts(alertRes.data || []);
      setCoupons(couponRes.data || []);
      setOrders(orderRes.data || []);

      if (loadedCats.length > 0 && !newProductCategoryId) {
        setNewProductCategoryId(loadedCats[0].categoryId);
      }
      if (loadedBrands.length > 0 && !newProductBrandId) {
        setNewProductBrandId(loadedBrands[0].brandId);
      }
      onRefreshCatalog?.();
    } catch (err) {
      setError(err.message || 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync category and brand defaults for Add Product
  useEffect(() => {
    if (categories.length > 0 && (!newProductCategoryId || !categories.some(c => c.categoryId === Number(newProductCategoryId)))) {
      setNewProductCategoryId(categories[0].categoryId);
    }
  }, [categories, newProductCategoryId]);

  useEffect(() => {
    if (brands.length > 0 && (!newProductBrandId || !brands.some(b => b.brandId === Number(newProductBrandId)))) {
      setNewProductBrandId(brands[0].brandId);
    }
  }, [brands, newProductBrandId]);

  // Handle Category Submit (Add / Edit)
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoryName: categoryName.trim(),
        description: categoryDesc.trim(),
        imageUrl: categoryImage.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
        isActive: true,
      };

      if (editingCategory) {
        await api.updateCategory(editingCategory.categoryId, payload);
      } else {
        await api.addCategory(payload);
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryName('');
      setCategoryDesc('');
      setCategoryImage('');
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleToggleCategory = async (cat) => {
    const nextActive = !cat.isActive;
    const actionText = nextActive ? 'enable (show)' : 'hide';
    if (!window.confirm(`Are you sure you want to ${actionText} category "${cat.categoryName}" on the store?`)) return;
    try {
      await api.toggleCategory(cat.categoryId, nextActive);
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || `Failed to ${actionText} category`);
    }
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDesc('');
    setCategoryImage('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.categoryName || '');
    setCategoryDesc(cat.description || '');
    setCategoryImage(cat.imageUrl || '');
    setShowCategoryModal(true);
  };

  // Handle Brand Submit (Add / Edit)
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        brandName: brandName.trim(),
        description: brandDesc.trim(),
        logoUrl: editingBrand?.logoUrl || null,
      };

      if (editingBrand) {
        await api.updateBrand(editingBrand.brandId, payload);
      } else {
        await api.addBrand(payload);
      }

      setShowBrandModal(false);
      setEditingBrand(null);
      setBrandName('');
      setBrandDesc('');
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || 'Failed to save brand');
    }
  };

  const handleToggleBrand = async (brand) => {
    const nextActive = !brand.isActive;
    const actionText = nextActive ? 'enable (show)' : 'hide';
    if (!window.confirm(`Are you sure you want to ${actionText} brand "${brand.brandName}" on the store?`)) return;
    try {
      await api.toggleBrand(brand.brandId, nextActive);
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || `Failed to ${actionText} brand`);
    }
  };

  const openAddBrand = () => {
    setEditingBrand(null);
    setBrandName('');
    setBrandDesc('');
    setShowBrandModal(true);
  };

  const openEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandName(brand.brandName || '');
    setBrandDesc(brand.description || '');
    setShowBrandModal(true);
  };

  // Handle Restock via Stored Procedure: sp_restock_product
  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!restockProduct || restockQty <= 0) return;
    try {
      const res = await api.restockProduct(user.userId, restockProduct.productId, Number(restockQty));
      setRestockMsg(res.data.p_msg || 'Restocked successfully');
      setTimeout(() => {
        setRestockProduct(null);
        setRestockMsg('');
      }, 1200);
      loadData();
    } catch (err) {
      alert(err.message || 'Restock failed');
    }
  };

  // Handle Add Product
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        categoryId: Number(newProductCategoryId),
        brandId: Number(newProductBrandId),
        productName: newProductName,
        description: newProductDesc,
        unitType: newProductUnitType,
        basePrice: Number(newProductBasePrice) || 0,
        unitPrice: Number(newProductUnitPrice),
        currentStock: Number(newProductStock),
        minStockLevel: Number(newProductMinStock),
        imageUrl: newProductImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
        isFeatured: false,
      };
      await api.addProduct(payload);
      setShowAddProductModal(false);
      // Reset form
      setNewProductName('');
      setNewProductDesc('');
      setNewProductBasePrice('75.00');
      setNewProductUnitPrice('100.00');
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || 'Failed to add product');
    }
  };

  // Handle Edit Price (Triggers price audit in database)
  const handleEditPriceSubmit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const payload = {
        ...editingProduct,
        basePrice: Number(editBasePrice) || 0,
        unitPrice: Number(editPrice),
        minStockLevel: editingProduct.minStockLevel || 10,
        isActive: true,
      };
      await api.updateProduct(editingProduct.productId, payload);
      setEditingProduct(null);
      await loadData();
      onRefreshCatalog?.();
    } catch (err) {
      alert(err.message || 'Failed to update price');
    }
  };

  const openCreateCoupon = () => {
    setEditingCoupon(null);
    setNewCouponCode('');
    setNewCouponDesc('');
    setNewCouponMinOrder('3000');
    setNewCouponDiscount('10');
    setNewCouponFreeDel(true);
    setShowCreateCouponModal(true);
  };

  const openEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setNewCouponCode(coupon.couponCode || '');
    setNewCouponDesc(coupon.description || '');
    setNewCouponMinOrder(String(coupon.minOrderAmount || 0));
    setNewCouponDiscount(String(coupon.discountPercentage || 0));
    setNewCouponFreeDel(Boolean(coupon.freeDelivery));
    setShowCreateCouponModal(true);
  };

  // Handle Create or Edit Coupon
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      const now = new Date();
      const nextYear = new Date();
      nextYear.setFullYear(now.getFullYear() + 2);

      const payload = {
        couponCode: newCouponCode.trim().toUpperCase(),
        description: newCouponDesc,
        minOrderAmount: Number(newCouponMinOrder),
        discountPercentage: Number(newCouponDiscount),
        freeDelivery: newCouponFreeDel,
        validFrom: editingCoupon?.validFrom || now.toISOString(),
        validUntil: editingCoupon?.validUntil || nextYear.toISOString(),
      };

      if (editingCoupon) {
        await api.updateCoupon(editingCoupon.couponId, payload);
      } else {
        await api.createCoupon(payload);
      }

      setShowCreateCouponModal(false);
      setEditingCoupon(null);
      setNewCouponCode('');
      setNewCouponDesc('');
      loadData();
    } catch (err) {
      alert(err.message || (editingCoupon ? 'Failed to update coupon' : 'Failed to create coupon'));
    }
  };

  // Handle Toggle Coupon Active / Inactive
  const handleToggleCoupon = async (coupon) => {
    const nextActive = !coupon.isActive;
    const actionText = nextActive ? 'enable (activate)' : 'disable (deactivate)';
    if (!window.confirm(`Are you sure you want to ${actionText} coupon "${coupon.couponCode}"?`)) return;
    try {
      await api.toggleCoupon(coupon.couponId, nextActive);
      await loadData();
    } catch (err) {
      alert(err.message || `Failed to ${actionText} coupon`);
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brandName.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.categoryName.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      
      {/* Top Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-emerald-800 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
            Operations Management Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            Welcome, {user.firstName} {user.lastName}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Assigned Username: <span className="font-mono font-bold text-white">{user.username}</span> (Mobile Phone) • Role: Operational Manager
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center space-x-1.5 text-xs font-bold"
            title="Refresh Database Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Product Inventory & Restock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'alerts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Low Stock Alerts ({lowStockAlerts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Product Categories ({categories.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('brands')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'brands'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Product Brands ({brands.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'coupons'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Coupons & Promotions ({coupons.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Customer Orders ({orders.length})</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: PRODUCT INVENTORY & RESTOCK                                  */}
      {/* =================================================================== */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search products by name or brand..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5 self-end sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Grocery Item</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Item</th>
                    <th className="py-3.5 px-4">Category & Brand</th>
                    <th className="py-3.5 px-4">Unit Pricing</th>
                    <th className="py-3.5 px-4">Current Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredProducts.map((p) => {
                    const isLow = p.currentStock <= p.minStockLevel;
                    return (
                      <tr key={p.productId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover shrink-0"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block truncate max-w-xs">{p.productName}</span>
                              <span className="text-[10px] text-slate-400">ID #{p.productId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block">{p.categoryName}</span>
                          <span className="text-[10px] text-slate-500">{p.brandName}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-extrabold text-slate-900">Rs. {Number(p.unitPrice).toFixed(2)}</span>
                              <span className="text-[10px] text-slate-400">/{p.unitType}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center space-x-1">
                              <span>Cost: <strong className="text-slate-700">Rs. {Number(p.basePrice || 0).toFixed(2)}</strong></span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                +{(((Number(p.unitPrice) - Number(p.basePrice || 0)) / (Number(p.unitPrice) || 1)) * 100).toFixed(0)}% margin
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-mono font-bold ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                            {p.currentStock} units
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {p.currentStock > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              In Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                              Out of Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setEditPrice(p.unitPrice);
                                setEditBasePrice(p.basePrice || '');
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition cursor-pointer"
                            >
                              Edit Price & Cost
                            </button>
                            <button
                              onClick={() => setRestockProduct(p)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition shadow-xs cursor-pointer"
                            >
                              Restock
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: LOW STOCK ALERTS (FROM VIEW: v_low_stock_alerts)              */}
      {/* =================================================================== */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              These items are currently running below their minimum stock threshold. Use the Restock button to replenish inventory.
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category & Brand</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Min Level</th>
                  <th className="py-3.5 px-4">Units Needed</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lowStockAlerts.map((alertItem, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{alertItem.product_name}</td>
                    <td className="py-3.5 px-4">{alertItem.category_name} ({alertItem.brand_name})</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-red-600">{alertItem.current_stock}</td>
                    <td className="py-3.5 px-4 font-mono">{alertItem.min_stock_level}</td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-amber-700">+{alertItem.units_needed}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          const matched = products.find(p => p.productId === alertItem.product_id);
                          if (matched) setRestockProduct(matched);
                        }}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
                      >
                        Restock Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: PRODUCT CATEGORIES MANAGEMENT                                  */}
      {/* =================================================================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={openAddCategory}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Category Details</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Linked Products</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categories
                    .filter(c =>
                      c.categoryName.toLowerCase().includes(categorySearch.toLowerCase()) ||
                      (c.description && c.description.toLowerCase().includes(categorySearch.toLowerCase()))
                    )
                    .map((cat) => (
                      <tr key={cat.categoryId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={cat.imageUrl || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                              alt={cat.categoryName}
                              className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{cat.categoryName}</span>
                              <span className="text-[10px] text-slate-400">ID #{cat.categoryId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                          {cat.description || <span className="text-slate-400 italic">No description</span>}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                            {cat.productCount !== undefined ? cat.productCount : products.filter(p => p.categoryId === cat.categoryId).length} items
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {cat.isActive !== false ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditCategory(cat)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {cat.isActive !== false ? (
                              <button
                                onClick={() => handleToggleCategory(cat)}
                                className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                                title="Hide this category from homepage"
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>Hide</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleCategory(cat)}
                                className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                                title="Enable this category on homepage"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Enable</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB: PRODUCT BRANDS MANAGEMENT                                      */}
      {/* =================================================================== */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search brands..."
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={openAddBrand}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5 self-end sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Brand</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Brand</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Linked Products</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {brands
                    .filter(b =>
                      b.brandName.toLowerCase().includes(brandSearch.toLowerCase()) ||
                      (b.description && b.description.toLowerCase().includes(brandSearch.toLowerCase()))
                    )
                    .map((br) => (
                      <tr key={br.brandId} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-extrabold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {br.brandName.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{br.brandName}</span>
                              <span className="text-[10px] text-slate-400">ID #{br.brandId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate">
                          {br.description || <span className="text-slate-400 italic">No description</span>}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                            {br.productCount !== undefined ? br.productCount : products.filter(p => p.brandId === br.brandId).length} items
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {br.isActive !== false ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Hidden
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditBrand(br)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                            {br.isActive !== false ? (
                              <button
                                onClick={() => handleToggleBrand(br)}
                                className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                                title="Hide this brand from homepage"
                              >
                                <EyeOff className="w-3 h-3" />
                                <span>Hide</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleBrand(br)}
                                className="px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold text-[11px] transition flex items-center space-x-1 cursor-pointer"
                                title="Enable this brand on homepage"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Enable</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: COUPONS & PROMOTIONS                                         */}
      {/* =================================================================== */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">System Promotional Coupons</h3>
            <button
              onClick={openCreateCoupon}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Coupon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((c) => (
              <div key={c.couponId} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                    {c.couponCode}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'}`}>
                    {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-medium">{c.description}</p>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>Min Order: <span className="font-bold text-slate-900">Rs. {c.minOrderAmount}</span></div>
                  <div>Discount: <span className="font-bold text-slate-900">{c.discountPercentage}%</span></div>
                  <div>Free Delivery: <span className="font-bold text-slate-900">{c.freeDelivery ? 'YES' : 'NO'}</span></div>
                </div>

                {/* Coupon Actions: Edit and Enable / Disable */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => openEditCoupon(c)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit</span>
                  </button>

                  {c.isActive ? (
                    <button
                      onClick={() => handleToggleCoupon(c)}
                      className="px-3 py-1.5 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Disable this coupon"
                    >
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Disable</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleCoupon(c)}
                      className="px-3 py-1.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-bold text-xs transition flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                      title="Enable this coupon"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Enable</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: CUSTOMER ORDERS MANAGEMENT                                   */}
      {/* =================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Customer Orders & Fulfillment</h3>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Order #</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Total Amount</th>
                    <th className="py-3.5 px-4">Payment</th>
                    <th className="py-3.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.map((o) => (
                    <tr key={o.orderId} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{o.customerName}</span>
                        <span className="text-[10px] text-slate-400">{o.mobilePhone}</span>
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-slate-900">
                        Rs. {Number(o.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-emerald-700 block">{o.paymentMethod}</span>
                        <span className="text-[10px] text-slate-400">{o.paymentStatus}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: RESTOCK PRODUCT VIA STORED PROCEDURE                       */}
      {/* =================================================================== */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Restock Product: {restockProduct.productName}
            </h3>
            <p className="text-xs text-slate-500">
              Current Stock: <span className="font-bold text-slate-900">{restockProduct.currentStock}</span> units.
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Additional Units to Restock:
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {restockMsg && (
                <p className="text-xs font-bold text-emerald-700 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-emerald-600" />
                  {restockMsg}
                </p>
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Execute Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: EDIT PRODUCT PRICE (FIRES PRICE AUDIT TRIGGER)             */}
      {/* =================================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Update Price & Wholesale Cost: {editingProduct.productName}
            </h3>
            <p className="text-xs text-slate-500">
              Setting the base cost and unit selling price ensures system-wide profit analytics remain accurate.
            </p>

            <form onSubmit={handleEditPriceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Base Cost Price (Rs.):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editBasePrice}
                    onChange={(e) => setEditBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Supplier cost</span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Selling Price (Rs.):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Customer price</span>
                </div>
              </div>

              {/* Live Profit Preview */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                <span className="text-slate-600 font-medium">Estimated Unit Profit:</span>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 block font-mono">
                    + Rs. {(Number(editPrice || 0) - Number(editBasePrice || 0)).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {Number(editPrice) > 0 
                      ? (((Number(editPrice) - Number(editBasePrice || 0)) / Number(editPrice)) * 100).toFixed(1) + '% Margin'
                      : '0% Margin'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Save & Trigger Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADD NEW GROCERY ITEM                                       */}
      {/* =================================================================== */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Grocery Product</h3>

            <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Red Tomatoes"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <span className="text-[10px] text-slate-400 font-medium">({categories.length} available)</span>
                </div>
                <select
                  value={newProductCategoryId}
                  onChange={(e) => setNewProductCategoryId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {categories.map(c => (
                    <option key={c.categoryId} value={c.categoryId}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Brand *</label>
                  <span className="text-[10px] text-slate-400 font-medium">({brands.length} available)</span>
                </div>
                <select
                  value={newProductBrandId}
                  onChange={(e) => setNewProductBrandId(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {brands.map(b => (
                    <option key={b.brandId} value={b.brandId}>
                      {b.brandName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Unit Type *</label>
                <select
                  value={newProductUnitType}
                  onChange={(e) => setNewProductUnitType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="100g">100g</option>
                  <option value="unit">unit</option>
                  <option value="kg">kg</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Base Cost Price (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Wholesale cost"
                  value={newProductBasePrice}
                  onChange={(e) => setNewProductBasePrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-slate-400">Supplier/Purchase cost</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Selling Price (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Selling price"
                  value={newProductUnitPrice}
                  onChange={(e) => setNewProductUnitPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                />
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Profit: Rs. {(Number(newProductUnitPrice || 0) - Number(newProductBasePrice || 0)).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Stock *</label>
                <input
                  type="number"
                  required
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Min Alert Level *</label>
                <input
                  type="number"
                  required
                  value={newProductMinStock}
                  onChange={(e) => setNewProductMinStock(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: CREATE COUPON                                              */}
      {/* =================================================================== */}
      {showCreateCouponModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCoupon ? 'Edit Promotional Coupon' : 'Create Promotional Coupon'}
            </h3>

            <form onSubmit={handleCouponSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLASH20"
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Get 20% off on all purchases"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Min Order (Rs.) *</label>
                  <input
                    type="number"
                    required
                    value={newCouponMinOrder}
                    onChange={(e) => setNewCouponMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Discount % *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newCouponDiscount}
                    onChange={(e) => setNewCouponDiscount(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="freedel"
                  checked={newCouponFreeDel}
                  onChange={(e) => setNewCouponFreeDel(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm"
                />
                <label htmlFor="freedel" className="font-semibold text-slate-700">
                  Include FREE Delivery
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateCouponModal(false);
                    setEditingCoupon(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: ADD / EDIT CATEGORY                                        */}
      {/* =================================================================== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingCategory ? 'Edit Product Category' : 'Add New Product Category'}
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Spices & Seasoning"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brief description of this grocery category..."
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: ADD / EDIT BRAND                                           */}
      {/* =================================================================== */}
      {showBrandModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              {editingBrand ? 'Edit Product Brand' : 'Add New Product Brand'}
            </h3>

            <form onSubmit={handleBrandSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maliban"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Brand story or information..."
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBrandModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  {editingBrand ? 'Update Brand' : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
