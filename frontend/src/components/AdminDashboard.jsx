import React, { useState, useEffect } from 'react';
import { 
  Users, BarChart3, Shield, FileText, Plus, RefreshCw, 
  DollarSign, ShoppingCart, UserCheck, AlertOctagon, TrendingUp, Calendar, CheckCircle2,
  X, Table, Printer, Tag, Award, Filter, Search, Package,
  ChevronLeft, ChevronRight, Clock
} from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics', 'managers', 'audit', 'monthly'

  // Data states
  const [kpis, setKpis] = useState({});
  const [dailySales, setDailySales] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [managers, setManagers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Create Manager Modal
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [mgrFirstName, setMgrFirstName] = useState('');
  const [mgrLastName, setMgrLastName] = useState('');
  const [mgrEmail, setMgrEmail] = useState('');
  const [mgrMobile, setMgrMobile] = useState('');
  const [mgrNic, setMgrNic] = useState('');
  const [mgrGender, setMgrGender] = useState('Male');
  const [mgrPassword, setMgrPassword] = useState('manager123');
  const [mgrError, setMgrError] = useState('');
  const [mgrSuccess, setMgrSuccess] = useState('');

  // Unified Executive Reporting & Filter States (Daily, Weekly, Monthly, Yearly)
  const [reportPeriodType, setReportPeriodType] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [reportYear, setReportYear] = useState(2026);
  const [reportMonth, setReportMonth] = useState(10);
  const [reportWeek, setReportWeek] = useState(43);
  const [reportDate, setReportDate] = useState('2026-10-21');
  const [reportData, setReportData] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSectionFilter, setReportSectionFilter] = useState('all'); // 'all', 'summary', 'trends', 'products'

  // Product Day-by-Day Sales Modal State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDailySales, setProductDailySales] = useState([]);
  const [productDailyLoading, setProductDailyLoading] = useState(false);
  const [productChartMetric, setProductChartMetric] = useState('revenue'); // 'revenue' or 'quantity'
  const [productTimeRange, setProductTimeRange] = useState('7days'); // '7days', 'week', 'month', 'all'

  // Daily Sales Summary View State
  const [dailySalesView, setDailySalesView] = useState('chart'); // 'chart' or 'table'
  const [dailySalesMetric, setDailySalesMetric] = useState('revenue'); // 'revenue' or 'orders'

  // Audit Trail Filter & Search States
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditPage, setAuditPage] = useState(1);
  const [auditLimitMode, setAuditLimitMode] = useState('25'); // '25' (recent 25), '50', 'ALL'

  // Metric & Count Formatter for scalable enterprise logging (e.g. 100k+, 1.5M)
  const formatCompactCount = (num) => {
    if (num == null) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k+';
    return String(num);
  };

  const [loading, setLoading] = useState(false);

  const handleOpenProductSales = async (product) => {
    setSelectedProduct(product);
    setProductTimeRange('7days');
    setProductDailyLoading(true);
    setProductDailySales([]);
    try {
      const res = await api.getProductDailySales(product.productId);
      setProductDailySales(res.data || []);
    } catch (err) {
      console.error('Failed to load product daily sales:', err);
    } finally {
      setProductDailyLoading(false);
    }
  };

  const getProcessedProductSales = () => {
    if (!productDailySales || productDailySales.length === 0) return [];
    const sorted = [...productDailySales].sort((a, b) => new Date(a.salesDate) - new Date(b.salesDate));

    if (productTimeRange === '7days') {
      const refDate = sorted.length > 0 ? new Date(sorted[sorted.length - 1].salesDate) : new Date();
      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(refDate);
        d.setDate(d.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        const match = sorted.find(s => s.salesDate === dateStr);
        last7.push({
          label: `${m}/${day}`,
          periodLabel: dateStr,
          totalQuantitySold: match ? Number(match.totalQuantitySold || 0) : 0,
          totalSalesRevenue: match ? Number(match.totalSalesRevenue || 0) : 0,
          totalCost: match ? Number(match.totalCost || 0) : 0,
          totalProfit: match ? Number(match.totalProfit || 0) : 0,
          orderCount: match ? Number(match.orderCount || 0) : 0,
        });
      }
      return last7;
    }

    if (productTimeRange === 'week') {
      const weeksMap = {};
      sorted.forEach(item => {
        const d = new Date(item.salesDate);
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDays = (d - startOfYear) / 86400000;
        const weekNum = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7);
        const key = `Wk ${weekNum}`;
        const fullKey = `Week ${weekNum} (${d.getFullYear()})`;

        if (!weeksMap[key]) {
          weeksMap[key] = {
            label: key,
            periodLabel: fullKey,
            totalQuantitySold: 0,
            totalSalesRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            orderCount: 0,
          };
        }
        weeksMap[key].totalQuantitySold += Number(item.totalQuantitySold || 0);
        weeksMap[key].totalSalesRevenue += Number(item.totalSalesRevenue || 0);
        weeksMap[key].totalCost += Number(item.totalCost || 0);
        weeksMap[key].totalProfit += Number(item.totalProfit || 0);
        weeksMap[key].orderCount += Number(item.orderCount || 0);
      });
      return Object.values(weeksMap);
    }

    if (productTimeRange === 'month') {
      const monthsMap = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      sorted.forEach(item => {
        const d = new Date(item.salesDate);
        const monthName = monthNames[d.getMonth()];
        const key = `${monthName} '${String(d.getFullYear()).slice(-2)}`;
        const fullKey = `${monthName} ${d.getFullYear()}`;

        if (!monthsMap[key]) {
          monthsMap[key] = {
            label: key,
            periodLabel: fullKey,
            totalQuantitySold: 0,
            totalSalesRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            orderCount: 0,
          };
        }
        monthsMap[key].totalQuantitySold += Number(item.totalQuantitySold || 0);
        monthsMap[key].totalSalesRevenue += Number(item.totalSalesRevenue || 0);
        monthsMap[key].totalCost += Number(item.totalCost || 0);
        monthsMap[key].totalProfit += Number(item.totalProfit || 0);
        monthsMap[key].orderCount += Number(item.orderCount || 0);
      });
      return Object.values(monthsMap);
    }

    return sorted.map(item => ({
      label: item.salesDate?.split('-')?.slice(1)?.join('/') || item.salesDate,
      periodLabel: item.salesDate,
      totalQuantitySold: Number(item.totalQuantitySold || 0),
      totalSalesRevenue: Number(item.totalSalesRevenue || 0),
      totalCost: Number(item.totalCost || 0),
      totalProfit: Number(item.totalProfit || 0),
      orderCount: Number(item.orderCount || 0),
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, dailyRes, topRes, mgrRes, auditRes, reportRes] = await Promise.all([
        api.getKpis(),
        api.getDailySales(),
        api.getTopSelling(),
        api.getManagers(),
        api.getAuditLogs(150),
        api.getAnalyticsReport({ periodType: 'monthly', year: 2026, month: 10 }),
      ]);

      setKpis(kpiRes.data || {});
      setDailySales(dailyRes.data || []);
      setTopSelling(topRes.data || []);
      setManagers(mgrRes.data || []);
      setAuditLogs(auditRes.data || []);
      if (reportRes?.data) {
        setReportData(reportRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Add Manager Submit (Calls sp_create_operational_manager)
  const handleAddManagerSubmit = async (e) => {
    e.preventDefault();
    setMgrError('');
    setMgrSuccess('');

    try {
      const payload = {
        firstName: mgrFirstName,
        lastName: mgrLastName,
        email: mgrEmail,
        mobilePhone: mgrMobile,
        nicNumber: mgrNic,
        gender: mgrGender,
        password: mgrPassword,
      };

      const adminId = user?.userId || 1;
      const res = await api.createManager(adminId, payload);
      setMgrSuccess(res.message || 'Operational Manager created successfully!');
      
      setTimeout(() => {
        setShowAddManagerModal(false);
        setMgrFirstName('');
        setMgrLastName('');
        setMgrEmail('');
        setMgrMobile('');
        setMgrNic('');
        setMgrSuccess('');
      }, 1200);

      loadData();
    } catch (err) {
      setMgrError(err.message || 'Failed to create manager');
    }
  };

  // Handle Generate Unified Report (Daily, Weekly, Monthly, Yearly)
  const handleGenerateUnifiedReport = async (overrideParams = {}) => {
    setGeneratingReport(true);
    try {
      const pType = overrideParams.periodType || reportPeriodType;
      const yr = overrideParams.year !== undefined ? overrideParams.year : reportYear;
      const mo = overrideParams.month !== undefined ? overrideParams.month : reportMonth;
      const wk = overrideParams.week !== undefined ? overrideParams.week : reportWeek;
      const dt = overrideParams.date || reportDate;

      const res = await api.getAnalyticsReport({
        periodType: pType,
        year: yr,
        month: mo,
        week: wk,
        date: dt,
      });

      if (res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleToggleManager = async (managerId, currentActive) => {
    try {
      await api.toggleManager(managerId, !currentActive);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update manager status');
    }
  };

  return (
    <div className={`space-y-8 pb-16 ${selectedProduct ? 'print-target-product' : 'print-target-executive'}`}>
      
      {/* Top Banner */}
      <div className="no-print p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Super Administrator Console
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">
            System Analytics & Security Control
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Logged in as master admin: <span className="font-mono font-bold text-white">{user.username}</span> • Database User: <code>supermart_admin</code>
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center space-x-1.5 text-xs font-bold self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="no-print grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2 font-mono">
            Rs. {Number(kpis.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Net collections</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-300 shadow-xs ring-1 ring-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Net Profit</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-emerald-950 mt-2 font-mono">
            Rs. {Number(kpis.total_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-emerald-700 font-extrabold">
            {Number(kpis.total_revenue) > 0 ? (((Number(kpis.total_profit || 0)) / Number(kpis.total_revenue)) * 100).toFixed(1) + '% profit margin' : 'Store profit'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {kpis.total_orders || 0}
          </p>
          <span className="text-[10px] text-slate-400">Processed</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Customers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {kpis.total_customers || 0}
          </p>
          <span className="text-[10px] text-purple-600 font-semibold">Self-registered</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Op Managers</span>
            <UserCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {kpis.total_managers || 0}
          </p>
          <span className="text-[10px] text-slate-400">Created by admin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Products</span>
            <BarChart3 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            {kpis.total_products || 0}
          </p>
          <span className="text-[10px] text-slate-400">Active catalog</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Low Stock</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-lg font-black text-red-600 mt-2">
            {kpis.low_stock_count || 0}
          </p>
          <span className="text-[10px] text-red-500 font-semibold">Immediate attention</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="no-print flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Executive Reports & Sales Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('managers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'managers'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-4 h-4 text-purple-400" />
          <span>Operational Managers ({managers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Shield className="w-4 h-4 text-blue-400" />
          <span>System Audit Trail</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
            activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            {formatCompactCount(auditLogs.length)}
          </span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ANALYTICS & TOP SELLING PRODUCTS                             */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">

          {/* =============================================================== */}
          {/* EXECUTIVE REPORTING STUDIO: REORGANIZED & USER-FRIENDLY TOOLBAR */}
          {/* =============================================================== */}
          <div className="no-print bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-6">
            
            {/* Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      SuperMart Executive Reports & Sales Analytics
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider hidden sm:inline-block">
                      Financial Engine
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select a timeframe horizon, customize interval parameters, and generate certified financial statements.
                  </p>
                </div>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs flex items-center space-x-2 self-start sm:self-auto cursor-pointer shrink-0"
                title="Print official report"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Print Official Report</span>
              </button>
            </div>

            {/* Step 1: Timeframe Horizon Selection */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 1: Choose Report Timeframe</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">Click any interval to switch</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'daily', label: 'Daily', sub: 'Single Day Audit', icon: Calendar, color: 'text-blue-500' },
                  { id: 'weekly', label: 'Weekly', sub: 'Fiscal Week', icon: BarChart3, color: 'text-purple-500' },
                  { id: 'monthly', label: 'Monthly', sub: 'Calendar Month', icon: FileText, color: 'text-emerald-500' },
                  { id: 'yearly', label: 'Yearly', sub: 'Annual Summary', icon: TrendingUp, color: 'text-amber-500' },
                  { id: 'all', label: 'Lifetime', sub: 'All-Time Records', icon: DollarSign, color: 'text-teal-600' },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = reportPeriodType === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setReportPeriodType(item.id);
                        handleGenerateUnifiedReport({ periodType: item.id });
                      }}
                      className={`p-3 rounded-2xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-slate-50/70 hover:bg-slate-100/90 text-slate-700 border-slate-200/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : item.color}`} />
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="mt-2.5">
                        <span className="block text-xs font-black tracking-tight">{item.label}</span>
                        <span className={`block text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                          {item.sub}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Timeframe Parameters & Generation Bar */}
            <div className="bg-slate-50/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Step 2: Customize Parameters for {reportPeriodType.toUpperCase()} Report</span>
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Daily Input */}
                  {reportPeriodType === 'daily' && (
                    <div className="flex-1 min-w-[200px]">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Calendar Date</span>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  )}

                  {/* Weekly Inputs */}
                  {reportPeriodType === 'weekly' && (
                    <>
                      <div className="min-w-[130px]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Fiscal Year</span>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                        </select>
                      </div>
                      <div className="min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Week Number</span>
                        <input
                          type="number"
                          min="1"
                          max="53"
                          value={reportWeek}
                          onChange={(e) => setReportWeek(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </>
                  )}

                  {/* Monthly Inputs */}
                  {reportPeriodType === 'monthly' && (
                    <>
                      <div className="min-w-[130px]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Fiscal Year</span>
                        <select
                          value={reportYear}
                          onChange={(e) => setReportYear(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                        </select>
                      </div>
                      <div className="min-w-[160px]">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">Select Month</span>
                        <select
                          value={reportMonth}
                          onChange={(e) => setReportMonth(Number(e.target.value))}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                          ].map((name, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1} - {name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Yearly Inputs */}
                  {reportPeriodType === 'yearly' && (
                    <div className="min-w-[160px]">
                      <span className="text-[10px] font-bold text-slate-400 block mb-1">Fiscal Year</span>
                      <select
                        value={reportYear}
                        onChange={(e) => setReportYear(Number(e.target.value))}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                        <option value="2027">2027</option>
                      </select>
                    </div>
                  )}

                  {/* Lifetime Info */}
                  {reportPeriodType === 'all' && (
                    <div className="py-2 text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Aggregating lifetime customer purchases and financial records.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Current Scope */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 md:pt-0">
                {reportData && (
                  <div className="text-left sm:text-right hidden xl:block">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Loaded Scope</span>
                    <span className="text-xs font-black text-emerald-800 font-mono">
                      {reportData.periodLabel}
                    </span>
                  </div>
                )}

                <button
                  onClick={() => handleGenerateUnifiedReport()}
                  disabled={generatingReport}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingReport ? 'animate-spin' : ''}`} />
                  <span>{generatingReport ? 'Generating Report...' : 'Generate Statement'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* SECTION QUICK-VIEW FILTER BAR (EXCLUDED FROM PRINT)             */}
          {/* =============================================================== */}
          {reportData && (
            <div className="no-print bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 px-1">
                  View Section:
                </span>
                <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                  <button
                    onClick={() => setReportSectionFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      reportSectionFilter === 'all'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Sections (Complete)
                  </button>
                  <button
                    onClick={() => setReportSectionFilter('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      reportSectionFilter === 'summary'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Financial Ledger
                  </button>
                  <button
                    onClick={() => setReportSectionFilter('trends')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      reportSectionFilter === 'trends'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sales Trends
                  </button>
                  <button
                    onClick={() => setReportSectionFilter('products')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      reportSectionFilter === 'products'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top Selling Products
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs pr-1">
                <span className="text-slate-400 font-medium">Audit Timeframe:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {reportData.periodLabel}
                </span>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* PRINTABLE OFFICIAL EXECUTIVE STATEMENT                          */}
          {/* =============================================================== */}
          {reportData && (
            <div id="printable-monthly-report" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-8">
              
              {/* Document Header */}
              <div className="border-b-2 border-slate-200 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      SM
                    </span>
                    <span className="text-base font-black text-slate-900 uppercase tracking-wider">
                      SUPERMART ONLINE GROCERY & SUPERMARKET
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1.5">
                    Official Executive Sales & Financial Audit Statement
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Audit Period: <span className="font-bold text-emerald-700">{reportData.periodLabel}</span> • Database-Audited Financial Ledger
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Statement Reference</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    SM-REP-{reportPeriodType.toUpperCase()}-{reportYear}
                    {reportPeriodType === 'monthly' ? `-${String(reportMonth).padStart(2, '0')}` : ''}
                    {reportPeriodType === 'weekly' ? `-W${reportWeek}` : ''}
                    {reportPeriodType === 'daily' ? `-${reportDate}` : ''}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Timeframe: <span className="font-semibold text-slate-800">{reportData.periodLabel}</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Issued: {new Date().toLocaleDateString()} • Authorized Admin: <span className="font-semibold text-slate-700">{user.username}</span>
                  </div>
                </div>
              </div>

              {/* 5-Card Executive Financial Summary with Distinct System Themes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* 1. Completed Orders Card (Indigo/Blue Theme) */}
                <div className="printable-card p-4 rounded-2xl bg-linear-to-br from-indigo-50/70 via-white to-blue-50/40 border border-indigo-200/80 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider bg-indigo-100/70 px-2 py-0.5 rounded-md">
                      Orders Fulfilled
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-indigo-950 block font-mono">
                      {reportData.summary?.total_orders || 0}
                    </span>
                    <span className="text-[10px] text-indigo-600/80 block mt-0.5">
                      Completed non-cancelled orders
                    </span>
                  </div>
                </div>

                {/* 2. Gross Catalog Value Card (Sky/Slate Theme) */}
                <div className="printable-card p-4 rounded-2xl bg-linear-to-br from-sky-50/70 via-white to-slate-50 border border-sky-200/80 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider bg-sky-100/70 px-2 py-0.5 rounded-md">
                      Gross GMV
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-black text-slate-900 block font-mono">
                      Rs. {Number(reportData.summary?.total_subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Pre-discount retail subtotals
                    </span>
                  </div>
                </div>

                {/* 3. Inventory Base Cost (COGS) Card */}
                <div className="printable-card p-4 rounded-2xl bg-linear-to-br from-slate-50 via-white to-slate-100 border border-slate-300 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-700 font-bold uppercase tracking-wider bg-slate-200 px-2 py-0.5 rounded-md">
                      Inventory Cost (COGS)
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-black text-slate-800 block font-mono">
                      - Rs. {Number(reportData.summary?.total_cogs || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Wholesale supplier base cost
                    </span>
                  </div>
                </div>

                {/* 4. Net Realized Inflow Card */}
                <div className="printable-card p-4 rounded-2xl bg-linear-to-br from-blue-50/60 via-white to-indigo-50/30 border border-blue-200 shadow-2xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-blue-800 font-bold uppercase tracking-wider bg-blue-100 px-2 py-0.5 rounded-md">
                      Net Revenue Inflow
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-xl font-black text-blue-950 block font-mono">
                      Rs. {Number(reportData.summary?.net_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-blue-600 font-medium block mt-0.5">
                      Customer collections
                    </span>
                  </div>
                </div>

                {/* 5. Net Realized Profit Card (Primary Highlight) */}
                <div className="printable-card p-4 rounded-2xl bg-linear-to-br from-emerald-50 via-teal-50/50 to-white border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-emerald-900 font-extrabold uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded-md">
                      Net Operating Profit
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black text-emerald-950 block font-mono">
                      Rs. {Number(reportData.summary?.net_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-extrabold block mt-0.5">
                      {Number(reportData.summary?.net_revenue) > 0 ? (((Number(reportData.summary?.net_profit || 0)) / Number(reportData.summary?.net_revenue)) * 100).toFixed(1) + '% profit margin' : 'Net profit margin'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Sales Performance Trend (Printable Bar Chart) */}
              <div className={`printable-card bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 space-y-5 ${(reportSectionFilter === 'all' || reportSectionFilter === 'trends') ? 'block' : 'hidden print-force-block'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                        Sales Performance Trend & Periodic Volume
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Periodic progression across intervals ({reportData.trends?.length || 0} recorded intervals)
                      </span>
                    </div>
                  </div>

                  <div className="no-print inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold border border-slate-200">
                    <button
                      onClick={() => setDailySalesMetric('revenue')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        dailySalesMetric === 'revenue' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Revenue (Rs.)
                    </button>
                    <button
                      onClick={() => setDailySalesMetric('orders')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        dailySalesMetric === 'orders' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Orders Count
                    </button>
                  </div>
                </div>

                {/* Printable Trend Bar Chart */}
                {reportData.trends && reportData.trends.length > 0 ? (
                  <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/80">
                    {(() => {
                      const maxVal = Math.max(
                        ...reportData.trends.map(d =>
                          dailySalesMetric === 'revenue'
                            ? Number(d.totalRevenue ?? d.revenue ?? 0)
                            : Number(d.totalOrders ?? d.orders ?? 0)
                        ),
                        1
                      );

                      return (
                        <div className="space-y-4">
                          <div className="h-52 flex items-end justify-around gap-2 pt-6 px-2 border-b border-slate-200">
                            {reportData.trends.map((d, i) => {
                              const val = dailySalesMetric === 'revenue'
                                ? Number(d.totalRevenue ?? d.revenue ?? 0)
                                : Number(d.totalOrders ?? d.orders ?? 0);
                              const heightPct = Math.max((val / maxVal) * 100, 10);
                              const label = d.salesDate || d.date || '';

                              return (
                                <div
                                  key={i}
                                  className="flex-1 flex flex-col items-center h-full justify-end max-w-[90px] group relative"
                                >
                                  {/* Visible Value on Top of Bar */}
                                  <span className="text-[10px] font-bold text-slate-800 block mb-1 font-mono text-center truncate max-w-full">
                                    {dailySalesMetric === 'revenue'
                                      ? `Rs. ${Number(val).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                                      : `${val} orders`}
                                  </span>

                                  {/* Bar element */}
                                  <div
                                    style={{
                                      height: `${heightPct}%`,
                                      minHeight: '14px',
                                      backgroundColor: val > 0 ? '#059669' : '#cbd5e1',
                                    }}
                                    className={`w-full max-w-[56px] rounded-t-lg transition-all border border-emerald-700/30 trend-bar ${
                                      val > 0 ? 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs' : 'bg-slate-300'
                                    }`}
                                  />

                                  {/* Date label underneath */}
                                  <span className="text-[10px] font-bold text-slate-600 mt-2 block font-mono text-center truncate max-w-full">
                                    {label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                            <span>Showing {reportData.trends.length} recorded period entries</span>
                            <span className="font-semibold text-slate-600">Metric: {dailySalesMetric === 'revenue' ? 'Sales Revenue (Rs.)' : 'Order Volume (Count)'}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400">
                    No sales trend activity recorded for this period.
                  </div>
                )}
              </div>

              {/* SECTION 2: Top Selling Supermarket Products (Standard Supermarket Table) */}
              <div className={`printable-card rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs ${(reportSectionFilter === 'all' || reportSectionFilter === 'products') ? 'block' : 'hidden print-force-block'}`}>
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center space-x-2">
                        <span>Top Selling Supermarket Products ({reportData.periodLabel})</span>
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Ranked by realized customer sales volume & demand
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto uppercase tracking-wider">
                    Official Stock Audit
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-slate-200 text-slate-500 bg-slate-50/50 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4 w-14 text-center">Rank</th>
                        <th className="py-3 px-4">Product Description</th>
                        <th className="py-3 px-4">Category & Brand</th>
                        <th className="py-3 px-4 text-center">Units Sold</th>
                        <th className="py-3 px-4 text-right">Gross Sales Volume</th>
                        <th className="py-3 px-4 text-right">Net Profit (Margin)</th>
                        <th className="py-3 px-4 text-right no-print">Breakdown</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {((reportData.topSelling && reportData.topSelling.length > 0) ? reportData.topSelling : topSelling).slice(0, 10).map((t, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black ${
                              idx === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                              idx === 1 ? 'bg-slate-200 text-slate-800' :
                              idx === 2 ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {t.productName}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md font-semibold mr-1.5 border border-emerald-100">
                              {t.categoryName || 'General'}
                            </span>
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                              {t.brandName || 'SuperMart'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-800 font-mono">
                            {t.totalQuantitySold || t.quantitySold || 0} pcs
                          </td>
                          <td className="py-3 px-4 text-right font-black text-slate-900 font-mono">
                            Rs. {Number(t.totalSalesRevenue || t.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-emerald-800 font-mono">
                            <div>Rs. {Number(t.totalProfit || (Number(t.totalSalesRevenue || t.totalRevenue || 0) * 0.25)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <span className="text-[10px] text-emerald-600 font-bold">
                              {Number(t.totalSalesRevenue || t.totalRevenue || 0) > 0 ? (((Number(t.totalProfit || (Number(t.totalSalesRevenue || t.totalRevenue || 0) * 0.25))) / Number(t.totalSalesRevenue || t.totalRevenue || 1)) * 100).toFixed(1) + '% margin' : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right no-print">
                            <button
                              onClick={() => handleOpenProductSales(t)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center space-x-1.5 cursor-pointer transition shadow-xs hover:shadow-sm"
                              title={`View day-by-day sales for ${t.productName}`}
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-emerald-100" />
                              <span>Daily Sales</span>
                            </button>
                          </td>
                        </tr>
                      ))}

                      {(!reportData.topSelling || reportData.topSelling.length === 0) && topSelling.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-xs text-slate-400">
                            No product sales recorded in this timeframe.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 3: Financial Reconciliation Ledger Statement */}
              <div className={`printable-card rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs ${(reportSectionFilter === 'all' || reportSectionFilter === 'summary') ? 'block' : 'hidden print-force-block'}`}>
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Official Financial Reconciliation Ledger
                    </h4>
                    <span className="text-[10px] text-slate-400">Database-verified double-entry transaction record</span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500">
                    Currency: LKR (Rs.)
                  </span>
                </div>

                <table className="w-full text-xs text-left">
                  <thead className="border-b border-slate-200 text-slate-500 bg-white font-semibold text-[10px] uppercase">
                    <tr>
                      <th className="py-3 px-4">Ledger Line Item</th>
                      <th className="py-3 px-4 text-center">Accounting Impact</th>
                      <th className="py-3 px-4 text-right">Amount (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        Gross Merchandise Value (GMV - Product Catalog Subtotals)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          (+) Base Revenue
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        Rs. {Number(reportData.summary?.total_subtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-amber-800">
                        Less: Coupon & Promotional Discounts Deductions
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          (-) Deduction
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-700">
                        - Rs. {Number(reportData.summary?.total_discounts || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-blue-800">
                        Plus: Standard & Distance Delivery Charges Collected
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          (+) Logistics Income
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-700">
                        + Rs. {Number(reportData.summary?.total_delivery_fees || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        Less: Inventory Cost of Goods Sold (Wholesale Base Cost)
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          (-) Inventory Cost
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                        - Rs. {Number(reportData.summary?.total_cogs || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/80 border-t-2 border-emerald-500">
                      <td className="py-4 px-4 font-black text-emerald-950 text-sm">
                        NET REALIZED REVENUE (Total Collected Income)
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-600 text-white font-black px-3 py-1 rounded-full text-[10px]">
                          (=) Net Inflow
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-950 text-base">
                        Rs. {Number(reportData.summary?.net_revenue || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-100/90 border-t-2 border-emerald-600">
                      <td className="py-4 px-4 font-black text-emerald-950 text-sm">
                        NET OPERATING PROFIT (Net Inflow Less Inventory Base Costs)
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="bg-emerald-700 text-white font-black px-3 py-1 rounded-full text-[10px]">
                          (=) Net Profit
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono font-black text-emerald-950 text-base">
                        Rs. {Number(reportData.summary?.net_profit || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* SECTION 4: Itemized Periodic Breakdown Table */}
              {reportData.trends && reportData.trends.length > 0 && (
                <div className={`printable-card rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs ${(reportSectionFilter === 'all' || reportSectionFilter === 'trends') ? 'block' : 'hidden print-force-block'}`}>
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Itemized Periodic Breakdown Table ({reportData.periodLabel})
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Total interval records: {reportData.trends.length}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Interval / Date</th>
                          <th className="py-3 px-4 text-center">Completed Orders</th>
                          <th className="py-3 px-4 text-right">Gross GMV</th>
                          <th className="py-3 px-4 text-right">Discounts</th>
                          <th className="py-3 px-4 text-right">Delivery Fees</th>
                          <th className="py-3 px-4 text-right">Net Revenue</th>
                          <th className="py-3 px-4 text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {reportData.trends.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{d.salesDate || d.date}</td>
                            <td className="py-2.5 px-4 text-center font-bold">{d.totalOrders ?? d.orders ?? 0}</td>
                            <td className="py-2.5 px-4 text-right font-mono">Rs. {Number(d.grossSubtotal ?? d.gross ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-amber-700">- Rs. {Number(d.totalDiscountsGiven ?? d.discounts ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-mono text-blue-700">+ Rs. {Number(d.totalDeliveryCollected ?? d.delivery ?? 0).toFixed(2)}</td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                              Rs. {Number(d.totalRevenue ?? d.revenue ?? 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-700">
                              Rs. {Number(d.totalProfit ?? (Number(d.totalRevenue ?? 0) * 0.25)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                        <tr>
                          <td className="py-3 px-4 text-slate-900 uppercase font-black">Total Period Summary</td>
                          <td className="py-3 px-4 text-center text-slate-900">{reportData.summary?.total_orders || 0}</td>
                          <td className="py-3 px-4 text-right font-mono">Rs. {Number(reportData.summary?.total_subtotal || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-amber-700">- Rs. {Number(reportData.summary?.total_discounts || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono text-blue-700">+ Rs. {Number(reportData.summary?.total_delivery_fees || 0).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                            Rs. {Number(reportData.summary?.net_revenue || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-emerald-700">
                            Rs. {Number(reportData.summary?.net_profit || 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 5: Official Admin Certification & Signature Section */}
              <div className={`printable-card border-t-2 border-slate-200 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600 ${(reportSectionFilter === 'all' || reportSectionFilter === 'summary') ? 'block' : 'hidden print-force-block'}`}>
                {/* 1. Generated by Admin */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Generated & Certified By
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {user.username}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Master Administrator • Super Administrator
                  </div>
                  <div className="text-[10px] text-slate-400">
                    SuperMart Store Management System • System Audited Ledger
                  </div>
                </div>

                {/* 2. Admin Signature Section */}
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-3">
                      Administrator Signature & Authorization
                    </span>
                    <div className="h-12 border-b-2 border-dashed border-slate-400 flex items-end justify-between pb-1 px-1">
                      <span className="text-[10px] text-slate-400 italic">Signature: _______________________</span>
                      <span className="text-[10px] text-slate-400 font-mono">Date: ____ / ____ / ________</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-2 pt-1">
                    <span>Authorized Official Admin Sign-off</span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      Official Seal
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =============================================================== */}
          {/* DEDICATED PRINTABLE PRODUCT DAILY SALES REPORT (PRINT ONLY)     */}
          {/* =============================================================== */}
          {selectedProduct && (
            <div id="printable-product-sales-report" className="hidden print-product-report bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {/* Printable Header */}
              <div className="border-b-2 border-slate-200 pb-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                      SM
                    </span>
                    <span className="text-base font-black text-slate-900 uppercase tracking-wider">
                      SUPERMART ONLINE GROCERY & SUPERMARKET
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1.5">
                    Official Product Sales Demand & Daily Breakdown Report
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Product: <span className="font-bold text-slate-900">{selectedProduct.productName}</span> (ID #{selectedProduct.productId}) • Category: {selectedProduct.categoryName || 'General'} • Brand: {selectedProduct.brandName || 'SuperMart'}
                  </p>
                </div>

                <div className="text-right text-xs space-y-0.5">
                  <div className="text-slate-400 font-semibold uppercase text-[10px]">Audit Reference</div>
                  <div className="font-mono font-black text-slate-900 text-sm">
                    SM-PROD-{selectedProduct.productId}-{productTimeRange.toUpperCase()}
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Scope: <span className="font-semibold text-slate-800">{productTimeRange.toUpperCase()} ({productChartMetric.toUpperCase()})</span>
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    Issued: {new Date().toLocaleDateString()} • Authorized Admin: <span className="font-semibold text-slate-700">{user.username}</span>
                  </div>
                </div>
              </div>

              {/* 5 Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">Units Sold</span>
                  <span className="text-xl font-black text-indigo-950 block mt-1 font-mono">
                    {selectedProduct.totalQuantitySold} units
                  </span>
                  <span className="text-[10px] text-indigo-600">Total verified sold</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">Gross Revenue</span>
                  <span className="text-xl font-black text-emerald-950 block mt-1 font-mono">
                    Rs. {Number(selectedProduct.totalSalesRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">Total gross volume</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-50/80 border-2 border-purple-400">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-800 font-bold uppercase tracking-wider block">Realized Profit</span>
                    <span className="text-[9px] font-black bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-md">
                      {Number(selectedProduct.totalSalesRevenue || 0) > 0
                        ? `${((Number(selectedProduct.totalProfit || 0) / Number(selectedProduct.totalSalesRevenue)) * 100).toFixed(1)}%`
                        : '0%'}
                    </span>
                  </div>
                  <span className="text-xl font-black text-purple-950 block mt-1 font-mono">
                    Rs. {Number(selectedProduct.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-purple-700 font-semibold">Net profit margin</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Selling Days</span>
                  <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
                    {productDailySales.length} day{productDailySales.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-[10px] text-slate-400">Confirmed purchase dates</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-200">
                  <span className="text-[10px] text-sky-800 font-bold uppercase tracking-wider block">Avg Daily Revenue</span>
                  <span className="text-xl font-black text-sky-950 block mt-1 font-mono">
                    Rs. {productDailySales.length > 0
                      ? (productDailySales.reduce((acc, d) => acc + Number(d.totalSalesRevenue || 0), 0) / productDailySales.length).toFixed(2)
                      : '0.00'}
                  </span>
                  <span className="text-[10px] text-sky-600">Per selling day avg</span>
                </div>
              </div>

              {/* Periodic Progression Bar Chart */}
              {(() => {
                const processed = getProcessedProductSales();
                const maxVal = Math.max(
                  ...processed.map(d =>
                    productChartMetric === 'revenue'
                      ? Number(d.totalSalesRevenue || 0)
                      : productChartMetric === 'profit'
                        ? Number(d.totalProfit || 0)
                        : Number(d.totalQuantitySold || 0)
                  ),
                  1
                );

                return (
                  <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/70 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Product Sales Progression & Demand Trend ({productTimeRange.toUpperCase()})
                      </span>
                      <span className="text-[11px] font-semibold text-slate-600">
                        Metric: {productChartMetric === 'revenue' ? 'Gross Revenue (Rs.)' : productChartMetric === 'profit' ? 'Net Profit (Rs.)' : 'Units Sold'}
                      </span>
                    </div>

                    <div className="h-48 flex items-end justify-around gap-2 pt-6 px-2 border-b border-slate-200">
                      {processed.map((d, idx) => {
                        const val = productChartMetric === 'revenue'
                          ? Number(d.totalSalesRevenue || 0)
                          : productChartMetric === 'profit'
                            ? Number(d.totalProfit || 0)
                            : Number(d.totalQuantitySold || 0);
                        const heightPct = Math.max((val / maxVal) * 100, 10);

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end max-w-[80px]">
                            <span className="text-[10px] font-bold text-slate-800 block mb-1 font-mono text-center truncate max-w-full">
                              {val > 0 ? (productChartMetric === 'revenue' || productChartMetric === 'profit' ? `Rs.${val.toFixed(0)}` : `${val}`) : '0'}
                            </span>
                            <div
                              style={{
                                height: `${heightPct}%`,
                                minHeight: '12px',
                                backgroundColor: val > 0
                                  ? (productChartMetric === 'revenue' ? '#059669' : productChartMetric === 'profit' ? '#7c3aed' : '#2563eb')
                                  : '#cbd5e1',
                              }}
                              className="w-full max-w-[48px] rounded-t-lg border border-slate-400/30"
                            />
                            <span className="text-[10px] font-bold text-slate-600 mt-2 block font-mono text-center truncate max-w-full">
                              {d.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      Showing {processed.length} recorded periodic intervals for {selectedProduct.productName}
                    </div>
                  </div>
                );
              })()}

              {/* Itemized Periodic Table */}
              {(() => {
                const processed = getProcessedProductSales();
                return (
                  <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Itemized Daily Breakdown Table
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                        Database Ledger Verified
                      </span>
                    </div>

                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-slate-200 text-slate-500 bg-slate-50/50 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4">Sales Date / Period</th>
                          <th className="py-2.5 px-4 text-center">Customer Orders</th>
                          <th className="py-2.5 px-4 text-center">Units Sold</th>
                          <th className="py-2.5 px-4 text-right">Gross Revenue</th>
                          <th className="py-2.5 px-4 text-right">Net Profit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                        {processed.map((d, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{d.periodLabel}</td>
                            <td className="py-2.5 px-4 text-center font-semibold">{d.orderCount} order(s)</td>
                            <td className="py-2.5 px-4 text-center font-bold text-blue-700 font-mono">{d.totalQuantitySold} pcs</td>
                            <td className="py-2.5 px-4 text-right font-black text-slate-900 font-mono">
                              Rs. {Number(d.totalSalesRevenue).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-black text-purple-700 font-mono">
                              Rs. {Number(d.totalProfit || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs">
                        <tr>
                          <td className="py-2.5 px-4 uppercase font-black text-slate-900">Total Period Summary</td>
                          <td className="py-2.5 px-4 text-center text-slate-900">
                            {processed.reduce((acc, d) => acc + Number(d.orderCount || 0), 0)} orders
                          </td>
                          <td className="py-2.5 px-4 text-center text-blue-700 font-mono">
                            {processed.reduce((acc, d) => acc + Number(d.totalQuantitySold || 0), 0)} pcs
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-emerald-800 font-mono">
                            Rs. {processed.reduce((acc, d) => acc + Number(d.totalSalesRevenue || 0), 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-purple-800 font-mono">
                            Rs. {processed.reduce((acc, d) => acc + Number(d.totalProfit || 0), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}

              {/* Bottom 2 Sections: Generated by Admin and Admin Signature */}
              <div className="printable-card border-t-2 border-slate-200 pt-6 mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-600">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                      Generated & Certified By
                    </span>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {user.username}
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Master Administrator • Product Sales Audit
                  </div>
                  <div className="text-[10px] text-slate-400">
                    SuperMart Store Management System • Official Inventory Ledger
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block mb-3">
                      Administrator Signature & Authorization
                    </span>
                    <div className="h-12 border-b-2 border-dashed border-slate-400 flex items-end justify-between pb-1 px-1">
                      <span className="text-[10px] text-slate-400 italic">Signature: _______________________</span>
                      <span className="text-[10px] text-slate-400 font-mono">Date: ____ / ____ / ________</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-semibold mt-2 pt-1">
                    <span>Authorized Official Admin Sign-off</span>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      Official Seal
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: OPERATIONAL MANAGERS MANAGEMENT                              */}
      {/* =================================================================== */}
      {activeTab === 'managers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-900">Operational Managers</h3>
              <p className="text-xs text-slate-500">
                Admin can add operational managers. The mobile number automatically becomes their system username.
              </p>
            </div>

            <button
              onClick={() => setShowAddManagerModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Operational Manager</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Username (Mobile)</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">NIC Number</th>
                  <th className="py-3 px-4">Gender</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {managers.map((m) => (
                  <tr key={m.userId} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.firstName} {m.lastName}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">{m.username}</td>
                    <td className="py-3 px-4">{m.email}</td>
                    <td className="py-3 px-4 font-mono">{m.nicNumber || 'N/A'}</td>
                    <td className="py-3 px-4">{m.gender || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                      }`}>
                        {m.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleManager(m.userId, m.isActive)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-[11px] font-semibold text-slate-700"
                      >
                        {m.isActive ? 'Disable' : 'Enable'}
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
      {/* TAB 3: SYSTEM AUDIT TRAIL                                           */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (() => {
        const insertCount = auditLogs.filter(l => l.actionType === 'INSERT').length;
        const updateCount = auditLogs.filter(l => l.actionType === 'UPDATE').length;
        const checkoutCount = auditLogs.filter(l => l.actionType === 'CHECKOUT').length;
        const otherCount = auditLogs.filter(l => !['INSERT', 'UPDATE', 'CHECKOUT'].includes(l.actionType)).length;

        const filteredLogs = auditLogs.filter(log => {
          const matchesAction = auditActionFilter === 'ALL'
            ? true
            : auditActionFilter === 'OTHER'
              ? !['INSERT', 'UPDATE', 'CHECKOUT'].includes(log.actionType)
              : log.actionType === auditActionFilter;

          const q = auditSearchQuery.trim().toLowerCase();
          const matchesQuery = !q || 
            String(log.logId).toLowerCase().includes(q) ||
            String(log.tableName || '').toLowerCase().includes(q) ||
            String(log.actionType || '').toLowerCase().includes(q) ||
            String(log.recordId || '').toLowerCase().includes(q) ||
            String(log.details || '').toLowerCase().includes(q) ||
            String(log.performedBy || '').toLowerCase().includes(q) ||
            String(log.userRole || '').toLowerCase().includes(q);
          return matchesAction && matchesQuery;
        });

        // Pagination & Recent 25 Limit Handling
        const pageSize = auditLimitMode === 'ALL' ? (filteredLogs.length || 1) : parseInt(auditLimitMode, 10);
        const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
        const safePage = Math.min(Math.max(1, auditPage), totalPages);
        const displayedLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize);

        // Accurate local date and time formatting (avoids timezone skew)
        const formatAuditDateTime = (raw) => {
          if (!raw) return { dateStr: '-', timeStr: '' };
          const clean = String(raw).replace('T', ' ').replace('Z', '').split('.')[0];
          const parts = clean.split(' ');
          const dateStr = parts[0];
          if (parts[1]) {
            const [h, m, s] = parts[1].split(':');
            let hour = parseInt(h, 10);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            hour = hour % 12 || 12;
            const timeStr = `${String(hour).padStart(2, '0')}:${m}:${s} ${ampm}`;
            return { dateStr, timeStr };
          }
          return { dateStr, timeStr: '' };
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                      Security Ledger
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {formatCompactCount(auditLogs.length)} Active Records
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mt-1">
                    System Audit Trail & Security Logs
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated event logging for data integrity, administrative operations, price modifications, and checkout actions.
                  </p>
                </div>
              </div>

              <button
                onClick={loadData}
                disabled={loading}
                className="self-start md:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            {/* 4 Stat Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Total Audit Records</span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-slate-900 block font-mono">{formatCompactCount(auditLogs.length)}</span>
                  <span className="text-[10px] text-slate-400">Active rolling ledger • 180-day retention</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">Record Inserts</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-emerald-900 block font-mono">{formatCompactCount(insertCount)}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">New accounts & records</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-amber-700 tracking-wider">Modifications</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-amber-900 block font-mono">{formatCompactCount(updateCount)}</span>
                  <span className="text-[10px] text-amber-600 font-semibold">Price & record updates</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-100 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Checkouts & Orders</span>
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="mt-2.5">
                  <span className="text-2xl font-black text-purple-900 block font-mono">{formatCompactCount(checkoutCount)}</span>
                  <span className="text-[10px] text-purple-600 font-semibold">Customer checkout actions</span>
                </div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Action Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 flex items-center">
                  <Filter className="w-3 h-3 mr-1 text-slate-400" />
                  Action:
                </span>
                {[
                  { id: 'ALL', label: 'All Actions', count: auditLogs.length },
                  { id: 'INSERT', label: 'INSERT', count: insertCount },
                  { id: 'UPDATE', label: 'UPDATE', count: updateCount },
                  { id: 'CHECKOUT', label: 'CHECKOUT', count: checkoutCount },
                  ...(otherCount > 0 ? [{ id: 'OTHER', label: 'OTHER (SYSTEM)', count: otherCount }] : [])
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setAuditActionFilter(item.id);
                      setAuditPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      auditActionFilter === item.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      auditActionFilter === item.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Box & Display Limit Selector */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Display Range Selector */}
                <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1.5">
                    Show:
                  </span>
                  {[
                    { id: '25', label: 'Recent 25' },
                    { id: '50', label: '50' },
                    { id: 'ALL', label: 'All' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setAuditLimitMode(opt.id);
                        setAuditPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        auditLimitMode === opt.id
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="relative flex-1 sm:w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => {
                      setAuditSearchQuery(e.target.value);
                      setAuditPage(1);
                    }}
                    placeholder="Search details, actor, tables..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                  />
                  {auditSearchQuery && (
                    <button
                      onClick={() => {
                        setAuditSearchQuery('');
                        setAuditPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {(auditActionFilter !== 'ALL' || auditSearchQuery) && (
                  <button
                    onClick={() => {
                      setAuditActionFilter('ALL');
                      setAuditSearchQuery('');
                      setAuditPage(1);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-24">Log ID</th>
                      <th className="py-3 px-4 w-44">Date & Time</th>
                      <th className="py-3 px-4 w-32 text-center">Action Type</th>
                      <th className="py-3 px-4 w-28">Target Table</th>
                      <th className="py-3 px-4 w-24">Record ID</th>
                      <th className="py-3 px-4">Audit Event Details & Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayedLogs.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-slate-400">
                          <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-700 text-xs">No audit logs found</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {auditSearchQuery || auditActionFilter !== 'ALL'
                              ? 'Try adjusting your search query or filter selection'
                              : 'No system audit trail entries recorded yet'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      displayedLogs.map((log) => {
                        const { dateStr, timeStr } = formatAuditDateTime(log.createdAt);

                        return (
                          <tr key={log.logId} className="hover:bg-slate-50/80 transition-colors">
                            {/* Log ID */}
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                #{log.logId}
                              </span>
                            </td>

                            {/* Timestamp */}
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-900 font-mono text-xs">{dateStr}</span>
                                {timeStr && (
                                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 flex items-center">
                                    <Clock className="w-3 h-3 mr-1 text-slate-400 shrink-0" />
                                    {timeStr}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Action Type */}
                            <td className="py-3 px-4 text-center">
                              {log.actionType === 'INSERT' ? (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                  <span>INSERT</span>
                                </span>
                              ) : log.actionType === 'UPDATE' ? (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                  <span>UPDATE</span>
                                </span>
                              ) : log.actionType === 'CHECKOUT' ? (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                  <span>CHECKOUT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                  <span>{log.actionType}</span>
                                </span>
                              )}
                            </td>

                            {/* Table */}
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                                {log.tableName}
                              </span>
                            </td>

                            {/* Record ID */}
                            <td className="py-3 px-4">
                              {log.recordId ? (
                                <span className="font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/70 text-[11px]">
                                  #{log.recordId}
                                </span>
                              ) : (
                                <span className="text-slate-300 font-mono">-</span>
                              )}
                            </td>

                            {/* Details & Performed By */}
                            <td className="py-3 px-4">
                              <div className="space-y-1.5">
                                <p className="text-slate-900 font-sans text-xs leading-relaxed font-medium">
                                  {log.details}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                  <span className="font-semibold text-slate-400">Performed By:</span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-800 border border-slate-200">
                                    <UserCheck className="w-3 h-3 mr-1 text-slate-500 shrink-0" />
                                    {log.performedBy || (log.userId ? `User #${log.userId}` : 'System Engine')}
                                  </span>
                                  {log.userRole && (
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider ${
                                      log.userRole === 'ROLE_ADMIN' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                      log.userRole === 'ROLE_MANAGER' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                                      log.userRole === 'ROLE_CUSTOMER' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                      'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}>
                                      {log.userRole.replace('ROLE_', '')}
                                    </span>
                                  )}
                                  {log.userId ? (
                                    <span className="text-[10px] font-mono text-slate-400">
                                      (User ID: #{log.userId})
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-slate-400">
                                      (Automated MySQL Event)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination Controls */}
              <div className="bg-slate-50/80 px-5 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center space-x-2">
                  <span>
                    Showing <strong className="text-slate-900 font-mono">{displayedLogs.length}</strong> of{' '}
                    <strong className="text-slate-900 font-mono">{filteredLogs.length}</strong> records
                    {auditLimitMode === '25' && ' (Recent 25 items)'}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-medium text-slate-400 flex items-center">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
                    Immutable Audit Ledger
                  </span>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && auditLimitMode !== 'ALL' && (
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setAuditPage(prev => Math.max(1, prev - 1))}
                      disabled={safePage <= 1}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center text-xs font-semibold cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                      Prev
                    </button>

                    <span className="px-2 py-0.5 text-xs font-bold text-slate-700 font-mono">
                      Page {safePage} of {totalPages}
                    </span>

                    <button
                      onClick={() => setAuditPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safePage >= totalPages}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center text-xs font-semibold cursor-pointer"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}



      {/* =================================================================== */}
      {/* MODAL: ADD OPERATIONAL MANAGER                                      */}
      {/* =================================================================== */}
      {showAddManagerModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Create Operational Manager
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                The mobile number automatically becomes their login username.
              </p>
            </div>

            {mgrError && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {mgrError}
              </div>
            )}

            {mgrSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                {mgrSuccess}
              </div>
            )}

            <form onSubmit={handleAddManagerSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunil"
                  value={mgrFirstName}
                  onChange={(e) => setMgrFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Perera"
                  value={mgrLastName}
                  onChange={(e) => setMgrLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Email *</label>
                <input
                  type="email"
                  required
                  placeholder="sunil.ops@supermart.com"
                  value={mgrEmail}
                  onChange={(e) => setMgrEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Mobile Phone * (10 Digits)</label>
                <input
                  type="text"
                  required
                  maxLength="10"
                  placeholder="0771234567"
                  value={mgrMobile}
                  onChange={(e) => setMgrMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900"
                />
              </div>

              {/* Auto-filled username preview */}
              <div>
                <label className="font-semibold text-slate-400 block mb-1">Assigned Username (Auto-fill)</label>
                <input
                  type="text"
                  disabled
                  value={mgrMobile || 'Enter mobile phone above'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-emerald-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">NIC Number * (9V or 12 digits)</label>
                <input
                  type="text"
                  required
                  placeholder="198512345678"
                  value={mgrNic}
                  onChange={(e) => setMgrNic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Gender *</label>
                <select
                  value={mgrGender}
                  onChange={(e) => setMgrGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 block mb-1">Initial Password * (Min 8 Chars)</label>
                <input
                  type="password"
                  required
                  minLength="8"
                  value={mgrPassword}
                  onChange={(e) => setMgrPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="sm:col-span-2 flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManagerModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-xs cursor-pointer"
                >
                  Create Manager
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PRODUCT SALES ANALYTICS (7 DAYS, WEEK, MONTH, ALL)           */}
      {/* =================================================================== */}
      {selectedProduct && (
        <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                    Product Sales Performance
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">ID #{selectedProduct.productId}</span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {selectedProduct.productName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Category: <span className="font-semibold text-slate-700">{selectedProduct.categoryName}</span> • Brand: <span className="font-semibold text-slate-700">{selectedProduct.brandName}</span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
                  title="Print product daily sales report"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Overall Stats Pills for this Product */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">All-time Sold</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {selectedProduct.totalQuantitySold} units
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-[10px] text-emerald-600 font-bold uppercase block">All-time Revenue</span>
                <span className="text-sm font-black text-emerald-800 block mt-0.5">
                  Rs. {Number(selectedProduct.totalSalesRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-purple-700 font-bold uppercase block">Net Profit</span>
                  <span className="text-[9px] font-black bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded">
                    {Number(selectedProduct.totalSalesRevenue || 0) > 0
                      ? `${((Number(selectedProduct.totalProfit || 0) / Number(selectedProduct.totalSalesRevenue)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
                <span className="text-sm font-black text-purple-950 block mt-0.5">
                  Rs. {Number(selectedProduct.totalProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Selling Days</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">
                  {productDailySales.length} day{productDailySales.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50/50 border border-blue-100">
                <span className="text-[10px] text-blue-600 font-bold uppercase block">Avg Daily Revenue</span>
                <span className="text-sm font-black text-blue-800 block mt-0.5">
                  Rs. {productDailySales.length > 0
                    ? (productDailySales.reduce((acc, d) => acc + Number(d.totalSalesRevenue || 0), 0) / productDailySales.length).toFixed(2)
                    : '0.00'}
                </span>
              </div>
            </div>

            {/* Content area: Loading or Data */}
            {productDailyLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Loading sales analytics from database...</span>
              </div>
            ) : productDailySales.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100 p-6">
                <ShoppingCart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No sales recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1">This product has not been purchased in any completed orders yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Filter Toolbar: Range & Metric */}
                <div className="no-print flex flex-wrap items-center justify-between gap-2.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                  {/* Time Range Filters */}
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-1 hidden sm:inline uppercase">Filter:</span>
                    <button
                      onClick={() => setProductTimeRange('7days')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productTimeRange === '7days' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => setProductTimeRange('week')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productTimeRange === 'week' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Week by Week
                    </button>
                    <button
                      onClick={() => setProductTimeRange('month')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productTimeRange === 'month' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      Month by Month
                    </button>
                    <button
                      onClick={() => setProductTimeRange('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        productTimeRange === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      All Recorded
                    </button>
                  </div>

                  {/* Metric Switcher */}
                  <div className="flex bg-slate-200/70 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setProductChartMetric('revenue')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        productChartMetric === 'revenue' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Revenue (Rs.)
                    </button>
                    <button
                      onClick={() => setProductChartMetric('profit')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        productChartMetric === 'profit' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Profit (Rs.)
                    </button>
                    <button
                      onClick={() => setProductChartMetric('quantity')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        productChartMetric === 'quantity' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Units Sold
                    </button>
                  </div>
                </div>

                {/* The Bar Chart */}
                {(() => {
                  const processed = getProcessedProductSales();
                  const maxVal = Math.max(
                    ...processed.map(d =>
                      productChartMetric === 'revenue'
                        ? Number(d.totalSalesRevenue || 0)
                        : productChartMetric === 'profit'
                          ? Number(d.totalProfit || 0)
                          : Number(d.totalQuantitySold || 0)
                    ),
                    1
                  );

                  return (
                    <div className="space-y-4">
                      <div className="h-56 flex items-end justify-around gap-2 pt-8 pb-3 px-4 bg-slate-50/70 border border-slate-100 rounded-2xl">
                        {processed.map((d, idx) => {
                          const val = productChartMetric === 'revenue'
                            ? Number(d.totalSalesRevenue || 0)
                            : productChartMetric === 'profit'
                              ? Number(d.totalProfit || 0)
                              : Number(d.totalQuantitySold || 0);
                          const heightPct = val > 0 ? Math.max((val / maxVal) * 100, 8) : 4;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative max-w-[80px]">
                              {/* Hover Tooltip */}
                              <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] rounded-xl px-2.5 py-1.5 pointer-events-none shadow-xl z-20 whitespace-nowrap text-center">
                                <span className="font-bold text-emerald-400 block">{d.periodLabel}</span>
                                <span>{d.totalQuantitySold} units • Rs. {Number(d.totalSalesRevenue).toLocaleString()} rev</span>
                                <span className="text-[10px] text-purple-300 font-semibold block">Profit: Rs. {Number(d.totalProfit || 0).toLocaleString()}</span>
                                <span className="text-[10px] text-slate-300 block">{d.orderCount} order(s)</span>
                              </div>

                              {/* Value label */}
                              <span className="text-[10px] font-bold text-slate-600 mb-1 truncate max-w-full">
                                {val > 0 ? (productChartMetric === 'revenue' || productChartMetric === 'profit' ? `Rs.${val >= 1000 ? (val/1000).toFixed(1) + 'k' : val.toFixed(0)}` : `${val}`) : '0'}
                              </span>

                              {/* Bar */}
                              <div
                                style={{ height: `${heightPct}%` }}
                                className={`w-full rounded-t-xl transition-all duration-300 shadow-xs cursor-pointer ${
                                  val === 0
                                    ? 'bg-slate-200'
                                    : productChartMetric === 'revenue'
                                      ? 'bg-linear-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300'
                                      : productChartMetric === 'profit'
                                        ? 'bg-linear-to-t from-purple-600 to-pink-500 group-hover:from-purple-500 group-hover:to-pink-400'
                                        : 'bg-linear-to-t from-blue-600 to-indigo-400 group-hover:from-blue-500 group-hover:to-indigo-300'
                                }`}
                              />

                              {/* Date underneath */}
                              <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-[70px]">
                                {d.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Period Breakdown Table */}
                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <tr>
                              <th className="py-2.5 px-3">
                                {productTimeRange === 'week' ? 'Week Period' : productTimeRange === 'month' ? 'Month Period' : 'Sales Date'}
                              </th>
                              <th className="py-2.5 px-3">Orders</th>
                              <th className="py-2.5 px-3 text-right">Units Sold</th>
                              <th className="py-2.5 px-3 text-right">Sales Revenue</th>
                              <th className="py-2.5 px-3 text-right">Net Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {processed.map((d, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70">
                                <td className="py-2 px-3 font-mono font-medium">{d.periodLabel}</td>
                                <td className="py-2 px-3 font-semibold">{d.orderCount} order(s)</td>
                                <td className="py-2 px-3 text-right font-bold text-blue-700">{d.totalQuantitySold}</td>
                                <td className="py-2 px-3 text-right font-black text-slate-900">
                                  Rs. {Number(d.totalSalesRevenue).toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right font-black text-purple-700">
                                  Rs. {Number(d.totalProfit || 0).toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 no-print">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print Product Report</span>
              </button>
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print-specific style for Executive Statements and Product Daily Sales Report */}
      <style>{`
        @media print {
          @page {
            size: portrait;
            margin: 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          body {
            background: white !important;
          }
          body * {
            visibility: hidden;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          .printable-card {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-force-block {
            display: block !important;
          }
          .print-only {
            display: block !important;
            visibility: visible !important;
          }
          .trend-bar {
            background-color: #059669 !important;
            border-color: #047857 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* TARGET 1: Print Executive Report (when modal is NOT open) */
          .print-target-executive #printable-product-sales-report {
            display: none !important;
            visibility: hidden !important;
          }
          .print-target-executive #printable-monthly-report,
          .print-target-executive #printable-monthly-report * {
            visibility: visible !important;
          }
          .print-target-executive #printable-monthly-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: #0f172a !important;
          }

          /* TARGET 2: Print Product Daily Sales Report (when modal IS open) */
          .print-target-product #printable-monthly-report {
            display: none !important;
            visibility: hidden !important;
          }
          .print-target-product #printable-product-sales-report,
          .print-target-product #printable-product-sales-report * {
            visibility: visible !important;
          }
          .print-target-product #printable-product-sales-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            overflow: visible !important;
          }
        }
      `}</style>

    </div>
  );
}
