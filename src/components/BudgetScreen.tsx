import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Plus, Trash2, Calendar, Filter } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { FloatingActionButton } from './FloatingActionButton';
import { AddExpenseModal } from './AddExpenseModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface Expense {
  id: number;
  name: string;
  category: string;
  amount: number;
  date: string;
}

interface BudgetScreenProps {
  darkMode?: boolean;
}

export function BudgetScreen({ darkMode = false }: BudgetScreenProps) {
  const [viewMode, setViewMode] = useState<'estimated' | 'actual'>('actual');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: number; name: string } | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, name: 'Hotel Stay in Boracay', category: 'Accommodation', amount: 42500, date: '2025-10-14' },
    { id: 2, name: 'Manila to Palawan Flight', category: 'Transportation', amount: 46000, date: '2025-10-13' },
    { id: 3, name: 'Seafood Restaurant Dinner', category: 'Food', amount: 6000, date: '2025-10-12' },
    { id: 4, name: 'Underground River Tour', category: 'Activities', amount: 2250, date: '2025-10-11' },
    { id: 5, name: 'Tricycle Ride', category: 'Transportation', amount: 1750, date: '2025-10-11' },
  ]);

  const handleAddExpense = (expense: Omit<Expense, 'id'>) => {
    const maxId = expenses.length > 0 ? Math.max(...expenses.map(e => e.id)) : 0;
    setExpenses([...expenses, { ...expense, id: maxId + 1 }]);
  };

  const handleDeleteExpense = () => {
    if (expenseToDelete) {
      setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
      setExpenseToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const budgetSummary = {
    estimated: 271000, // ₱271,000 (~$5,420)
    actual: expenses.reduce((sum, e) => sum + e.amount, 0),
    remaining: 271000 - expenses.reduce((sum, e) => sum + e.amount, 0),
  };

  // Calculate category breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0 };
    }
    acc[expense.category].total += expense.amount;
    acc[expense.category].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const totalSpent = budgetSummary.actual;
  const categories = Object.entries(categoryBreakdown).map(([name, data]) => ({
    name,
    estimated: Math.round(data.total * 1.2), // Mock estimated value
    actual: data.total,
    color: name === 'Food' ? 'from-emerald-400 via-green-500 to-teal-500' :
           name === 'Transportation' ? 'from-cyan-400 via-blue-500 to-indigo-500' :
           name === 'Accommodation' ? 'from-purple-400 via-violet-500 to-purple-600' :
           name === 'Activities' ? 'from-pink-400 via-rose-500 to-orange-500' :
           'from-amber-400 via-yellow-500 to-orange-500',
    percentage: totalSpent > 0 ? Math.round((data.total / totalSpent) * 100) : 0,
  }));

  const filteredExpenses = filterCategory
    ? expenses.filter(e => e.category === filterCategory)
    : expenses;

  const percentageUsed = (budgetSummary.actual / budgetSummary.estimated) * 100;
  const isOverBudget = budgetSummary.actual > budgetSummary.estimated;

  return (
    <div className={`min-h-screen pb-32 sm:pb-24 relative overflow-hidden ${ 
      darkMode 
        ? 'bg-[#0f0f1a]' 
        : 'bg-[#faf8f5]'
    }`}>
      {/* Gradient background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: darkMode
            ? 'linear-gradient(135deg, rgba(80, 250, 123, 0.1) 0%, rgba(139, 233, 253, 0.08) 50%, rgba(189, 147, 249, 0.1) 100%)'
            : 'linear-gradient(135deg, rgba(149, 225, 211, 0.2) 0%, rgba(78, 205, 196, 0.15) 50%, rgba(69, 183, 209, 0.12) 100%)',
        }}
      />
      <div 
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: darkMode
            ? 'radial-gradient(circle, rgba(80, 250, 123, 0.2) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(149, 225, 211, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div className="relative pt-12 px-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-white text-3xl mb-2">Budget Tracker</h1>
          <p className="text-white/80">Monitor your travel expenses</p>
        </div>

        {/* Budget Summary Card */}
        <GlassCard className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Total Budget</p>
              <p className="text-white text-3xl">₱{budgetSummary.estimated.toLocaleString()}</p>
            </div>
            <div className={`bg-gradient-to-br ${isOverBudget ? 'from-red-400 to-orange-500' : 'from-teal-400 to-cyan-500'} p-4 rounded-2xl`}>
              <DollarSign className="text-white" size={32} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-white/70 text-sm mb-1">Spent</p>
              <div className="flex items-center gap-2">
                <p className="text-white text-xl">₱{budgetSummary.actual.toLocaleString()}</p>
                <TrendingUp className="text-white" size={16} />
              </div>
            </div>
            <div>
              <p className="text-white/70 text-sm mb-1">Remaining</p>
              <div className="flex items-center gap-2">
                <p className="text-white text-xl">₱{budgetSummary.remaining.toLocaleString()}</p>
                <TrendingDown className="text-white" size={16} />
              </div>
            </div>
          </div>

          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${isOverBudget ? 'from-red-400 to-orange-500' : 'from-teal-400 to-cyan-500'} rounded-full transition-all`}
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            ></div>
          </div>
          <p className="text-white/80 text-sm mt-2">{percentageUsed.toFixed(0)}% of budget used</p>
        </GlassCard>

        {/* View Toggle */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setViewMode('estimated')}
            className={`flex-1 py-3 rounded-2xl text-sm transition-all ${
              viewMode === 'estimated'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/50'
                : 'bg-white/10 text-white/70 border border-white/20'
            }`}
          >
            Estimated
          </button>
          <button
            onClick={() => setViewMode('actual')}
            className={`flex-1 py-3 rounded-2xl text-sm transition-all ${
              viewMode === 'actual'
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/50'
                : 'bg-white/10 text-white/70 border border-white/20'
            }`}
          >
            Actual
          </button>
        </div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl">By Category</h2>
            <PieChart className="text-white" size={20} />
          </div>

          <div className="space-y-3">
            {categories.map((category, index) => {
              const amount = viewMode === 'estimated' ? category.estimated : category.actual;
              const difference = category.actual - category.estimated;
              const isPositive = difference <= 0;

              return (
                <GlassCard key={index} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${category.color}`}></div>
                      <div>
                        <p className="text-white">{category.name}</p>
                        <p className="text-white/60 text-sm">{category.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white">₱{amount.toLocaleString()}</p>
                      {viewMode === 'actual' && (
                        <p className={`text-xs ${isPositive ? 'text-teal-300' : 'text-red-300'}`}>
                          {isPositive ? '↓' : '↑'} ₱{Math.abs(difference).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${category.color} rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
              !filterCategory
                ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/50'
                : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
            }`}
          >
            All
          </button>
          {Object.keys(categoryBreakdown).map(category => (
            <button
              key={category}
              onClick={() => setFilterCategory(filterCategory === category ? null : category)}
              className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition-all ${
                filterCategory === category
                  ? 'bg-gradient-to-r from-teal-400 to-cyan-500 text-white shadow-lg shadow-teal-500/50'
                  : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Recent Expenses */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-xl">Recent Expenses</h2>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="bg-gradient-to-r from-teal-400 to-cyan-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-teal-500/40 hover:shadow-2xl hover:shadow-teal-500/50 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="text-sm">Add</span>
            </button>
          </div>
          <div className="space-y-3">
            {filteredExpenses.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <DollarSign className="text-white/40 mx-auto mb-3" size={48} />
                <p className="text-white/70 mb-1">No expenses yet</p>
                <p className="text-white/50 text-sm">Add your first expense to start tracking</p>
              </GlassCard>
            ) : (
              filteredExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((expense) => (
                  <GlassCard key={expense.id} className="p-4 hover:bg-white/25 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-white mb-1">{expense.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white/60 text-sm">{expense.category}</span>
                          <span className="text-white/40 text-sm">•</span>
                          <span className="text-white/60 text-sm flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-white text-lg">₱{expense.amount.toLocaleString()}</p>
                        <button
                          onClick={() => {
                            setExpenseToDelete({ id: expense.id, name: expense.name });
                            setDeleteModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 bg-red-500/80 backdrop-blur-md hover:bg-red-600/90 p-2 rounded-full transition-all"
                        >
                          <Trash2 size={14} className="text-white" />
                        </button>
                      </div>
                    </div>
                  </GlassCard>
                ))
            )}
          </div>
        </div>

        {/* Export Button */}
        <button className="w-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white py-4 rounded-2xl border border-white/30 transition-all">
          Export Report (PDF)
        </button>
      </div>

      <FloatingActionButton onClick={() => setIsAddExpenseOpen(true)} />
      
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAdd={handleAddExpense}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteExpense}
        itemName={expenseToDelete?.name || ''}
        itemType="expense"
      />
    </div>
  );
}
