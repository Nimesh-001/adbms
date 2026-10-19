import React, { useState, useEffect } from 'react';
import { X, MapPin, CreditCard, Banknote, Tag, Check, AlertCircle, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../api';

export default function CheckoutModal({
  isOpen,
  onClose,
  items,
  user,
  onOrderSuccess,
}) {
  if (!isOpen) return null;

  // 3-section flow state
  const [activeSection, setActiveSection] = useState(1);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('Colombo');
  const [postalCode, setPostalCode] = useState('10100');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Loading & error
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Calculate Base Subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  );

  // Load user's saved addresses and active coupons from database
  useEffect(() => {
    if (user?.userId) {
      api.getUserAddresses(user.userId)
        .then(res => {
          if (res.data && res.data.length > 0) {
            setSavedAddresses(res.data);
            setSelectedAddressId(res.data[0].addressId);
          }
        })
        .catch(err => console.error('Failed to load addresses:', err));

      api.getActiveCoupons()
        .then(res => {
          if (res.data) setAvailableCoupons(res.data);
        })
        .catch(err => console.error('Failed to load coupons:', err));
    }
  }, [user]);

  // Handle saving new address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressLine1 || !city) {
      setErrorMsg('Please enter Address Line 1 and City.');
      return;
    }
    setErrorMsg('');
    try {
      const payload = {
        userId: user.userId,
        recipientName: `${user.firstName} ${user.lastName}`,
        recipientPhone: user.mobilePhone,
        addressLine1,
        addressLine2,
        city,
        postalCode,
        isDefault: true,
      };
      const res = await api.addAddress(payload);
      const newAddressId = res.data.addressId;
      setSelectedAddressId(newAddressId);
      // Reload addresses
      const updated = await api.getUserAddresses(user.userId);
      setSavedAddresses(updated.data);
      setActiveSection(2); // Automatically advance to Payment Section
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save address');
    }
  };

  // Handle Apply Coupon
  const handleApplyCoupon = async (codeToApply = couponCode) => {
    setCouponError('');
    setCouponSuccess('');
    if (!codeToApply || !codeToApply.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    try {
      const res = await api.validateCoupon(codeToApply.trim().toUpperCase(), subtotal);
      setAppliedCoupon(res.data);
      setCouponCode(res.data.couponCode);
      setCouponSuccess(`Coupon ${res.data.couponCode} applied successfully!`);
      setShowCouponsModal(false);
    } catch (err) {
      setCouponError(err.message || 'Invalid coupon code');
      setAppliedCoupon(null);
    }
  };

  // Financial Calculations
  const discountAmount = appliedCoupon ? Number(appliedCoupon.discountAmount || 0) : 0;
  
  // Delivery Fee Rule: Rs. 0 if subtotal >= 3000 OR coupon has free delivery; else Rs. 350
  const isFreeDelivery = (appliedCoupon && appliedCoupon.freeDelivery) || subtotal >= 3000;
  const deliveryCharge = isFreeDelivery ? 0 : 350;

  const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

  // Final Order Submission
  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      setErrorMsg('Please select or add a delivery address in Section 1.');
      setActiveSection(1);
      return;
    }

    if (paymentMethod === 'CARD_PAYMENT') {
      if (!cardNumber || cardNumber.length < 16) {
        setErrorMsg('Please enter a valid 16-digit card number.');
        setActiveSection(2);
        return;
      }
    }

    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        userId: user.userId,
        addressId: selectedAddressId,
        couponCode: appliedCoupon ? appliedCoupon.couponCode : null,
        paymentMethod,
        subtotal,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const res = await api.checkout(payload);
      const orderNumber = res.data.p_order_number;
      const orderId = res.data.p_order_id;

      // Build receipt payload
      const receiptData = {
        orderId,
        orderNumber,
        customerName: `${user.firstName} ${user.lastName}`,
        mobilePhone: user.mobilePhone,
        email: user.email,
        subtotal,
        discountAmount,
        deliveryCharge,
        totalAmount,
        paymentMethod,
        orderDate: new Date().toLocaleString(),
        items: [...items],
      };

      onOrderSuccess(receiptData);
    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed. Please check stock availability.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              SuperMart Secure Checkout
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Follow the 3 sections to confirm your grocery order.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveSection(1)}
            className={`py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
              activeSection === 1
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center">1</span>
            <span>Delivery Address</span>
          </button>

          <button
            onClick={() => setActiveSection(2)}
            className={`py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
              activeSection === 2
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center">2</span>
            <span>Payment Method</span>
          </button>

          <button
            onClick={() => setActiveSection(3)}
            className={`py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 border-b-2 transition ${
              activeSection === 3
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center justify-center">3</span>
            <span>Coupon & Review</span>
          </button>
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">

          {/* ============================================================== */}
          {/* SECTION 1: DELIVERY ADDRESS                                     */}
          {/* ============================================================== */}
          {activeSection === 1 && (
            <div className="space-y-6">
              {/* Existing Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Choose from saved addresses:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.addressId}
                        onClick={() => setSelectedAddressId(addr.addressId)}
                        className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                          selectedAddressId === addr.addressId
                            ? 'border-emerald-600 bg-emerald-50/40 text-emerald-950 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-slate-900">{addr.recipientName}</span>
                            {selectedAddressId === addr.addressId && (
                              <Check className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{addr.recipientPhone}</p>
                          <p className="text-xs text-slate-700 mt-2 font-medium">
                            {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Address Form (Auto-filled with user's name & phone) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Add New Delivery Address</span>
                </h3>

                <form onSubmit={handleSaveAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Auto-filled Name */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Recipient Full Name (Auto-filled)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${user.firstName} ${user.lastName}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* Auto-filled Phone */}
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">
                      Mobile Phone (Auto-filled)
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user.mobilePhone}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Street Address / House No. *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. No. 45, Temple Road"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Apartment, Suite, Unit (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Level 3, Flat B"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Colombo, Kandy, Galle"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition"
                    >
                      Save & Proceed to Payment
                    </button>
                  </div>
                </form>
              </div>

              {selectedAddressId && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setActiveSection(2)}
                    className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5"
                  >
                    <span>Continue with Selected Address</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 2: PAYMENT METHOD SELECTION                             */}
          {/* ============================================================== */}
          {activeSection === 2 && (
            <div className="space-y-6">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select Your Payment Method:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cash on Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start space-x-4 ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Pay in cash to our delivery driver when your groceries arrive at your doorstep.
                    </p>
                  </div>
                </div>

                {/* Card Payment Option */}
                <div
                  onClick={() => setPaymentMethod('CARD_PAYMENT')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start space-x-4 ${
                    paymentMethod === 'CARD_PAYMENT'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Credit / Debit Card</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Instant secure checkout with Visa, MasterCard, or LankaPay.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Inputs if Card Payment is Selected */}
              {paymentMethod === 'CARD_PAYMENT' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 mr-1" />
                    Enter Card Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        16-Digit Card Number
                      </label>
                      <input
                        type="text"
                        maxLength="16"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Expiry (MM/YY)
                      </label>
                      <input
                        type="text"
                        maxLength="5"
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength="4"
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation button */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  onClick={() => setActiveSection(1)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  ← Back to Address
                </button>

                <button
                  onClick={() => setActiveSection(3)}
                  className="px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <span>Proceed to Review & Coupons</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION 3: COUPON APPLICATION & FINAL REVIEW                    */}
          {/* ============================================================== */}
          {activeSection === 3 && (
            <div className="space-y-6">
              
              {/* Coupon Section */}
              <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Promotional Coupons & Discounts
                    </h3>
                  </div>

                  <button
                    onClick={() => setShowCouponsModal(!showCouponsModal)}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    <span>{showCouponsModal ? 'Hide Available Coupons' : 'View Available Coupons'}</span>
                  </button>
                </div>

                {/* Available Coupons Dropdown Modal / List from Database */}
                {showCouponsModal && (
                  <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">
                      Active Coupons in Database:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableCoupons.map((c) => (
                        <div
                          key={c.couponId}
                          onClick={() => handleApplyCoupon(c.couponCode)}
                          className="p-3 rounded-xl border border-dashed border-emerald-300 hover:bg-emerald-50/50 cursor-pointer transition flex items-center justify-between"
                        >
                          <div>
                            <span className="font-extrabold text-xs text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                              {c.couponCode}
                            </span>
                            <p className="text-[11px] text-slate-600 mt-1">{c.description}</p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600">Apply</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupon Code Input & Apply Button */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code (e.g. FREEDEL3000 or SAVE10PLUS)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-900 uppercase placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <button
                    onClick={() => handleApplyCoupon()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs transition"
                  >
                    Apply Coupon
                  </button>
                </div>

                {couponSuccess && (
                  <p className="text-xs font-bold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 mr-1" />
                    <span>{couponSuccess}</span>
                  </p>
                )}

                {couponError && (
                  <p className="text-xs font-bold text-red-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    <span>{couponError}</span>
                  </p>
                )}
              </div>

              {/* Order Summary & Pricing Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Summary
                </h4>

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Gross Subtotal ({items.length} items):</span>
                  <span className="font-bold text-slate-900">Rs. {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-emerald-700 font-semibold">
                  <span>Coupon Discount:</span>
                  <span>- Rs. {discountAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-600">
                  <span>Delivery Charge:</span>
                  <span className="font-bold text-slate-900">
                    {deliveryCharge === 0 ? (
                      <span className="text-emerald-700 font-extrabold uppercase">FREE</span>
                    ) : (
                      `Rs. ${deliveryCharge.toFixed(2)}`
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Net Total Bill:</span>
                  <span className="text-2xl font-black text-emerald-700">
                    Rs. {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Navigation Back & Confirm */}
              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={() => setActiveSection(2)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                >
                  ← Back to Payment
                </button>

                <button
                  onClick={handleConfirmOrder}
                  disabled={submitting}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm hover:bg-emerald-700 shadow-md hover:shadow-lg transition disabled:opacity-50 flex items-center space-x-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Placing Order...' : 'Confirm Order & Pay'}</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
