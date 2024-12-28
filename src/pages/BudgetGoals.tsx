import React, { useState, useEffect } from 'react';
import { BudgetGoalAPI, BudgetGoal } from '../services/api';

const BudgetGoals: React.FC = () => {
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [newGoal, setNewGoal] = useState<Omit<BudgetGoal, 'id'>>({
    amount: 0,
    timePeriod: 'Monthly',
    currentSpending: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBudgetGoals();
  }, []);

  const fetchBudgetGoals = async () => {
    try {
      const response = await BudgetGoalAPI.getAll();
      setBudgetGoals(response.data);
    } catch (error) {
      console.error('Error fetching budget goals:', error);
      setError('Failed to load budget goals');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.amount <= 0) return;

    setLoading(true);
    setError('');

    try {
      await BudgetGoalAPI.add(newGoal);
      setNewGoal({
        amount: 0,
        timePeriod: 'Monthly',
        currentSpending: 0
      });
      await fetchBudgetGoals();
    } catch (error: any) {
      console.error('Error adding budget goal:', error);
      setError(error.response?.data?.message || 'Failed to add budget goal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await BudgetGoalAPI.delete(id);
      await fetchBudgetGoals();
    } catch (error: any) {
      console.error('Error deleting budget goal:', error);
      setError(error.response?.data?.message || 'Failed to delete budget goal');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Budget Goals</h2>
        
        {/* Add Budget Goal Form */}
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={newGoal.amount}
                onChange={(e) => setNewGoal({ ...newGoal, amount: parseFloat(e.target.value) })}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Period
              </label>
              <select
                value={newGoal.timePeriod}
                onChange={(e) => setNewGoal({ ...newGoal, timePeriod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
                <option value="Weekly">Weekly</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading || newGoal.amount <= 0}
            >
              {loading ? 'Adding...' : 'Add Budget Goal'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-500 text-sm">{error}</p>
          )}
        </form>

        {/* Budget Goals List */}
        <div className="space-y-4">
          {budgetGoals.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No budget goals added yet</p>
          ) : (
            budgetGoals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white rounded-lg shadow-md p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">${goal.amount.toLocaleString()}</h3>
                    <p className="text-gray-600">{goal.timePeriod}</p>
                  </div>
                  <button
                    onClick={() => goal.id && handleDelete(goal.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>${goal.currentSpending.toLocaleString()} spent</span>
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
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BudgetGoals;
