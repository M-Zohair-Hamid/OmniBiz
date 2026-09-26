import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../components/Sidebar';
import { getItems, createItem, updateItem, deleteItem } from '../services/api';
import { ToastContext } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

const freshForm = () => ({
  code: '', name: '', description: '', unit: 'PCS', unit_price: 0, quantity_in_stock: 0
});

const ItemsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(freshForm());
  const [addStockAmount, setAddStockAmount] = useState(0);

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

  const fetchItems = async (search = '') => {
    setLoading(true);
    try {
      const response = await getItems(1, 1000, search);
      setItems(response.data.data);
    } catch {
      showToast('Failed to load items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []); // eslint-disable-line
  useEffect(() => {
    if (user?.company_name) document.title = `${user.company_name} - Items`;
  }, [user?.company_name]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    fetchItems(e.target.value);
  };

  const handleAddItem = () => {
    setEditingId(null);
    setFormData(freshForm());
    setAddStockAmount(0);
    setShowForm(true);
  };

  const handleEditItem = (item) => {
    setFormData({ ...item });
    setEditingId(item.id);
    setAddStockAmount(0);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.unit_price) {
      showToast('Fill required: Code, Name, Unit Price', 'warning');
      return;
    }

    // Guard: stock can never be negative
    const baseStock = Math.max(0, Number(formData.quantity_in_stock) || 0);
    const addAmount = Math.max(0, Number(addStockAmount) || 0);

    try {
      const submitData = { ...formData, quantity_in_stock: baseStock };
      if (editingId && addAmount > 0) {
        submitData.quantity_in_stock = baseStock + addAmount;
      }

      if (editingId) {
        await updateItem(editingId, submitData);
        showToast('Item updated', 'success');
      } else {
        const resp = await createItem(submitData);
        if (resp?.data?.code) setFormData({ ...submitData, code: resp.data.code });
        showToast('Item created', 'success');
      }
      setShowForm(false);
      setAddStockAmount(0);
      fetchItems(searchTerm);
    } catch (error) {
      showToast(error?.response?.data?.error || 'Failed to save item', 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await deleteItem(id);
      showToast('Item deleted', 'success');
      fetchItems(searchTerm);
    } catch {
      showToast('Failed to delete item', 'error');
    }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar companyName={user?.company_name || 'Business'} />

      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Items</h1>
              <p className="mt-2 text-sm text-slate-500">Manage your product catalog and stock.</p>
            </div>
            <button
              onClick={handleAddItem}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-indigo-700"
            >
              + Add Item
            </button>
          </div>

          <div className="mb-5">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No items found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Unit</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Price (Rs.)</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</th>
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => {
                      const stock = item.quantity_in_stock || 0;
                      const stockBadge = stock <= 0
                        ? 'bg-rose-50 text-rose-700'
                        : stock <= 20
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700';
                      return (
                        <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                          <td className="px-4 py-3 align-middle font-medium text-slate-900">{highlightText(item.code)}</td>
                          <td className="px-4 py-3 align-middle text-slate-700">{highlightText(item.name)}</td>
                          <td className="px-4 py-3 align-middle text-slate-700">{highlightText(item.unit)}</td>
                          <td className="px-4 py-3 align-middle font-medium text-slate-900">
                            Rs. {item.unit_price.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${stockBadge}`}>
                              {stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 align-middle">
                            <div className="flex gap-2">
                              <button onClick={() => handleEditItem(item)} className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1 text-xs font-medium text-white transition-colors">Edit</button>
                              <button onClick={() => handleDeleteItem(item.id)} className="rounded-lg bg-rose-600 hover:bg-rose-700 px-3 py-1 text-xs font-medium text-white transition-colors">Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl animate-scaleIn">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">{editingId ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelCls}>Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      let value = e.target.value.trim();
                      if (value && !value.startsWith('HS-')) value = 'HS-' + value.replace(/^HS-/, '');
                      setFormData(p => ({ ...p, code: value }));
                    }}
                    placeholder="Item code"
                    className={inputCls}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <select value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} className={inputCls}>
                    <option>PCS</option>
                    <option>KG</option>
                    <option>MTR</option>
                    <option>BOX</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Unit Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.unit_price}
                    onChange={e => setFormData(p => ({ ...p, unit_price: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Current Stock</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.quantity_in_stock}
                    onChange={e => setFormData(p => ({ ...p, quantity_in_stock: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className={inputCls}
                  />
                </div>
                {editingId && (
                  <div>
                    <label className={labelCls}>Add Stock</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={addStockAmount}
                      onChange={e => setAddStockAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="Amount to add"
                      className={inputCls}
                    />
                    {addStockAmount > 0 && (
                      <p className="text-xs font-medium text-emerald-700 mt-1.5">
                        New stock will be: {(Math.max(0, formData.quantity_in_stock) || 0) + addStockAmount}
                      </p>
                    )}
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className={inputCls} rows={2} />
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

export default ItemsPage;
