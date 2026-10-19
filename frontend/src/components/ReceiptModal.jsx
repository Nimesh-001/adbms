import React from 'react';
import { CheckCircle2, Printer, X, ShoppingBag } from 'lucide-react';

export default function ReceiptModal({
  isOpen,
  onClose,
  receipt,
}) {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 p-6 sm:p-8 space-y-6">
        
        {/* Success Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Order Confirmed!
          </h2>
          <p className="text-xs text-slate-500">
            Thank you for shopping with SuperMart. Your order receipt is shown below.
          </p>
        </div>

        {/* Receipt Container */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 font-mono text-xs">
          
          {/* SuperMart Branding Header */}
          <div className="border-b border-dashed border-slate-300 pb-3 text-center">
            <span className="font-extrabold text-sm text-slate-900 block font-sans tracking-tight">
              SUPER<span className="text-emerald-600">MART</span> ONLINE
            </span>
            <span className="text-[10px] text-slate-400 block font-sans">
              Official Tax Invoice / Customer Receipt
            </span>
          </div>

          {/* Meta details */}
          <div className="space-y-1 text-slate-600">
            <div className="flex justify-between">
              <span>Order Number:</span>
              <span className="font-bold text-slate-900">{receipt.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{receipt.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span>Mobile Phone:</span>
              <span>{receipt.mobilePhone}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{receipt.orderDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Mode:</span>
              <span className="font-bold text-emerald-700">{receipt.paymentMethod}</span>
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="border-t border-b border-dashed border-slate-300 py-3 space-y-2">
            <div className="flex justify-between text-slate-400 text-[10px] uppercase font-bold">
              <span>Item & Qty</span>
              <span>Total</span>
            </div>
            {receipt.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-800">
                <span className="truncate pr-2">
                  {item.productName} × {item.quantity}
                </span>
                <span className="shrink-0 font-bold">
                  Rs. {(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals Breakdown */}
          <div className="space-y-1.5 pt-1 text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Rs. {Number(receipt.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>Discount:</span>
              <span>- Rs. {Number(receipt.discountAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee:</span>
              <span>
                {Number(receipt.deliveryCharge) === 0 ? 'FREE' : `Rs. ${Number(receipt.deliveryCharge).toFixed(2)}`}
              </span>
            </div>
            <div className="border-t border-slate-300 pt-2 flex justify-between text-sm font-black text-slate-900 font-sans">
              <span>Total Paid:</span>
              <span className="text-emerald-700 text-lg">
                Rs. {Number(receipt.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center space-x-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center justify-center space-x-1.5 shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

      </div>
    </div>
  );
}
