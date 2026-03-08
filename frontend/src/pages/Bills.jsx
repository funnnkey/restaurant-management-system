import { useState, useEffect } from 'react';
import { billsAPI } from '../services/api';
import Layout from '../components/Layout';
import {
  Search,
  Filter,
  Receipt,
  DollarSign,
  CreditCard,
  Wallet,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filters, setFilters] = useState({
    paymentStatus: '',
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    items: [],
    discount: 0,
    discountType: 'percentage',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    fetchBills();
  }, [filters]);

  const fetchBills = async () => {
    try {
      const response = await billsAPI.getAll(filters);
      setBills(response.data.bills);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async (bill) => {
    try {
      const response = await billsAPI.getById(bill._id);
      setSelectedBill(response.data);
    } catch (error) {
      console.error('Error fetching bill:', error);
    }
  };

  const handleEditBill = (bill) => {
    setEditForm({
      items: bill.items,
      discount: bill.discount || 0,
      discountType: bill.discountType || 'percentage',
      paymentMethod: bill.paymentMethod || 'cash',
    });
    setSelectedBill(bill);
    setShowEditModal(true);
  };

  const calculateTotal = () => {
    let subtotal = editForm.items.reduce((sum, item) => sum + item.total, 0);
    let discount = 0;
    if (editForm.discountType === 'percentage') {
      discount = (subtotal * editForm.discount) / 100;
    } else {
      discount = editForm.discount;
    }
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * 0.18;
    const total = taxableAmount + tax;
    return { subtotal, discount, tax, total };
  };

  const handleUpdateBill = async () => {
    try {
      await billsAPI.update(selectedBill._id, editForm);
      setShowEditModal(false);
      fetchBills();
      alert('Bill updated successfully!');
    } catch (error) {
      console.error('Error updating bill:', error);
      alert('Failed to update bill');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentIcon = (method) => {
    const icons = {
      cash: DollarSign,
      card: CreditCard,
      upi: Wallet,
      wallet: Wallet,
    };
    const Icon = icons[method] || DollarSign;
    return <Icon size={16} />;
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-dark">Bills</h1>
          <p className="text-gray-500">Manage all bills and transactions</p>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="flex flex-wrap gap-4">
            <select
              value={filters.paymentStatus}
              onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })}
              className="input max-w-xs"
            >
              <option value="">All Payments</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {/* Bills Table */}
        <div className="card overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>Bill No.</th>
                <th>Date</th>
                <th>Order Type</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  </td>
                </tr>
              ) : bills.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    No bills found
                  </td>
                </tr>
              ) : (
                bills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="font-medium">{bill.billNumber}</td>
                    <td>{new Date(bill.createdAt).toLocaleDateString()}</td>
                    <td className="capitalize">{bill.orderId?.orderType?.replace('_', ' ') || '-'}</td>
                    <td>{bill.items?.length || 0} items</td>
                    <td className="font-medium">{formatCurrency(bill.total)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {getPaymentIcon(bill.paymentMethod)}
                        <span className="capitalize">{bill.paymentMethod}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewBill(bill)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="View"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEditBill(bill)}
                          className="p-1 hover:bg-gray-100 rounded"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Bill Modal */}
      {selectedBill && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Bill #{selectedBill.billNumber}</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3 mb-6">
                {selectedBill.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedBill.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>{formatCurrency(selectedBill.tax)}</span>
                </div>
                {selectedBill.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedBill.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedBill.total)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedBill(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditModal && selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Edit Bill #{selectedBill.billNumber}</h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Items will be displayed here - simplified for now */}
              <div>
                <label className="block text-sm font-medium mb-2">Discount</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editForm.discount}
                    onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })}
                    className="input flex-1"
                    min="0"
                  />
                  <select
                    value={editForm.discountType}
                    onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}
                    className="input w-32"
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Payment Method</label>
                <select
                  value={editForm.paymentMethod}
                  onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                  className="input"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                </select>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal().total)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex gap-2 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateBill}
                className="btn btn-primary"
              >
                Update Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Bills;
