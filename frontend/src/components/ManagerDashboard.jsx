import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, Tag, Clock, Plus, RefreshCw, CheckCircle, Edit2, Layers, Search } from 'lucide-react';
import { api } from '../api';

export default function ManagerDashboard({ user, onOpenProfile }) {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'alerts', 'coupons', 'orders'

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [orders, setOrders] = useState([]);

  // Search filter
  const [productSearch, setProductSearch] = useState('');

  // Restock modal state
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(50);
  const [restockMsg, setRestockMsg] = useState('');

  // Add Product modal state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState(1);
  const [newProductBrandId, setNewProductBrandId] = useState(1);
  const [newProductUnitType, setNewProductUnitType] = useState('100g');
  const [newProductUnitPrice, setNewProductUnitPrice] = useState('100.00');
  const [newProductStock, setNewProductStock] = useState(100);
  const [newProductMinStock, setNewProductMinStock] = useState(15);
  const [newProductImage, setNewProductImage] = useState('');

  // Create Coupon modal state
  const [showCreateCouponModal, setShowCreateCouponModal] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDesc, setNewCouponDesc] = useState('');
  const [newCouponMinOrder, setNewCouponMinOrder] = useState('3000');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponFreeDel, setNewCouponFreeDel] = useState(true);

  // Edit Price modal state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes, alertRes, couponRes, orderRes] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getBrands(),
        api.getLowStockAlerts(),
        api.getAllCoupons(),
        api.getAllOrders(),
      ]);

      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      setLowStockAlerts(alertRes.data || []);
      setCoupons(couponRes.data || []);
      setOrders(orderRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load manager data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      loadData();
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
        unitPrice: Number(editPrice),
      };
      await api.updateProduct(editingProduct.productId, payload);
      setEditingProduct(null);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update price');
    }
  };

  // Handle Create Coupon
  const handleCreateCouponSubmit = async (e) => {
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
        validFrom: now.toISOString(),
        validUntil: nextYear.toISOString(),
      };
      await api.createCoupon(payload);
      setShowCreateCouponModal(false);
      setNewCouponCode('');
      setNewCouponDesc('');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to create coupon');
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
                          <span className="font-extrabold text-slate-900">Rs. {Number(p.unitPrice).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500"> / {p.unitType}</span>
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
                              }}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition"
                            >
                              Edit Price
                            </button>
                            <button
                              onClick={() => setRestockProduct(p)}
                              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[11px] transition shadow-xs"
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
              These items are currently running below their minimum stock threshold. Use the Restock button to call MySQL procedure <code>sp_restock_product</code>.
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
      {/* TAB 3: COUPONS & PROMOTIONS                                         */}
      {/* =================================================================== */}
      {activeTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900">System Promotional Coupons</h3>
            <button
              onClick={() => setShowCreateCouponModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5"
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
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Update Status</th>
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
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(o.orderId, e.target.value)}
                          className="px-2 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
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
              Update Price: {editingProduct.productName}
            </h3>
            <p className="text-xs text-slate-500">
              Note: Database trigger <code>trg_before_product_price_audit</code> will automatically log this price change into the audit logs table.
            </p>

            <form onSubmit={handleEditPriceSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  New Unit Price (Rs.):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
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
                <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                <select
                  value={newProductCategoryId}
                  onChange={(e) => setNewProductCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Brand *</label>
                <select
                  value={newProductBrandId}
                  onChange={(e) => setNewProductBrandId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  {brands.map(b => <option key={b.brandId} value={b.brandId}>{b.brandName}</option>)}
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
                <label className="font-semibold text-slate-700 block mb-1">Unit Price (Rs.) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newProductUnitPrice}
                  onChange={(e) => setNewProductUnitPrice(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
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
            <h3 className="text-base font-bold text-slate-900">Create Promotional Coupon</h3>

            <form onSubmit={handleCreateCouponSubmit} className="space-y-3 text-xs">
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
                  onClick={() => setShowCreateCouponModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
