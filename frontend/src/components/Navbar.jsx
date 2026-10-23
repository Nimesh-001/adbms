import React from 'react';
import { ShoppingBag, ShoppingCart, User as UserIcon, LogOut, ShieldCheck, UserCog, Package } from 'lucide-react';

export default function Navbar({
  user,
  cartCount,
  onOpenCart,
  onOpenAuth,
  onOpenProfile,
  onLogout,
  currentView,
  onNavigate,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate('shop')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-700 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Super<span className="text-emerald-600">Mart</span>
              </span>
              <span className="block text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Online Fresh Grocery
              </span>
            </div>
          </div>

          {/* Navigation Links based on Role */}
          <nav className="hidden md:flex items-center space-x-1">
            {(!user || user.roleName === 'ROLE_CUSTOMER') && (
              <>
                <button
                  onClick={() => onNavigate('shop')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    currentView === 'shop'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Products & Groceries
                </button>
                {user && (
                  <button
                    onClick={() => onNavigate('orders')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      currentView === 'orders'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    My Orders
                  </button>
                )}
              </>
            )}

            {user?.roleName === 'ROLE_MANAGER' && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <UserCog className="w-3.5 h-3.5 mr-1" />
                  Operational Manager Portal
                </span>
              </div>
            )}

            {user?.roleName === 'ROLE_ADMIN' && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-900 text-white shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  Super Admin Console
                </span>
              </div>
            )}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Customer Cart Button */}
            {(!user || user.roleName === 'ROLE_CUSTOMER') && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs flex items-center"
                title="View Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth State */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenProfile}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                  title="View Profile"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                    {user.firstName?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-slate-800 hidden sm:inline">
                    {user.firstName}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
