import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CustomerHome from './components/CustomerHome';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import ReceiptModal from './components/ReceiptModal';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import { api } from './api';
import { Clock, ShoppingBag } from 'lucide-react';

export default function App() {
  // Current user state (persisted in localStorage)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('supermart_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation view: 'shop', 'orders'
  const [currentView, setCurrentView] = useState('shop');

  // Product & catalog state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState(0);

  // Cart state
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('supermart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Customer orders state
  const [customerOrders, setCustomerOrders] = useState([]);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('supermart_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Save user to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('supermart_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('supermart_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Load products, categories, brands from backend
  const loadCatalog = async () => {
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        api.getProducts(searchQuery, selectedCategory, selectedBrand),
        api.getCategories(),
        api.getBrands(),
      ]);
      const loadedProducts = prodRes.data || [];
      setProducts(loadedProducts);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);

      // Synchronize current stock for all items currently in cart
      setCartItems(prevCart =>
        prevCart.map(item => {
          const match = loadedProducts.find(p => p.productId === item.productId);
          if (match) {
            const maxStock = Number(match.currentStock) || 0;
            return {
              ...item,
              currentStock: maxStock,
              quantity: maxStock > 0 ? Math.min(item.quantity, maxStock) : item.quantity,
            };
          }
          return item;
        })
      );
    } catch (err) {
      console.error('Failed to load catalog:', err);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, [searchQuery, selectedCategory, selectedBrand]);

  // Load customer orders if on 'orders' tab
  useEffect(() => {
    if (user?.userId && currentView === 'orders') {
      api.getCustomerOrders(user.userId)
        .then(res => setCustomerOrders(res.data || []))
        .catch(console.error);
    }
  }, [user, currentView]);

  // Cart Actions - strictly bounded by available stock
  const handleAddToCart = (product, quantity) => {
    const maxStock = Number(product.currentStock) || 0;
    if (maxStock <= 0) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.productId === product.productId);
      if (existing) {
        const allowedQty = Math.min(existing.quantity + quantity, maxStock);
        return prev.map(item =>
          item.productId === product.productId
            ? { ...item, quantity: allowedQty, currentStock: maxStock }
            : item
        );
      }
      const initialQty = Math.min(Math.max(1, quantity), maxStock);
      return [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          unitType: product.unitType,
          unitPrice: product.unitPrice,
          imageUrl: product.imageUrl,
          currentStock: maxStock,
          quantity: initialQty,
        },
      ];
    });
  };

  const handleUpdateQty = (productId, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    const prod = products.find(p => p.productId === productId);
    setCartItems(prev =>
      prev.map(item => {
        if (item.productId === productId) {
          const maxStock = prod ? Number(prod.currentStock) : (Number(item.currentStock) || 999999);
          const validQty = Math.min(newQty, maxStock);
          return { ...item, quantity: validQty, currentStock: maxStock };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  };

  // Checkout Handlers
  const handleProceedCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      setIsAuthOpen(true);
      setAuthMode('login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleOrderSuccess = (receipt) => {
    setIsCheckoutOpen(false);
    setCartItems([]);
    setReceiptData(receipt);
    loadCatalog(); // Refresh stock
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('shop');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Universal Responsive Navbar */}
      <Navbar
        user={user}
        cartCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setIsAuthOpen(true);
        }}
        onOpenProfile={() => setIsProfileOpen(true)}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={setCurrentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ROLE 1: SUPER ADMIN DASHBOARD */}
        {user?.roleName === 'ROLE_ADMIN' && (
          <AdminDashboard user={user} />
        )}

        {/* ROLE 2: OPERATIONAL MANAGER DASHBOARD */}
        {user?.roleName === 'ROLE_MANAGER' && (
          <ManagerDashboard 
            user={user} 
            onOpenProfile={() => setIsProfileOpen(true)} 
            onRefreshCatalog={loadCatalog} 
          />
        )}

        {/* ROLE 3: CUSTOMER & PUBLIC GUEST VIEWS */}
        {(!user || user?.roleName === 'ROLE_CUSTOMER') && (
          <>
            {currentView === 'shop' && (
              <CustomerHome
                products={products}
                categories={categories}
                brands={brands}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                selectedBrand={selectedBrand}
                onSelectBrand={setSelectedBrand}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
                user={user}
                onOpenAuth={(mode) => {
                  setAuthMode(mode);
                  setIsAuthOpen(true);
                }}
              />
            )}

            {currentView === 'orders' && user && (
              <div className="space-y-6 pb-16">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Your Order History</h2>
                    <span className="text-xs text-slate-500">
                      Track and review all your past grocery orders and receipts
                    </span>
                  </div>
                </div>

                {customerOrders.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-3">
                    <ShoppingBag className="w-10 h-10 mx-auto text-slate-400" />
                    <p className="text-slate-500 font-medium">You haven't placed any orders yet.</p>
                    <button
                      onClick={() => setCurrentView('shop')}
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      Browse groceries
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-3 px-4">Order Number</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4">Subtotal</th>
                            <th className="py-3 px-4">Discount</th>
                            <th className="py-3 px-4">Delivery</th>
                            <th className="py-3 px-4">Total Amount</th>
                            <th className="py-3 px-4">Payment</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {customerOrders.map((o) => (
                            <tr key={o.orderId} className="hover:bg-slate-50/70">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                              <td className="py-3 px-4 text-slate-500">{new Date(o.orderDate).toLocaleDateString()}</td>
                              <td className="py-3 px-4">Rs. {Number(o.subtotal).toFixed(2)}</td>
                              <td className="py-3 px-4 text-emerald-700 font-semibold">- Rs. {Number(o.discountAmount).toFixed(2)}</td>
                              <td className="py-3 px-4">{Number(o.deliveryCharge) === 0 ? 'FREE' : `Rs. ${Number(o.deliveryCharge).toFixed(2)}`}</td>
                              <td className="py-3 px-4 font-black text-slate-900">Rs. {Number(o.totalAmount).toFixed(2)}</td>
                              <td className="py-3 px-4 font-medium text-emerald-700">{o.paymentMethod}</td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                                  {o.orderStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

      </main>

      {/* Universal Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p className="font-semibold text-slate-700">
          ©SuperMart Online Management System
        </p>
      </footer>

      {/* Interactive Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onProceedCheckout={handleProceedCheckout}
      />

      {/* 3-Section Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        user={user}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Confirmation Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        receipt={receiptData}
      />

      {/* Auth Modal (Sign In / Register) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(userData) => {
          setUser(userData);
          setIsAuthOpen(false);
        }}
      />

      {/* User Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onProfileUpdated={(updated) => setUser(updated)}
      />

    </div>
  );
}
