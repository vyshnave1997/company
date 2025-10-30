'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Mail, CheckCircle, XCircle, Edit2, Trash2, Save, X, Search, Download, Upload, Filter, RefreshCw, Building2, Phone, MapPin, Calendar } from 'lucide-react';

export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    mailSent: 0,
    acknowledged: 0,
    pending: 0
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    companyName: '',
    companyDetail: '',
    companyContact: '',
    companyMail: '',
    companyLocation: '',
    mailSent: 'Not Sent',
    acknowledged: 'No'
  });

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterAndSearch();
  }, [companies, searchTerm, filterStatus]);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
        calculateStats(data);
        setDbStatus('active');
      } else {
        setDbStatus('inactive');
      }
    } catch (error) {
      console.error('Error loading companies:', error);
      setDbStatus('inactive');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      mailSent: data.filter(c => c.mailSent === 'Sent').length,
      acknowledged: data.filter(c => c.acknowledged === 'Yes').length,
      pending: data.filter(c => c.mailSent === 'Pending').length
    });
  };

  const filterAndSearch = () => {
    let filtered = companies;

    // Apply status filter
    if (filterStatus === 'sent') {
      filtered = filtered.filter(c => c.mailSent === 'Sent');
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(c => c.mailSent === 'Pending');
    } else if (filterStatus === 'not-sent') {
      filtered = filtered.filter(c => c.mailSent === 'Not Sent');
    } else if (filterStatus === 'acknowledged') {
      filtered = filtered.filter(c => c.acknowledged === 'Yes');
    }

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyMail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyContact.includes(searchTerm)
      );
    }

    setFilteredCompanies(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (editingId) {
        const company = companies.find(c => c.id === editingId);
        const response = await fetch('/api/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            _id: company._id,
            id: editingId, 
            serialNo: company.serialNo,
            ...formData,
            updatedAt: new Date().toISOString()
          })
        });
        
        if (response.ok) {
          await loadCompanies();
          alert('Company updated successfully!');
        } else {
          alert('Failed to update company');
        }
      } else {
        const newCompany = {
          ...formData,
          id: Date.now().toString(),
          serialNo: companies.length + 1,
          createdAt: new Date().toISOString()
        };
        
        const response = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCompany)
        });
        
        if (response.ok) {
          await loadCompanies();
          alert('Company added successfully!');
        } else {
          alert('Failed to add company');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving company:', error);
      alert('Error saving company. Please check console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      companyName: company.companyName,
      companyDetail: company.companyDetail,
      companyContact: company.companyContact,
      companyMail: company.companyMail,
      companyLocation: company.companyLocation,
      mailSent: company.mailSent,
      acknowledged: company.acknowledged
    });
    setEditingId(company.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this company?')) {
      setIsLoading(true);
      try {
        const company = companies.find(c => c.id === id);
        const response = await fetch(`/api/companies?id=${id}&_id=${company._id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadCompanies();
          alert('Company deleted successfully!');
        } else {
          alert('Failed to delete company');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        alert('Error deleting company. Please check console.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['S.No', 'Company Name', 'Details', 'Contact', 'Email', 'Location', 'Mail Status', 'Acknowledged'];
    const rows = filteredCompanies.map(c => [
      c.serialNo,
      c.companyName,
      c.companyDetail,
      c.companyContact,
      c.companyMail,
      c.companyLocation,
      c.mailSent,
      c.acknowledged
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyDetail: '',
      companyContact: '',
      companyMail: '',
      companyLocation: '',
      mailSent: 'Not Sent',
      acknowledged: 'No'
    });
    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-3">
                <Building2 size={32} className="text-blue-400" />
                <h1 className="text-2xl sm:text-3xl font-bold">Company Management</h1>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white border-opacity-20 shadow-lg">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <div className={`w-4 h-4 rounded-full ${
                    dbStatus === 'active' ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 
                    dbStatus === 'inactive' ? 'bg-red-500 shadow-lg shadow-red-500/50' : 
                    'bg-amber-400 shadow-lg shadow-amber-400/50'
                  }`}></div>
                  {dbStatus === 'active' && (
                    <div className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                  )}
                </div>
                <span className="text-sm font-bold text-black drop-shadow-lg">
                  {dbStatus === 'active' ? 'Database Active' : 
                   dbStatus === 'inactive' ? 'Database Offline' : 
                   'Checking...'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Building2 className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mail Sent</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.mailSent}</p>
              </div>
              <Mail className="text-emerald-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acknowledged</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.acknowledged}</p>
              </div>
              <CheckCircle className="text-purple-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pending}</p>
              </div>
              <XCircle className="text-amber-500" size={32} />
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, location, email, or contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-10 pr-8 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none appearance-none bg-white cursor-pointer text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="sent">Mail Sent</option>
                  <option value="pending">Pending</option>
                  <option value="not-sent">Not Sent</option>
                  <option value="acknowledged">Acknowledged</option>
                </select>
              </div>
              
              <button
                onClick={loadCompanies}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              
              <button
                onClick={exportToCSV}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 text-white p-6 rounded-t-2xl">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Building2 size={28} />
                    {editingId ? 'Edit Company' : 'Add New Company'}
                  </h2>
                  <button onClick={resetForm} className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Detail *</label>
                  <textarea
                    required
                    value={formData.companyDetail}
                    onChange={(e) => setFormData({...formData, companyDetail: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="Enter company details"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.companyContact}
                      onChange={(e) => setFormData({...formData, companyContact: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.companyMail}
                      onChange={(e) => setFormData({...formData, companyMail: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                      placeholder="company@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={16} />
                    Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyLocation}
                    onChange={(e) => setFormData({...formData, companyLocation: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="City, Country"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Mail Status</label>
                    <select
                      value={formData.mailSent}
                      onChange={(e) => setFormData({...formData, mailSent: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                    >
                      <option>Not Sent</option>
                      <option>Sent</option>
                      <option>Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Acknowledged</label>
                    <select
                      value={formData.acknowledged}
                      onChange={(e) => setFormData({...formData, acknowledged: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                    >
                      <option>No</option>
                      <option>Yes</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    {isLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button
                    onClick={resetForm}
                    disabled={isLoading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table - Desktop */}
        <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-100 to-slate-200">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">S.No</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Company Name</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Details</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Contact</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Location</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Mail Status</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Acknowledged</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{company.serialNo}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{company.companyName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{company.companyDetail}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{company.companyContact}</td>
                    <td className="px-4 py-4 text-sm text-blue-600">{company.companyMail}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{company.companyLocation}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        company.mailSent === 'Sent' ? 'bg-emerald-100 text-emerald-700' :
                        company.mailSent === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        <Mail size={14} />
                        {company.mailSent}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        company.acknowledged === 'Yes' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {company.acknowledged === 'Yes' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {company.acknowledged}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(company)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No companies found matching your filters' 
                  : 'No companies added yet. Click "Add Company" to get started!'}
              </p>
            </div>
          )}
        </div>

        {/* Cards - Mobile */}
        <div className="lg:hidden space-y-4">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-white rounded-xl shadow-lg p-5 border-l-4 border-blue-500">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-slate-700 text-white text-xs font-bold px-2 py-1 rounded">
                      #{company.serialNo}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900">{company.companyName}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{company.companyDetail}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">Contact:</span>
                  <span className="text-gray-600">{company.companyContact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="text-blue-600">{company.companyMail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="text-gray-600">{company.companyLocation}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-4">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  company.mailSent === 'Sent' ? 'bg-emerald-100 text-emerald-700' :
                  company.mailSent === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <Mail size={14} />
                  {company.mailSent}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  company.acknowledged === 'Yes' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                }`}>
                  {company.acknowledged === 'Yes' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  {company.acknowledged}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleEdit(company)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(company.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            </div>
          ))}
          {filteredCompanies.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg">
              <Building2 size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No companies found matching your filters' 
                  : 'No companies added yet. Click "Add Company" to get started!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}