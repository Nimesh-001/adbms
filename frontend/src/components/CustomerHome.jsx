import React, { useState } from 'react';
import { Search, Sparkles, Filter, CheckCircle2, XCircle, Plus, Minus, Tag, Truck, ShieldCheck } from 'lucide-react';

export default function CustomerHome({
  products,
  categories,
  brands,
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onSelectBrand,
  searchQuery,
  onSearchChange,
  onAddToCart,
  user,
  onOpenAuth,
}) {
  // Local quantity multipliers for each product
  const [quantities, setQuantities] = useState({});

  const handleQtyChange = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const getQty = (productId) => quantities[productId] || 1;

  const handleItemClick = (product) => {
    if (!user) {
      // User requested: "when i clik the item he should anviagate tot he loging page"
      onOpenAuth('login');
      return;
    }
  };

  const handleAdd = (e, product) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth('login');
      return;
    }
    const qty = getQty(product.productId);
    onAddToCart(product, qty);
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Hero & Promotional Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-800 via-emerald-700 to-slate-900 text-white shadow-xl p-8 sm:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold backdrop-blur-md border border-emerald-400/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Farm Fresh Everyday & Dynamic 100g Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Fresh Groceries, <br />
            <span className="text-emerald-300">Delivered To Your Door.</span>
          </h1>

          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Shop fresh produce, authentic local brands, and dairy essentials. All stock is managed in real-time with verified database transactions.
          </p>

          {/* Active Offers Banner Cards */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">FREE Delivery</span>
                <span className="text-emerald-200">On all orders above Rs. 3,000</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0">
                <Tag className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">10% OFF + Free Delivery</span>
                <span className="text-emerald-200">On all orders above Rs. 5,000</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      </section>

      {/* Search Bar & Filters Section */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vegetables, fruits, tea, bakery, or brand names..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition shadow-xs"
            />
          </div>

          {/* Brand Filter Dropdown */}
          <div className="relative w-full md:w-56">
            <select
              value={selectedBrand}
              onChange={(e) => onSelectBrand(Number(e.target.value))}
              aria-label="Filter by Brand"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition shadow-xs text-sm"
            >
              <option value="0">All Brands</option>
              {brands.map((b) => (
                <option key={b.brandId} value={b.brandId}>
                  {b.brandName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => onSelectCategory(0)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === 0
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.categoryId}
              onClick={() => onSelectCategory(c.categoryId)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === c.categoryId
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {c.categoryName}
            </button>
          ))}
        </div>
      </section>

      {/* Product Catalog Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Available Groceries & Foods ({products.length})
          </h2>
          <span className="text-xs text-slate-500">Live inventory from MySQL database</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <p className="text-slate-500 font-medium">No products match your search or filter.</p>
            <button
              onClick={() => { onSearchChange(''); onSelectCategory(0); onSelectBrand(0); }}
              className="mt-3 text-sm text-emerald-600 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => {
              const qty = getQty(p.productId);
              const dynamicTotal = (Number(p.unitPrice) * qty).toFixed(2);
              const isOutOfStock = p.currentStock <= 0;

              return (
                <div
                  key={p.productId}
                  onClick={() => handleItemClick(p)}
                  className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  {/* Image Container */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80'}
                      alt={p.productName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 shadow-xs">
                          <XCircle className="w-3 h-3 mr-1" /> Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> In Stock ({p.currentStock})
                        </span>
                      )}
                    </div>

                    {/* Brand Pill */}
                    <div className="absolute bottom-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/90 backdrop-blur-md text-slate-800 shadow-xs">
                        {p.brandName}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block">
                        {p.categoryName}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition line-clamp-1">
                        {p.productName}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Pricing & Unit */}
                    <div className="pt-2 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-slate-400">Unit Price: </span>
                          <span className="text-base font-extrabold text-slate-900">
                            Rs. {Number(p.unitPrice).toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {' '}/ {p.unitType}
                          </span>
                        </div>
                      </div>

                      {/* Dynamic Quantity Selector */}
                      <div className="mt-3 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <span className="text-xs font-medium text-slate-600">
                          {p.unitType === '100g' ? `Qty (${qty * 100}g)` : `Qty (${qty} unit)`}:
                        </span>
                        
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleQtyChange(p.productId, -1)}
                            disabled={isOutOfStock || qty <= 1}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {qty}
                          </span>

                          <button
                            onClick={() => handleQtyChange(p.productId, 1)}
                            disabled={isOutOfStock}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Total Price according to selected quantity */}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Calculated Total</span>
                          <span className="text-sm font-black text-emerald-700">
                            Rs. {dynamicTotal}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          onClick={(e) => handleAdd(e, p)}
                          disabled={isOutOfStock}
                          className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{user ? 'Add to Cart' : 'Login to Buy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
