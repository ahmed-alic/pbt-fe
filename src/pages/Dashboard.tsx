import React, { useState, useEffect } from 'react';
import { TransactionAPI, BudgetGoalAPI, Transaction, BudgetGoal, TransactionSummary } from '../services/api';
import { FaEdit, FaTrash } from 'react-icons/fa';

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

  const handleUpdateTransaction = async (transaction: Transaction) => {
    if (!transaction.id) {
      setError('Cannot update transaction: Missing ID');
      return;
    }

    try {
      setLoading(true);
      await TransactionAPI.update(transaction.id, {
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        date: transaction.date,
        category: transaction.category,
        budgetgoal: transaction.budgetgoal
      });

      // Refresh data after successful update
      await fetchData();
      setEditingTransaction(null);
      
      // Show success message
      setError('');
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Failed to update transaction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction({ ...transaction });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
    setError('');
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

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Transactions</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget Goal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  {editingTransaction && editingTransaction.id === transaction.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.date}
                          onChange={(e) => setEditingTransaction({
                            ...editingTransaction,
                            date: e.target.value
                          })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.type}
                          onChange={(e) => setEditingTransaction({
                            ...editingTransaction,
                            type: e.target.value as 'Income' | 'Expense'
                          })}
                        >
                          <option value="Income">Income</option>
                          <option value="Expense">Expense</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.description}
                          onChange={(e) => setEditingTransaction({
                            ...editingTransaction,
                            description: e.target.value
                          })}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.category?.id}
                          onChange={(e) => {
                            const categoryId = Number(e.target.value);
                            const category = budgetGoals.find(c => c.id === categoryId);
                            setEditingTransaction({
                              ...editingTransaction,
                              category: category
                            });
                          }}
                        >
                          <option value="">Select Category</option>
                          {budgetGoals.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.budgetgoal?.id}
                          onChange={(e) => {
                            const goalId = Number(e.target.value);
                            const goal = budgetGoals.find(g => g.id === goalId);
                            setEditingTransaction({
                              ...editingTransaction,
                              budgetgoal: goal
                            });
                          }}
                        >
                          <option value="">Select Budget Goal</option>
                          {budgetGoals.map((goal) => (
                            <option key={goal.id} value={goal.id}>
                              {goal.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={editingTransaction.amount}
                          onChange={(e) => setEditingTransaction({
                            ...editingTransaction,
                            amount: Number(e.target.value)
                          })}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleUpdateTransaction(editingTransaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
                          disabled={loading}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.type}</td>
                      <td className="px-6 py-4">{transaction.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.category?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{transaction.budgetgoal?.name || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        ${transaction.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(transaction)}
                          className="text-indigo-600 hover:text-indigo-900 mr-2"
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
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
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
