import React, { useState, useEffect } from 'react';
import { 
  Users, BarChart3, Shield, FileText, Plus, RefreshCw, 
  DollarSign, ShoppingCart, UserCheck, AlertOctagon, TrendingUp, Calendar, CheckCircle2 
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

  // Monthly Report Generator
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [monthlyReportData, setMonthlyReportData] = useState(null);

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpiRes, dailyRes, topRes, mgrRes, auditRes] = await Promise.all([
        api.getKpis(),
        api.getDailySales(),
        api.getTopSelling(),
        api.getManagers(),
        api.getAuditLogs(60),
      ]);

      setKpis(kpiRes.data || {});
      setDailySales(dailyRes.data || []);
      setTopSelling(topRes.data || []);
      setManagers(mgrRes.data || []);
      setAuditLogs(auditRes.data || []);
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

      const res = await api.createManager(user.userId, payload);
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

  // Handle Generate Monthly Report
  const handleGenerateReport = async () => {
    try {
      const res = await api.getMonthlyReport(reportYear, reportMonth);
      if (res.data && res.data.length > 0) {
        setMonthlyReportData(res.data[0]);
      }
    } catch (err) {
      alert(err.message || 'Failed to generate report');
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
    <div className="space-y-8 pb-16">
      
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-black text-slate-900 mt-2">
            Rs. {Number(kpis.total_revenue || 0).toLocaleString()}
          </p>
          <span className="text-[10px] text-emerald-600 font-semibold">Net collections</span>
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
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <span>Analytics & Top Sellers</span>
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
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
            activeTab === 'monthly'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-400" />
          <span>Monthly Revenue Report</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ANALYTICS & TOP SELLING PRODUCTS                             */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Top Selling Products (From View: v_top_selling_products) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Selling Products</h3>
                <span className="text-[11px] text-slate-400">Queried from view <code>v_top_selling_products</code></span>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                By Revenue
              </span>
            </div>

            <div className="space-y-3">
              {topSelling.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{t.productName}</span>
                      <span className="text-[10px] text-slate-400">{t.categoryName} • {t.brandName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      Rs. {Number(t.totalSalesRevenue).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">
                      {t.totalQuantitySold} sold
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Daily Sales Trends (From View: v_daily_sales_summary) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Daily Sales Summary</h3>
                <span className="text-[11px] text-slate-400">Queried from view <code>v_daily_sales_summary</code></span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Orders</th>
                    <th className="py-2.5 px-3">Discounts</th>
                    <th className="py-2.5 px-3 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {dailySales.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3 font-mono">{d.salesDate}</td>
                      <td className="py-2.5 px-3 font-bold">{d.totalOrders}</td>
                      <td className="py-2.5 px-3 text-emerald-700">Rs. {Number(d.totalDiscountsGiven).toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        Rs. {Number(d.totalRevenue).toFixed(2)}
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
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Master Audit Logs</h3>
            <p className="text-xs text-slate-500">
              Live records generated by triggers (<code>trg_before_product_price_audit</code>, <code>trg_after_user_insert_audit</code>, <code>trg_after_order_status_update_audit</code>) and procedures.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider font-sans">
                  <tr>
                    <th className="py-3 px-4">Log ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Table</th>
                    <th className="py-3 px-4">Record ID</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {auditLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 text-slate-400">#{log.logId}</td>
                      <td className="py-2.5 px-4 text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          log.actionType === 'INSERT' ? 'bg-emerald-100 text-emerald-800' :
                          log.actionType === 'UPDATE' ? 'bg-amber-100 text-amber-800' :
                          log.actionType === 'CHECKOUT' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {log.actionType}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-800">{log.tableName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{log.recordId || '-'}</td>
                      <td className="py-2.5 px-4 text-slate-800 font-sans text-xs">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: MONTHLY EXECUTIVE REPORT                                     */}
      {/* =================================================================== */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Revenue Report Generator</h3>
            <p className="text-xs text-slate-500">
              Calls MySQL Stored Procedure <code>sp_generate_monthly_report</code> to calculate orders, gross subtotals, promotional discounts, and net earnings.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Year</label>
              <select
                value={reportYear}
                onChange={(e) => setReportYear(Number(e.target.value))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              >
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Month</label>
              <select
                value={reportMonth}
                onChange={(e) => setReportMonth(Number(e.target.value))}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Month {i + 1} ({new Date(0, i).toLocaleString('en', { month: 'long' })})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              className="mt-5 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
            >
              Generate Report
            </button>
          </div>

          {monthlyReportData && (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Report Output: Year {reportYear} - Month {reportMonth}
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Total Orders</span>
                  <span className="text-xl font-black text-slate-900">{monthlyReportData.total_orders}</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Gross Subtotal</span>
                  <span className="text-xl font-black text-slate-900">Rs. {Number(monthlyReportData.total_subtotal).toFixed(2)}</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Total Discounts Given</span>
                  <span className="text-xl font-black text-emerald-700">Rs. {Number(monthlyReportData.total_discounts).toFixed(2)}</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-semibold">Net Realized Revenue</span>
                  <span className="text-2xl font-black text-emerald-700">Rs. {Number(monthlyReportData.net_revenue).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

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
                The mobile number automatically becomes their login username. Calls procedure <code>sp_create_operational_manager</code>.
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

    </div>
  );
}
