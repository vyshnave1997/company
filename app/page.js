'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Mail, CheckCircle, XCircle, Edit2, Trash2, Save, X, Search, Download, Upload, Filter, RefreshCw, Building2, Phone, MapPin, Calendar, Globe, ChevronDown, FileSpreadsheet, FileText, Send } from 'lucide-react';

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
    interviewed: 0,
    pending: 0
  });
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [emailTemplate, setEmailTemplate] = useState({
    subject: '',
    body: ''
  });
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [formData, setFormData] = useState({
    companyName: '',
    companyDetail: '',
    companyWebsite: '',
    companyContact: '',
    companyMail: '',
    companyLocation: '',
    mailSent: 'Not Sent',
    interview: 'No Idea'
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  useEffect(() => {
    filterAndSearch();
  }, [companies, searchTerm, filterStatus]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu]);

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
      interviewed: data.filter(c => c.interview === 'Selected').length,
      pending: data.filter(c => c.mailSent === 'Pending').length
    });
  };

  const filterAndSearch = () => {
    let filtered = companies;

    if (filterStatus === 'sent') {
      filtered = filtered.filter(c => c.mailSent === 'Sent');
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(c => c.mailSent === 'Pending');
    } else if (filterStatus === 'not-sent') {
      filtered = filtered.filter(c => c.mailSent === 'Not Sent');
    } else if (filterStatus === 'selected') {
      filtered = filtered.filter(c => c.interview === 'Selected');
    } else if (filterStatus === 'rejected') {
      filtered = filtered.filter(c => c.interview === 'Rejected');
    }

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
          showToast('Company updated successfully!', 'success');
        } else {
          showToast('Failed to update company', 'error');
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
          showToast('Company added successfully!', 'success');
        } else {
          showToast('Failed to add company', 'error');
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving company:', error);
      showToast('Error saving company. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      companyName: company.companyName,
      companyDetail: company.companyDetail,
      companyWebsite: company.companyWebsite || '',
      companyContact: company.companyContact,
      companyMail: company.companyMail,
      companyLocation: company.companyLocation,
      mailSent: company.mailSent,
      interview: company.interview || 'No Idea'
    });
    setEditingId(company.id);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      setIsLoading(true);
      try {
        const company = companies.find(c => c.id === id);
        const response = await fetch(`/api/companies?id=${id}&_id=${company._id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          await loadCompanies();
          showToast('Company deleted successfully!', 'success');
        } else {
          showToast('Failed to delete company', 'error');
        }
      } catch (error) {
        console.error('Error deleting company:', error);
        showToast('Error deleting company. Please try again.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const exportToCSV = () => {
    const headers = ['S.No', 'Company Name', 'Details', 'Website', 'Contact', 'Email', 'Location', 'Mail Status', 'Interview'];
    const rows = filteredCompanies.map(c => [
      c.serialNo,
      c.companyName,
      c.companyDetail,
      c.companyWebsite || '',
      c.companyContact,
      c.companyMail,
      c.companyLocation,
      c.mailSent,
      c.interview || 'No Idea'
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setShowExportMenu(false);
    showToast('CSV exported successfully!', 'success');
  };

  const handleSendEmail = (company) => {
    setSelectedCompanies([company]);
    setEmailTemplate({
      subject: `Regarding ${company.companyName}`,
      body: `Dear ${company.companyName} Team,\n\n\n\nBest Regards`
    });
    setShowEmailModal(true);
  };

  const handleBulkEmail = () => {
    const notSentCompanies = filteredCompanies.filter(c => c.mailSent === 'Not Sent');
    if (notSentCompanies.length === 0) {
      showToast('No companies with "Not Sent" status found!', 'warning');
      return;
    }
    setSelectedCompanies(notSentCompanies);
    setEmailTemplate({
      subject: 'Job Application',
      body: 'Dear Hiring Manager,\n\nI am writing to express my interest in potential opportunities at your esteemed organization.\n\nBest Regards'
    });
    setShowEmailModal(true);
  };

  const sendEmailViaGmail = async () => {
    try {
      setIsLoading(true);
      
      const recipients = selectedCompanies.map(c => c.companyMail).join(',');
      const subject = encodeURIComponent(emailTemplate.subject);
      const body = encodeURIComponent(emailTemplate.body);
      const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipients}&su=${subject}&body=${body}`;
      
      window.open(mailtoLink, '_blank');
      
      for (const company of selectedCompanies) {
        const response = await fetch('/api/companies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: company._id,
            id: company.id,
            serialNo: company.serialNo,
            companyName: company.companyName,
            companyDetail: company.companyDetail,
            companyWebsite: company.companyWebsite,
            companyContact: company.companyContact,
            companyMail: company.companyMail,
            companyLocation: company.companyLocation,
            mailSent: 'Sent',
            interview: company.interview,
            updatedAt: new Date().toISOString()
          })
        });
      }
      
      await loadCompanies();
      setShowEmailModal(false);
      setSelectedCompanies([]);
      showToast('Email opened in Gmail! Status updated to "Sent"', 'success');
      
    } catch (error) {
      console.error('Error sending email:', error);
      showToast('Error processing email. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    const headers = ['S.No', 'Company Name', 'Details', 'Website', 'Contact', 'Email', 'Location', 'Mail Status', 'Interview'];
    const rows = filteredCompanies.map(c => [
      c.serialNo,
      c.companyName,
      c.companyDetail,
      c.companyWebsite || '',
      c.companyContact,
      c.companyMail,
      c.companyLocation,
      c.mailSent,
      c.interview || 'No Idea'
    ]);

    let html = '<html><head><meta charset="utf-8"><style>table {border-collapse: collapse; width: 100%;} th, td {border: 1px solid black; padding: 8px; text-align: left;} th {background-color: #4CAF50; color: white;}</style></head><body>';
    html += '<table>';
    html += '<thead><tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr></thead>';
    html += '<tbody>';
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    html += '</tbody></table></body></html>';

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    setShowExportMenu(false);
    showToast('Excel file exported successfully!', 'success');
  };

  const exportToPDF = () => {
    const headers = ['S.No', 'Company', 'Details', 'Website', 'Contact', 'Email', 'Location', 'Mail', 'Interview'];
    const rows = filteredCompanies.map(c => [
      c.serialNo,
      c.companyName,
      c.companyDetail.substring(0, 30) + '...',
      c.companyWebsite ? 'Yes' : 'No',
      c.companyContact,
      c.companyMail,
      c.companyLocation,
      c.mailSent,
      c.interview || 'No Idea'
    ]);

    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1e40af; text-align: center; margin-bottom: 20px; }
        .info { text-align: center; margin-bottom: 30px; color: #666; }
        table { border-collapse: collapse; width: 100%; font-size: 10px; }
        th { background-color: #1e40af; color: white; padding: 8px; text-align: left; border: 1px solid #ddd; }
        td { padding: 6px; border: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <h1>Company Management Report</h1>
      <div class="info">
        <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        <p>Total Companies: ${filteredCompanies.length}</p>
      </div>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>`;
    
    rows.forEach(row => {
      html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });
    
    html += `</tbody>
      </table>
      <div class="footer">
        <p>Company Management System - Confidential</p>
      </div>
    </body>
    </html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
    
    setShowExportMenu(false);
    showToast('PDF export initiated!', 'success');
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      companyDetail: '',
      companyWebsite: '',
      companyContact: '',
      companyMail: '',
      companyLocation: '',
      mailSent: 'Not Sent',
      interview: 'No Idea'
    });
    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-5">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl backdrop-blur-sm border-2 ${
            toast.type === 'success' ? 'bg-emerald-500 border-emerald-400 text-white' :
            toast.type === 'error' ? 'bg-red-500 border-red-400 text-white' :
            toast.type === 'warning' ? 'bg-amber-500 border-amber-400 text-white' :
            'bg-blue-500 border-blue-400 text-white'
          }`}>
            {toast.type === 'success' && <CheckCircle size={24} className="flex-shrink-0" />}
            {toast.type === 'error' && <XCircle size={24} className="flex-shrink-0" />}
            {toast.type === 'warning' && <XCircle size={24} className="flex-shrink-0" />}
            <span className="font-semibold text-sm">{toast.message}</span>
            <button 
              onClick={() => setToast({ show: false, message: '', type: '' })}
              className="ml-2 hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

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
                <span className="text-sm font-normal text-black drop-shadow-lg">
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

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Mail size={28} />
                  Send Email via Gmail
                </h2>
                <button 
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedCompanies([]);
                  }} 
                  className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
              <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Recipients ({selectedCompanies.length}):</strong> {selectedCompanies.map(c => c.companyName).join(', ')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                <textarea
                  value={emailTemplate.body}
                  onChange={(e) => setEmailTemplate({...emailTemplate, body: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                  placeholder="Email body"
                  rows="10"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This will open Gmail in a new tab with pre-filled content. After sending the email from Gmail, the mail status will be automatically updated to "Sent".
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={sendEmailViaGmail}
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={20} />
                  {isLoading ? 'Processing...' : 'Open in Gmail'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setSelectedCompanies([]);
                  }}
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
                <p className="text-sm font-medium text-gray-600">Interviewed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.interviewed}</p>
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
                  <option value="selected">Selected</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <button
                onClick={loadCompanies}
                className="px-4 py-3 bg-yellow-800 hover:bg-gray-200 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleBulkEmail}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                title="Send Bulk Email"
              >
                <Send size={20} />
                <span className="hidden sm:inline">Send Emails</span>
              </button>
              
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download size={20} />
                  <span className="hidden sm:inline">Export</span>
                  <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <button
                      onClick={exportToCSV}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700"
                    >
                      <FileText size={18} className="text-blue-600" />
                      <div>
                        <div className="font-semibold">Export as CSV</div>
                        <div className="text-xs text-gray-500">Comma separated values</div>
                      </div>
                    </button>
                    <button
                      onClick={exportToExcel}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700 border-t border-gray-100"
                    >
                      <FileSpreadsheet size={18} className="text-green-600" />
                      <div>
                        <div className="font-semibold">Export as Excel</div>
                        <div className="text-xs text-gray-500">Microsoft Excel format</div>
                      </div>
                    </button>
                    <button
                      onClick={exportToPDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-gray-700 border-t border-gray-100"
                    >
                      <FileText size={18} className="text-red-600" />
                      <div>
                        <div className="font-semibold">Export as PDF</div>
                        <div className="text-xs text-gray-500">Printable document</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
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
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company Detail</label>
                  <textarea
                    value={formData.companyDetail}
                    onChange={(e) => setFormData({...formData, companyDetail: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="Enter company details"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Globe size={16} />
                    Company Website
                  </label>
                  <input
                    type="text"
                    value={formData.companyWebsite}
                    onChange={(e) => setFormData({...formData, companyWebsite: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                    placeholder="https://www.example.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Phone size={16} />
                      Contact
                    </label>
                    <input
                      type="text"
                      value={formData.companyContact}
                      onChange={(e) => setFormData({...formData, companyContact: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors placeholder:text-gray-500 text-gray-900"
                      placeholder="Phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Mail size={16} />
                      Email
                    </label>
                    <input
                      type="text"
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
                    Location
                  </label>
                  <select
                    value={formData.companyLocation}
                    onChange={(e) => setFormData({...formData, companyLocation: e.target.value})}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                  >
                    <option value="">Select Location</option>
                    
              <optgroup label="🏙️ Main Areas">
                      <option value="Downtown Dubai">Downtown Dubai</option>
                      <option value="Dubai Marina">Dubai Marina</option>
                      <option value="Business Bay">Business Bay</option>
                      <option value="Jumeirah Lake Towers (JLT)">Jumeirah Lake Towers (JLT)</option>
                      <option value="Dubai Internet City">Dubai Internet City</option>
                      <option value="Dubai Media City">Dubai Media City</option>
                      <option value="Dubai Knowledge Park">Dubai Knowledge Park</option>
                      <option value="Deira">Deira</option>
                      <option value="Bur Dubai">Bur Dubai</option>
                      <option value="Jumeirah">Jumeirah</option>
                      <option value="Al Barsha">Al Barsha</option>
                      <option value="Al Quoz">Al Quoz</option>
                      <option value="Sheikh Zayed Road">Sheikh Zayed Road</option>
                      <option value="DIFC">DIFC (Dubai International Financial Centre)</option>
                      <option value="Dubai Silicon Oasis">Dubai Silicon Oasis</option>
                      <option value="International City">International City</option>
                      <option value="Discovery Gardens">Discovery Gardens</option>
                      <option value="Motor City">Motor City</option>
                      <option value="Dubai Sports City">Dubai Sports City</option>
                      <option value="Arabian Ranches">Arabian Ranches</option>
                    </optgroup>
                    
                    <optgroup label="🚇 Red Line Metro Stations">
                      <option value="Rashidiya Metro Station">Rashidiya</option>
                      <option value="Dubai Airport Free Zone Metro Station">Dubai Airport Free Zone</option>
                      <option value="Dubai Airport Terminal 3 Metro Station">Dubai Airport Terminal 3</option>
                      <option value="Dubai Airport Terminal 1 Metro Station">Dubai Airport Terminal 1</option>
                      <option value="GGICO Metro Station">GGICO</option>
                      <option value="Deira City Centre Metro Station">Deira City Centre</option>
                      <option value="Abu Hail Metro Station">Abu Hail</option>
                      <option value="Abu Baker Al Siddique Metro Station">Abu Baker Al Siddique</option>
                      <option value="Salah Al Din Metro Station">Salah Al Din</option>
                      <option value="Union Metro Station">Union</option>
                      <option value="Baniyas Square Metro Station">Baniyas Square</option>
                      <option value="Palm Deira Metro Station">Palm Deira</option>
                      <option value="Al Ras Metro Station">Al Ras</option>
                      <option value="Al Ghubaiba Metro Station">Al Ghubaiba</option>
                      <option value="Al Fahidi Metro Station">Al Fahidi</option>
                      <option value="BurJuman Metro Station">BurJuman</option>
                      <option value="Oud Metha Metro Station">Oud Metha</option>
                      <option value="Dubai Healthcare City Metro Station">Dubai Healthcare City</option>
                      <option value="Al Jadaf Metro Station">Al Jadaf</option>
                      <option value="Creek Metro Station">Creek</option>
                      <option value="Financial Centre Metro Station">Financial Centre</option>
                      <option value="Emirates Towers Metro Station">Emirates Towers</option>
                      <option value="World Trade Centre Metro Station">World Trade Centre</option>
                      <option value="First Abu Dhabi Bank Metro Station">First Abu Dhabi Bank</option>
                      <option value="Burj Khalifa/Dubai Mall Metro Station">Burj Khalifa/Dubai Mall</option>
                      <option value="Business Bay Metro Station">Business Bay</option>
                      <option value="Noor Bank Metro Station">Noor Bank</option>
                      <option value="Mall of the Emirates Metro Station">Mall of the Emirates</option>
                      <option value="Sharaf DG Metro Station">Sharaf DG</option>
                      <option value="Dubai Internet City Metro Station">Dubai Internet City</option>
                      <option value="Nakheel Metro Station">Nakheel</option>
                      <option value="Danube Metro Station">Danube</option>
                      <option value="Ibn Battuta Metro Station">Ibn Battuta</option>
                      <option value="Energy Metro Station">Energy</option>
                      <option value="Jebel Ali Metro Station">Jebel Ali</option>
                      <option value="UAE Exchange Metro Station">UAE Exchange</option>
                    </optgroup>
                    
                    <optgroup label="🚇 Green Line Metro Stations">
                      <option value="Etisalat Metro Station">Etisalat</option>
                      <option value="Al Qusais Metro Station">Al Qusais</option>
                      <option value="Dubai Airport Free Zone Metro Station">Dubai Airport Free Zone</option>
                      <option value="Al Nahda Metro Station">Al Nahda</option>
                      <option value="Stadium Metro Station">Stadium</option>
                      <option value="Al Qiyadah Metro Station">Al Qiyadah</option>
                      <option value="Abu Hail Metro Station">Abu Hail</option>
                      <option value="Salah Al Din Metro Station">Salah Al Din</option>
                      <option value="Union Metro Station">Union</option>
                      <option value="Baniyas Square Metro Station">Baniyas Square</option>
                      <option value="Palm Deira Metro Station">Palm Deira</option>
                      <option value="Al Ras Metro Station">Al Ras</option>
                      <option value="Al Ghubaiba Metro Station">Al Ghubaiba</option>
                      <option value="Al Fahidi Metro Station">Al Fahidi</option>
                      <option value="BurJuman Metro Station">BurJuman</option>
                      <option value="Oud Metha Metro Station">Oud Metha</option>
                      <option value="Dubai Healthcare City Metro Station">Dubai Healthcare City</option>
                      <option value="Al Jadaf Metro Station">Al Jadaf</option>
                      <option value="Creek Metro Station">Creek</option>
                    </optgroup>
                    
                    <optgroup label="🌐 Free Zones & Business Parks">
                      <option value="Dubai Airport Free Zone">Dubai Airport Free Zone</option>
                      <option value="Jebel Ali Free Zone (JAFZA)">Jebel Ali Free Zone (JAFZA)</option>
                      <option value="Dubai South">Dubai South</option>
                      <option value="Dubai CommerCity">Dubai CommerCity</option>
                      <option value="Dubai Design District (d3)">Dubai Design District (d3)</option>
                      <option value="Dubai Studio City">Dubai Studio City</option>
                      <option value="Dubai Production City">Dubai Production City</option>
                      <option value="Dubai Outsource City">Dubai Outsource City</option>
                      <option value="Dubai Science Park">Dubai Science Park</option>
                      <option value="Dubai Textile City">Dubai Textile City</option>
                      <option value="Dubai Industrial City">Dubai Industrial City</option>
                      <option value="Dubai Academic City">Dubai Academic City</option>
                    </optgroup>
                    
                    <optgroup label="🏝️ Other Areas">
                      <option value="Palm Jumeirah">Palm Jumeirah</option>
                      <option value="Dubai Hills Estate">Dubai Hills Estate</option>
                      <option value="Al Wasl">Al Wasl</option>
                      <option value="Mirdif">Mirdif</option>
                      <option value="Nad Al Sheba">Nad Al Sheba</option>
                      <option value="Al Warqa">Al Warqa</option>
                      <option value="Al Mizhar">Al Mizhar</option>
                      <option value="Festival City">Festival City</option>
                      <option value="Dubai Creek Harbour">Dubai Creek Harbour</option>
                      <option value="Meydan">Meydan</option>
                      <option value="Umm Suqeim">Umm Suqeim</option>
                      <option value="Al Safa">Al Safa</option>
                      <option value="Al Satwa">Al Satwa</option>
                      <option value="Karama">Karama</option>
                      <option value="Muhaisnah">Muhaisnah</option>
                    </optgroup>
                  </select>
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
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Interview Status</label>
                    <select
                      value={formData.interview}
                      onChange={(e) => setFormData({...formData, interview: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-gray-900"
                    >
                      <option>No Idea</option>
                      <option>Selected</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save size={20} />
                    {isLoading ? 'Saving...' : editingId ? 'Update' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={isLoading}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
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
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Website</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Contact</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Email</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Location</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Mail Status</th>
                  <th className="px-4 py-4 text-left text-sm font-bold text-gray-700">Interview</th>
                  <th className="px-4 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{company.serialNo}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900">{company.companyName}</td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">{company.companyDetail}</td>
                    <td className="px-4 py-4 text-sm">
                      {company.companyWebsite ? (
                        <a 
                          href={company.companyWebsite} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe size={14} />
                          Visit Site
                        </a>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <a 
                        href={`tel:${company.companyContact}`} 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone size={14} />
                        {company.companyContact}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <a 
                        href={`mailto:${company.companyMail}`} 
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Mail size={14} />
                        {company.companyMail}
                      </a>
                    </td>
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
                        company.interview === 'Selected' ? 'bg-green-100 text-green-700' :
                        company.interview === 'Rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {company.interview === 'Selected' ? <CheckCircle size={14} /> : 
                         company.interview === 'Rejected' ? <XCircle size={14} /> : 
                         <XCircle size={14} />}
                        {company.interview || 'No Idea'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleSendEmail(company)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Send Email"
                        >
                          <Send size={18} />
                        </button>
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
                  <a 
                    href={`tel:${company.companyContact}`} 
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {company.companyContact}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">Email:</span>
                  <a 
                    href={`mailto:${company.companyMail}`} 
                    className="text-blue-600 hover:underline font-medium break-all"
                  >
                    {company.companyMail}
                  </a>
                </div>
                {company.companyWebsite && (
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <span className="font-semibold text-gray-700">Website:</span>
                    <a 
                      href={company.companyWebsite} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Visit Site
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="font-semibold text-gray-700">Location:</span>
                  <span className="text-gray-600">{company.companyLocation}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-4 flex-wrap">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  company.mailSent === 'Sent' ? 'bg-emerald-100 text-emerald-700' :
                  company.mailSent === 'Pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  <Mail size={14} />
                  {company.mailSent}
                </span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  company.interview === 'Selected' ? 'bg-green-100 text-green-700' :
                  company.interview === 'Rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {company.interview === 'Selected' ? <CheckCircle size={14} /> : 
                   company.interview === 'Rejected' ? <XCircle size={14} /> : 
                   <XCircle size={14} />}
                  {company.interview || 'No Idea'}
                </span>
              </div>

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleSendEmail(company)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  <Send size={16} />
                  Email
                </button>
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