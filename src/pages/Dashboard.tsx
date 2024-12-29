import React, { useState, useEffect } from 'react';
import { TransactionAPI, BudgetGoalAPI, Transaction, BudgetGoal, TransactionSummary } from '../services/api';
import { FaEdit, FaTrash } from 'react-icons/fa';
import Button from '../components/Button';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, budgetGoalsRes] = await Promise.all([
        TransactionAPI.getAll(),
        BudgetGoalAPI.getAll()
      ]);

      console.log('Budget Goals Response:', budgetGoalsRes);
      
      if (!Array.isArray(budgetGoalsRes.data)) {
        console.error('Budget goals data is not an array:', budgetGoalsRes.data);
        setBudgetGoals([]);
        return;
      }

      // Validate budget goals data
      const validBudgetGoals = budgetGoalsRes.data.filter(goal => 
        goal && typeof goal.amount === 'number' && typeof goal.currentSpending === 'number'
      );

      console.log('Valid Budget Goals:', validBudgetGoals);
      setBudgetGoals(validBudgetGoals);

      const validTransactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : [];
      setTransactions(validTransactions);

      const totalIncome = validTransactions
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      
      const totalExpense = validTransactions
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        recentTransactions: validTransactions.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await TransactionAPI.delete(id);
        fetchData(); // Refresh data after deletion
      } catch (error) {
        console.error('Error deleting transaction:', error);
        setError('Failed to delete transaction');
      }
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      // Ensure we have all required fields
      const updateData: Omit<Transaction, 'id'> = {
        amount: editingTransaction.amount,
        description: editingTransaction.description,
        type: editingTransaction.type,
        date: editingTransaction.date,
        category: editingTransaction.category,
        budgetgoal: editingTransaction.budgetgoal
      };
      
      await TransactionAPI.update(editingTransaction.id!, updateData);
      setEditingTransaction(null);
      fetchData(); // Refresh data after update
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Failed to update transaction');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Income</h3>
          <p className="text-2xl text-green-600">${summary.totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Expenses</h3>
          <p className="text-2xl text-red-600">${summary.totalExpense.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Balance</h3>
          <p className={`text-2xl ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Edit Transaction</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={editingTransaction.amount}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    amount: parseFloat(e.target.value)
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    description: e.target.value
                  })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={editingTransaction.type}
                  onChange={e => setEditingTransaction({
                    ...editingTransaction,
                    type: e.target.value as 'Income' | 'Expense'
                  })}
                  className="w-full p-2 border rounded"
                >
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setEditingTransaction(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(transaction.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{transaction.description}</td>
                    <td className="px-6 py-4">{transaction.type}</td>
                    <td className={`px-6 py-4 ${transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'}`}>
                      ${transaction.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <FaEdit className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id!)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTrash className="inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mt-6">
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Budget Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetGoals && budgetGoals.length > 0 ? (
              budgetGoals.map(goal => (
                <div key={goal.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">{goal.name}</h3>
                  <p className="text-gray-600">Amount: ${goal.amount?.toFixed(2) || '0.00'}</p>
                  <p className="text-gray-600">Current Spending: ${goal.currentSpending?.toFixed(2) || '0.00'}</p>
                  <p className="text-gray-600">Time Period: {goal.timePeriod}</p>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500">No budget goals found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
