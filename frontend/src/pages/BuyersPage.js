import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getBuyers, createBuyer, updateBuyer, deleteBuyer } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const freshForm = () => ({
  company_name: '',
  gst_number: 'GST-',
  ntn_number: 'NTN-',
  address: '',
  contact_person: '',
  email: '',
  phone: '',
  city: '',
  is_filer: true,
});

const BuyersPage = () => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState(freshForm());
  const [lastFilerValues, setLastFilerValues] = useState({ gst_number: 'GST-', ntn_number: 'NTN-' });

  const { showToast } = useContext(ToastContext);
  const { user } = useContext(AuthContext);

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text) => {
    const value = String(text ?? '');
    const term = searchTerm.trim();
    if (!term) return value;
    const pattern = new RegExp(`(${escapeRegExp(term)})`, 'gi');
    return value.split(pattern).map((part, idx) =>
      part.toLowerCase() === term.toLowerCase()
        ? <mark key={idx} className="bg-yellow-200 text-slate-900 px-0.5 rounded">{part}</mark>
        : part
    );
  };

  const fetchBuyers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await getBuyers(page, 10, search);
      setBuyers(response.data?.data || response.data?.buyers || []);
      setTotalPages(response.data?.pages || 1);
      setCurrentPage(page);
    } catch {
      showToast('Failed to load buyers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBuyers(); }, []); // eslint-disable-line
  useEffect(() => {
    if (user?.company_name) document.title = `${user.company_name} - Buyers`;
  }, [user?.company_name]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
    fetchBuyers(1, e.target.value);
  };

  const handleAddBuyer = () => {
    setFormData(freshForm()); // always a new object
    setLastFilerValues({ gst_number: 'GST-', ntn_number: 'NTN-' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEditBuyer = (buyer) => {
    const gst = (buyer.gst_number || '').trim().toUpperCase();
    const ntn = (buyer.ntn_number || '').trim().toUpperCase();
    const isNonFiler = gst === 'N/A' && ntn === 'N/A';
    const filerGst = isNonFiler ? 'GST-' : (buyer.gst_number || 'GST-');
    const filerNtn = isNonFiler ? 'NTN-' : (buyer.ntn_number || 'NTN-');
    setFormData({
      ...buyer,
      gst_number: isNonFiler ? 'N/A' : filerGst,
      ntn_number: isNonFiler ? 'N/A' : filerNtn,
      is_filer: !isNonFiler,
    });
    setLastFilerValues({ gst_number: filerGst, ntn_number: filerNtn });
    setEditingId(buyer.id);
    setShowForm(true);
  };

  const handleFilerToggle = (isFilerNow) => {
    if (isFilerNow) {
      setFormData(prev => ({ ...prev, is_filer: true, gst_number: lastFilerValues.gst_number, ntn_number: lastFilerValues.ntn_number }));
    } else {
      // cache current filer values before wiping, so switching back restores them
      setLastFilerValues({ gst_number: formData.gst_number, ntn_number: formData.ntn_number });
      setFormData(prev => ({ ...prev, is_filer: false, gst_number: 'N/A', ntn_number: 'N/A' }));
    }
  };

  const handleGstChange = (e) => {
    if (!formData.is_filer) return;
    const raw = e.target.value;
    // Always keep GST- prefix, don't let user delete it
    const stripped = raw.replace(/^GST-/i, '');
    const next = 'GST-' + stripped;
    setFormData(prev => ({ ...prev, gst_number: next }));
    setLastFilerValues(prev => ({ ...prev, gst_number: next }));
  };

  const handleNtnChange = (e) => {
    if (!formData.is_filer) return;
    const raw = e.target.value;
    const stripped = raw.replace(/^NTN-/i, '');
    const next = 'NTN-' + stripped;
    setFormData(prev => ({ ...prev, ntn_number: next }));
    setLastFilerValues(prev => ({ ...prev, ntn_number: next }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isFiler = formData.is_filer;
    const gst = isFiler ? formData.gst_number : 'N/A';
    const ntn = isFiler ? formData.ntn_number : 'N/A';

    const hasGstDigits = isFiler ? gst.replace(/^GST-/i, '').trim().length > 0 : true;
    const hasNtnDigits = isFiler ? ntn.replace(/^NTN-/i, '').trim().length > 0 : true;

    if (!formData.company_name || !formData.address || !hasGstDigits || !hasNtnDigits) {
      showToast(isFiler ? 'Fill required: Company Name, GST, NTN, Address' : 'Fill required: Company Name, Address', 'warning');
      return;
    }

    const payload = { ...formData, gst_number: gst, ntn_number: ntn };
    try {
      if (editingId) {
        await updateBuyer(editingId, payload);
        showToast('Buyer updated', 'success');
      } else {
        await createBuyer(payload);
        showToast('Buyer created', 'success');
      }
      setShowForm(false);
      fetchBuyers(currentPage);
    } catch (error) {
      showToast(error?.response?.data?.error || 'Failed to save buyer', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this buyer?')) return;
    try {
      await deleteBuyer(id);
      showToast('Buyer deleted', 'success');
      fetchBuyers(currentPage);
    } catch {
      showToast('Failed to delete buyer', 'error');
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar companyName={user?.company_name || 'Business'} />

      <div className="flex-1 min-w-0 ml-0 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-4 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Buyers</h1>
              <p className="mt-2 text-sm text-slate-500">Manage your buyer directory.</p>
            </div>
            <button
              onClick={handleAddBuyer}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-indigo-700"
            >
              + Add Buyer
            </button>
          </div>

          <div className="mb-5">
            <input
              type="text"
              placeholder="Search buyers..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
            ) : buyers.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No buyers found.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">City</th>
                        <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyers.map(buyer => {
                        const gst = String(buyer.gst_number || '').trim().toUpperCase();
                        const ntn = String(buyer.ntn_number || '').trim().toUpperCase();
                        const isNonFiler = gst === 'N/A' && ntn === 'N/A';
                        return (
                          <tr key={buyer.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                            <td className="px-4 py-3 align-middle font-medium text-slate-900">{highlightText(buyer.company_name)}</td>
                            <td className="px-4 py-3 align-middle">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${isNonFiler ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {isNonFiler ? 'Non-Filer' : 'Filer'}
                              </span>
                            </td>
                            <td className="px-4 py-3 align-middle text-slate-700">{highlightText(buyer.contact_person || '-')}</td>
                            <td className="px-4 py-3 align-middle text-slate-700">{highlightText(buyer.email || '-')}</td>
                            <td className="px-4 py-3 align-middle text-slate-700">{highlightText(buyer.phone || '-')}</td>
                            <td className="px-4 py-3 align-middle text-slate-700">{highlightText(buyer.city || '-')}</td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex gap-2">
                                <button onClick={() => handleEditBuyer(buyer)} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-xs font-medium text-white transition-colors">Edit</button>
                                <button onClick={() => handleDelete(buyer.id)} className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1 text-xs font-medium text-white transition-colors">Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
                  <span className="text-sm text-slate-600">Page {currentPage} of {totalPages}</span>
                  <div className="flex gap-2">
                    <button onClick={() => fetchBuyers(currentPage - 1, searchTerm)} disabled={currentPage === 1} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                    <button onClick={() => fetchBuyers(currentPage + 1, searchTerm)} disabled={currentPage === totalPages} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">{editingId ? 'Edit Buyer' : 'Add Buyer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                <div className="md:col-span-3">
                  <label className={labelCls}>Filer Status *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFilerToggle(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${formData.is_filer ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      Filer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFilerToggle(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${!formData.is_filer ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      Non-Filer
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Company Name *</label>
                  <input type="text" value={formData.company_name} onChange={e => setFormData(p => ({ ...p, company_name: e.target.value }))} className={inputCls} placeholder="Company name" />
                </div>

                <div>
                  <label className={labelCls}>GST Number {formData.is_filer ? '*' : ''}</label>
                  <input
                    type="text"
                    value={formData.gst_number}
                    onChange={handleGstChange}
                    disabled={!formData.is_filer}
                    className={`${inputCls} ${!formData.is_filer ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                    placeholder="GST-XXXX"
                  />
                </div>

                <div>
                  <label className={labelCls}>NTN Number {formData.is_filer ? '*' : ''}</label>
                  <input
                    type="text"
                    value={formData.ntn_number}
                    onChange={handleNtnChange}
                    disabled={!formData.is_filer}
                    className={`${inputCls} ${!formData.is_filer ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
                    placeholder="NTN-XXXXXXX"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className={labelCls}>Address *</label>
                  <textarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className={inputCls} rows={2} placeholder="Full address" />
                </div>

                <div>
                  <label className={labelCls}>Contact Person</label>
                  <input type="text" value={formData.contact_person} onChange={e => setFormData(p => ({ ...p, contact_person: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyersPage;