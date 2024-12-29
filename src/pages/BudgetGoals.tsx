import React, { useState, useEffect } from 'react';
import { BudgetGoalAPI, BudgetGoal } from '../services/api';

const BudgetGoals: React.FC = () => {
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [newGoal, setNewGoal] = useState<Omit<BudgetGoal, 'id'>>({
    name: '',
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
      console.log('Budget Goals Response:', response);
      
      if (!Array.isArray(response.data)) {
        console.error('Budget goals data is not an array:', response.data);
        setBudgetGoals([]);
        return;
      }

      // Validate budget goals data
      const validBudgetGoals = response.data.filter(goal => 
        goal && typeof goal.amount === 'number' && typeof goal.currentSpending === 'number'
      );

      console.log('Valid Budget Goals:', validBudgetGoals);
      setBudgetGoals(validBudgetGoals);
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
        name: '',
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
                Name
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="Enter name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

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
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Current Budget Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgetGoals && budgetGoals.length > 0 ? (
              budgetGoals.map(goal => (
                <div key={goal.id} className="bg-white p-6 rounded-lg shadow-md">
                  <h4 className="font-semibold text-lg mb-2">{goal.name}</h4>
                  <p className="text-gray-600">Amount: ${goal.amount?.toFixed(2) || '0.00'}</p>
                  <p className="text-gray-600">Current Spending: ${goal.currentSpending?.toFixed(2) || '0.00'}</p>
                  <p className="text-gray-600">Time Period: {goal.timePeriod}</p>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center text-gray-500 py-8">
                No budget goals found. Create one above!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetGoals;
