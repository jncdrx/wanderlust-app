import { useState } from 'react';
import { X } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: {
    name: string;
    category: string;
    amount: number;
    date: string;
  }) => void;
}

export function AddExpenseModal({ isOpen, onClose, onAdd }: AddExpenseModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Food');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const categories = ['Food', 'Transportation', 'Accommodation', 'Activities', 'Shopping', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && amount && parseFloat(amount) > 0) {
      onAdd({
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        date,
      });
      // Reset form
      setName('');
      setCategory('Food');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <GlassCard className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/10 backdrop-blur-md p-6 border-b border-white/20 flex items-center justify-between">
          <h2 className="text-white text-xl">Add Expense</h2>
          <button
            onClick={onClose}
            className="bg-white/10 backdrop-blur-md p-2 rounded-xl hover:bg-white/20 transition-all"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Expense Name */}
          <div>
            <label className="text-white/90 text-sm mb-2 block">Expense Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Lunch at restaurant"
              className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-white/90 text-sm mb-2 block">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-slate-800 text-white">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="text-white/90 text-sm mb-2 block">Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="text-white/90 text-sm mb-2 block">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/30 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-teal-400"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/10 backdrop-blur-md text-white py-3 rounded-2xl border border-white/30 hover:bg-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-teal-400 to-cyan-500 text-white py-3 rounded-2xl shadow-lg shadow-teal-500/50 hover:shadow-xl hover:shadow-teal-500/60 transition-all"
            >
              Add Expense
            </button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
