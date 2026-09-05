import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Plus, User, Mail, Phone, MapPin, Receipt, Truck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ContactsPage = () => {
  const { contacts, addContact, invoices, vendorBills } = useApp();
  const [filterType, setFilterType] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    userType: 'CUSTOMER',
    email: '',
    mobile: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    password: 'password123'
  });

  const filteredContacts = contacts.filter(c => {
    if (filterType === 'ALL') return true;
    return c.userType === filterType || c.userType === 'BOTH';
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    addContact({
      name: formData.name,
      userType: formData.userType,
      email: formData.email,
      mobile: Number(formData.mobile || 9876543210),
      address: { city: formData.city, state: formData.state, pincode: formData.pincode },
      password: formData.password,
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });

    setIsAddModalOpen(false);
    setFormData({ name: '', userType: 'CUSTOMER', email: '', mobile: '', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', password: 'password123' });
  };

  const contactInvoices = selectedContact ? invoices.filter(i => i.customerName === selectedContact.name) : [];
  const contactBills = selectedContact ? vendorBills.filter(b => b.vendorName === selectedContact.name) : [];

  const columns = [
    {
      header: 'Contact Name',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <img src={row.profileImage} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
          <div>
            <div className="font-semibold text-slate-800">{row.name}</div>
            <div className="text-xs text-slate-400">{row.email}</div>
          </div>
        </div>
      )
    },
    { header: 'Type', cell: (row) => <Badge status={row.userType} /> },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'City / Location',
      cell: (row) => `${row.address?.city || '-'}, ${row.address?.state || '-'}`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Contact Master Directory</h2>
          <p className="text-xs text-slate-500 mt-1">Manage Customers, Vendors, and Partners</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            {['ALL', 'CUSTOMER', 'VENDOR', 'BOTH'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filterType === t ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Table List */}
      <Table
        columns={columns}
        data={filteredContacts}
        onRowClick={(row) => setSelectedContact(row)}
      />

      {/* Add Contact Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Contact">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mr Rahul / Urban Woodcrafts"
              className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Contact Type</label>
              <select
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              >
                <option value="CUSTOMER">CUSTOMER</option>
                <option value="VENDOR">VENDOR</option>
                <option value="BOTH">BOTH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Mobile</label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Save Contact
            </button>
          </div>
        </form>
      </Modal>

      {/* Contact Details Drawer */}
      <Modal
        isOpen={Boolean(selectedContact)}
        onClose={() => setSelectedContact(null)}
        title={`Contact Profile: ${selectedContact?.name || ''}`}
      >
        {selectedContact && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <img src={selectedContact.profileImage} alt="" className="w-14 h-14 rounded-full object-cover" />
              <div>
                <h4 className="text-base font-bold text-slate-800">{selectedContact.name}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={selectedContact.userType} />
                  <span className="text-xs text-slate-500">{selectedContact.email}</span>
                </div>
              </div>
            </div>

            {/* Transaction History Section */}
            <div>
              <h5 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-3">Associated Invoices & Bills</h5>
              {contactInvoices.length === 0 && contactBills.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No billing history recorded for this contact.
                </div>
              ) : (
                <div className="space-y-2">
                  {contactInvoices.map(inv => (
                    <div key={inv._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        <span className="font-semibold text-slate-800">{inv.inv_number}</span>
                      </div>
                      <span className="font-medium text-slate-800">{formatCurrency(inv.total_amount)}</span>
                      <Badge status={inv.status} />
                    </div>
                  ))}

                  {contactBills.map(bill => (
                    <div key={bill._id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-slate-800">{bill.bill_number}</span>
                      </div>
                      <span className="font-medium text-slate-800">{formatCurrency(bill.total)}</span>
                      <Badge status={bill.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
