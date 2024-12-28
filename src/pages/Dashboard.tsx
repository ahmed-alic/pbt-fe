import React, { useState, useEffect } from 'react';
import { TransactionAPI, BudgetGoalAPI, Transaction, BudgetGoal, TransactionSummary } from '../services/api';

const Dashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
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

      setTransactions(transactionsRes.data);
      setBudgetGoals(budgetGoalsRes.data);

      // Calculate summary manually since we don't have the endpoint yet
      const totalIncome = transactionsRes.data
        .filter(t => t.type === 'Income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpense = transactionsRes.data
        .filter(t => t.type === 'Expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setSummary({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        recentTransactions: transactionsRes.data.slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Income</h3>
          <p className="text-2xl text-green-600">${summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Total Expenses</h3>
          <p className="text-2xl text-red-600">${summary.totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Balance</h3>
          <p className={`text-2xl ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${summary.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Transactions</h3>
          <div className="divide-y">
            {transactions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No transactions yet</p>
            ) : (
              transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="py-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.date).toLocaleDateString()} • {transaction.category?.name}
                    </p>
                  </div>
                  <p className={`font-medium ${
                    transaction.type === 'Income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'Income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Budget Goals Progress */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Budget Goals Progress</h3>
          <div className="space-y-4">
            {budgetGoals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No budget goals yet</p>
            ) : (
              budgetGoals.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{goal.timePeriod} Budget</p>
                    <p className="text-sm text-gray-600">
                      ${goal.currentSpending.toLocaleString()} of ${goal.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${
                        (goal.currentSpending / goal.amount) > 0.9
                          ? 'bg-red-500'
                          : (goal.currentSpending / goal.amount) > 0.7
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((goal.currentSpending / goal.amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
