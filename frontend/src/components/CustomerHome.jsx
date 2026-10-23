import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Tag,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Bell,
  Percent,
  Flame,
  ArrowRight,
  Gift
} from 'lucide-react';

export default function CustomerHome({
  products = [],
  categories = [],
  brands = [],
  selectedCategory = 0,
  onSelectCategory,
  selectedBrand = 0,
  onSelectBrand,
  searchQuery = '',
  onSearchChange,
  onAddToCart,
  cartItems = [],
  user,
  onOpenAuth,
}) {
  // Local quantity multipliers for each product
  const [quantities, setQuantities] = useState({});

  // Pagination state: Maximum 20 items per page as requested
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  // Auto-rotating offers & coupon slides
  const offerSlides = [
    {
      id: 1,
      tag: 'FREE DELIVERY SPECIAL',
      tagIcon: Truck,
      title: 'Zero Delivery Fees Across All Cities',
      subtitle: 'Order your weekly groceries over Rs. 3,000 and enjoy free doorstep shipping direct from store.',
      code: 'FREEDEL3000',
      discount: 'FREE DELIVERY',
      minOrder: 'Min. Rs. 3,000',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
      badge: 'Verified Coupon',
      gradient: 'from-emerald-950/90 via-emerald-900/80 to-slate-950/95',
    },
    {
      id: 2,
      tag: 'MEGA SAVER COUPON',
      tagIcon: Percent,
      title: '10% Flat Discount + Free Delivery',
      subtitle: 'Stock up on rice, spices, pantry essentials and dairy. Save more when you buy in bulk.',
      code: 'SAVE10PLUS',
      discount: '10% OFF + FREE DEL',
      minOrder: 'Min. Rs. 5,000',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80',
      badge: 'Best Value',
      gradient: 'from-blue-950/90 via-indigo-950/80 to-slate-950/95',
    },
    {
      id: 3,
      tag: 'FARM FRESH HARVEST',
      tagIcon: Sparkles,
      title: 'Organic Daily Greens & Farm Vegetables',
      subtitle: 'Handpicked early morning from trusted local farms. Dynamic 100g pricing ensures you pay only for what you take.',
      code: 'FREEDEL3000',
      discount: 'FARM PICKS',
      minOrder: 'Live Real-time Inventory',
      image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=1200&q=80',
      badge: '100% Fresh',
      gradient: 'from-teal-950/90 via-emerald-950/80 to-stone-950/95',
    },
    {
      id: 4,
      tag: 'PANTRY & DAIRY ESSENTIALS',
      tagIcon: Flame,
      title: 'Premium Ceylon Tea, Spices & Bakery',
      subtitle: 'Top authentic Sri Lankan brands and household staples at guaranteed honest supermarket shelf prices.',
      code: 'SAVE10PLUS',
      discount: 'HOT DEALS',
      minOrder: 'Same-Day Dispatch',
      image: 'https://images.unsplash.com/photo-1506617564039-2f3b650b7010?auto=format&fit=crop&w=1200&q=80',
      badge: 'Daily Essentials',
      gradient: 'from-amber-950/90 via-orange-950/80 to-slate-950/95',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Live dynamic notifications
  const notifications = [
    {
      id: 1,
      icon: Flame,
      color: 'text-amber-400',
      text: 'Mega Offer: Use coupon SAVE10PLUS for 10% OFF + Free Delivery on orders over Rs. 5,000!',
      code: 'SAVE10PLUS',
    },
    {
      id: 2,
      icon: Truck,
      color: 'text-emerald-400',
      text: 'Free Delivery Active: Apply coupon FREEDEL3000 on orders over Rs. 3,000 for zero delivery fees!',
      code: 'FREEDEL3000',
    },
    {
      id: 3,
      icon: Sparkles,
      color: 'text-sky-300',
      text: 'Farm-Fresh Harvest arrived! Dynamic 100g flexible pricing active on all fresh produce.',
      code: null,
    },
    {
      id: 4,
      icon: ShieldCheck,
      color: 'text-emerald-400',
      text: 'Live Stock Tracking: Real-time inventory verified with instant database updates.',
      code: null,
    },
  ];

  const [currentNotif, setCurrentNotif] = useState(0);
  const [copiedCode, setCopiedCode] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Auto-cycle banner slides every 5 seconds (pauses on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % offerSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered, offerSlides.length]);

  // Auto-cycle top notification ticker every 4.5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentNotif((prev) => (prev + 1) % notifications.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [notifications.length]);

  // Reset to page 1 whenever search query, category, or brand filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBrand]);

  // 20 items per page calculation
  const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedProducts = products.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const catalogEl = document.getElementById('product-catalog');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

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

  const handleCopyCode = (code, e) => {
    if (e) e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setToastMsg(`Coupon "${code}" copied to clipboard! Paste it at checkout.`);
    setTimeout(() => setCopiedCode(''), 2500);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % offerSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + offerSlides.length) % offerSlides.length);
  };

  const activeSlide = offerSlides[currentSlide] || offerSlides[0];
  const activeNotification = notifications[currentNotif] || notifications[0];
  const NotifIcon = activeNotification.icon;
  const TagIcon = activeSlide.tagIcon;

  return (
    <div className="space-y-8 pb-16">
      
      {/* Floating Copied Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/30 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMsg}</span>
        </div>
      )}

      {/* 1. Live Interactive Notification & Hot Offers Ticker */}
      <section className="overflow-hidden rounded-2xl bg-linear-to-r from-slate-900 via-emerald-950 to-slate-900 text-white border border-emerald-500/20 shadow-md">
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5">
          <div className="flex items-center space-x-3 overflow-hidden">
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold uppercase tracking-wider shrink-0 border border-emerald-400/30 animate-pulse">
              <Bell className="w-3 h-3 mr-1" />
              Live Deal
            </span>

            <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium text-slate-200 truncate transition-all duration-300">
              <NotifIcon className={`w-4 h-4 shrink-0 ${activeNotification.color}`} />
              <span className="truncate">{activeNotification.text}</span>
            </div>
          </div>

          {activeNotification.code && (
            <button
              onClick={(e) => handleCopyCode(activeNotification.code, e)}
              className="ml-3 shrink-0 inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {copiedCode === activeNotification.code ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy: {activeNotification.code}</span>
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {/* 2. Changing Images & Special Offers / Coupons Banner Slider */}
      <section
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-xl transition-all duration-500 min-h-[270px] sm:min-h-[310px] flex items-center"
      >
        {/* Background Image with Dynamic Crossfade Transition */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {offerSlides.map((slide, idx) => {
            const isActive = idx === currentSlide;
            return (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`w-full h-full object-cover transform transition-transform duration-7000 ease-out ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                />
                <div className={`absolute inset-0 bg-linear-to-r ${slide.gradient} backdrop-blur-[1px]`} />
              </div>
            );
          })}
        </div>

        {/* Content Container (Vertically sleek & compact for improved usability) */}
        <div className="relative z-10 w-full p-5 sm:p-7 max-w-3xl space-y-3">
          {/* Top Tag & Badge */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-bold backdrop-blur-md border border-emerald-400/30">
              {TagIcon && <TagIcon className="w-3.5 h-3.5" />}
              <span>{activeSlide.tag}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
              {activeSlide.badge}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug text-white drop-shadow-sm">
            {activeSlide.title}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-xl line-clamp-2">
            {activeSlide.subtitle}
          </p>

          {/* Action Row: Coupon Code Pill & Shop Action */}
          <div className="pt-1 flex flex-wrap items-center gap-2.5">
            {activeSlide.code && (
              <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 pl-2.5 space-x-2.5">
                <div className="text-left">
                  <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider block">
                    Promo Code
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm text-white tracking-wider">
                    {activeSlide.code}
                  </span>
                </div>
                <button
                  onClick={(e) => handleCopyCode(activeSlide.code, e)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer shadow-xs"
                >
                  {copiedCode === activeSlide.code ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <button
              onClick={() => {
                const catalogEl = document.getElementById('product-catalog');
                if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 font-bold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <span>explore item</span>
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </button>
          </div>

          {/* Quick Value Cards */}
          <div className="pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg">
            <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
              <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <Truck className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block text-[11px]">FREE Delivery</span>
                <span className="text-slate-300 text-[10px]">Orders above Rs. 3,000 (FREEDEL3000)</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded-xl bg-black/30 backdrop-blur-md border border-white/10">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block text-[11px]">10% OFF + Free Ship</span>
                <span className="text-slate-300 text-[10px]">Orders above Rs. 5,000 (SAVE10PLUS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          aria-label="Previous Offer"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="Next Offer"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition cursor-pointer shadow-lg"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2">
          {offerSlides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                currentSlide === idx
                  ? 'w-6 h-1.5 bg-emerald-400'
                  : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      </section>

      {/* 3. Search Bar & Filters Section */}
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

        {/* Category Filter Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span>Categories ({categories.length}):</span>
            {selectedCategory !== 0 && (
              <button
                onClick={() => onSelectCategory(0)}
                className="text-emerald-600 hover:underline text-[11px] cursor-pointer"
              >
                Clear category
              </button>
            )}
          </div>
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => onSelectCategory(0)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === c.categoryId
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {c.categoryName}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Product Catalog Grid (Max 20 Items per page) */}
      <section id="product-catalog" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Available Groceries & Foods ({products.length})
            </h2>
            <p className="text-xs text-slate-500">
              Showing at most 20 items per view • Page {currentPage} of {totalPages}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Showing {products.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + ITEMS_PER_PAGE, products.length)} of {products.length}
            </span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <p className="text-slate-500 font-medium">No products match your search or filter.</p>
            <button
              onClick={() => { onSearchChange(''); onSelectCategory(0); onSelectBrand(0); }}
              className="mt-3 text-sm text-emerald-600 hover:underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedProducts.map((p) => {
                const qty = getQty(p.productId);
                const dynamicTotal = (Number(p.unitPrice) * qty).toFixed(2);
                const isOutOfStock = p.currentStock <= 0;
                const isInCart = Boolean(cartItems?.some(item => item.productId === p.productId));

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
                        <div className={`mt-3 flex items-center justify-between p-2 rounded-xl border transition ${
                          user && isInCart
                            ? 'bg-slate-100/70 border-slate-200 opacity-60'
                            : 'bg-slate-50 border-slate-100'
                        }`}>
                          <span className="text-xs font-medium text-slate-600">
                            {p.unitType === '100g' ? `Qty (${qty * 100}g)` : `Qty (${qty} unit)`}:
                          </span>
                          
                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleQtyChange(p.productId, -1)}
                              disabled={isOutOfStock || (user && isInCart) || qty <= 1}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            
                            <span className="w-8 text-center text-xs font-bold text-slate-900">
                              {qty}
                            </span>

                            <button
                              onClick={() => handleQtyChange(p.productId, 1)}
                              disabled={isOutOfStock || (user && isInCart)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
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
                            disabled={isOutOfStock || (user && isInCart)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer ${
                              isOutOfStock
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : user && isInCart
                                  ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'
                            }`}
                          >
                            {user && isInCart ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Added to Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>{user ? 'Add to Cart' : 'Login to Buy'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls: Displayed whenever products exist */}
            {totalPages > 1 && (
              <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
                <span className="text-xs text-slate-500 font-medium">
                  Showing page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
                  <span className="font-bold text-slate-800">{totalPages}</span> (20 items max per view)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

    </div>
  );
}
