import React from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQty,
  onRemoveItem,
  onProceedCheckout,
}) {
  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                Your Cart ({items.length})
              </h2>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <p className="text-slate-500 font-medium">Your cart is empty.</p>
                <button
                  onClick={onClose}
                  className="text-sm font-bold text-emerald-600 hover:underline"
                >
                  Start shopping now
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemTotal = (Number(item.unitPrice) * item.quantity).toFixed(2);
                return (
                  <div
                    key={item.productId}
                    className="flex space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 items-center justify-between"
                  >
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                      alt={item.productName}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />

                    <div className="flex-1 min-w-0 px-2">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {item.productName}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Rs. {Number(item.unitPrice).toFixed(2)} / {item.unitType}
                      </p>

                      {/* Quantity Modifier */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => onUpdateQty(item.productId, item.quantity - 1)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-100 transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-slate-900 w-6 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQty(item.productId, item.quantity + 1)}
                          disabled={item.currentStock != null && item.quantity >= item.currentStock}
                          className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-600 flex items-center justify-center hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {item.currentStock != null && item.quantity >= item.currentStock && (
                        <p className="text-[10px] text-amber-600 font-semibold mt-1">
                          Max stock reached ({item.currentStock} available)
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-slate-900">
                        Rs. {itemTotal}
                      </p>
                      <button
                        onClick={() => onRemoveItem(item.productId)}
                        className="text-slate-400 hover:text-red-600 mt-2 p-1 transition"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Summary & Checkout Button */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-white space-y-4 shadow-lg">
              <div className="flex items-center justify-between text-base">
                <span className="text-slate-600 font-medium">Subtotal</span>
                <span className="text-xl font-extrabold text-slate-900">
                  Rs. {subtotal.toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Delivery fees & discounts will be calculated in the checkout sections.
              </p>

              <button
                onClick={onProceedCheckout}
                className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
