import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionAPI, CategoryAPI, BudgetGoalAPI, Category, BudgetGoal, Transaction } from '../services/api';

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(null);

  const [transaction, setTransaction] = useState<Omit<Transaction, 'id'>>({
    description: '',
    amount: 0,
    type: 'Expense',
    date: new Date().toISOString().split('T')[0],
    category: undefined,
    budgetgoal: undefined
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, budgetGoalsRes] = await Promise.all([
          CategoryAPI.getAll(),
          BudgetGoalAPI.getAll()
        ]);
        setCategories(categoriesRes.data);
        
        // Filter budget goals based on transaction type
        const filteredBudgetGoals = budgetGoalsRes.data.filter(goal => 
          transaction.type === 'Expense' ? true : goal.timePeriod !== 'Expense'
        );
        setBudgetGoals(filteredBudgetGoals);

        // If current budget goal is not compatible with new type, reset it
        if (transaction.budgetgoal) {
          const isCompatible = filteredBudgetGoals.some(goal => 
            goal.id === transaction.budgetgoal?.id
          );
          
          if (!isCompatible) {
            setTransaction(prev => ({
              ...prev,
              budgetgoal: undefined
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load categories or budget goals');
      }
    };
    fetchData();
  }, [transaction.type]);

  // Suggest category when description changes
  useEffect(() => {
    const suggestCategory = async () => {
      if (transaction.description.trim().length > 3) {
        try {
          const response = await CategoryAPI.suggestForTransaction(transaction.description);
          const suggestedCategoryName = response.data;
          const category = categories.find(c => c.name === suggestedCategoryName);
          setSuggestedCategory(category || null);
        } catch (error) {
          console.error('Error getting category suggestion:', error);
        }
      }
    };

    const timeoutId = setTimeout(suggestCategory, 500);
    return () => clearTimeout(timeoutId);
  }, [transaction.description, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await TransactionAPI.add(transaction);
      navigate('/');
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      setError(error.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const applySuggestedCategory = () => {
    if (suggestedCategory) {
      setTransaction(prev => ({
        ...prev,
        category: {
          id: suggestedCategory.id,
          name: suggestedCategory.name
        }
      }));
      setSuggestedCategory(null);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add Transaction</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transaction.description}
            onChange={(e) => setTransaction({ ...transaction, description: e.target.value })}
          />
          {suggestedCategory && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Suggested category: {suggestedCategory.name}
              </span>
              <button
                type="button"
                onClick={applySuggestedCategory}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transaction.amount || ''}
            onChange={(e) => setTransaction({ ...transaction, amount: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transaction.date}
            onChange={(e) => setTransaction({ ...transaction, date: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transaction.type}
            onChange={(e) => {
              const newType = e.target.value as 'Income' | 'Expense';
              setTransaction({ 
                ...transaction, 
                type: newType,
                budgetgoal: undefined // Reset budget goal when type changes
              });
            }}
          >
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={transaction.category?.id || ''}
            onChange={(e) => {
              const categoryId = e.target.value;
              const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
              setTransaction(prev => ({
                ...prev,
                category: selectedCategory ? {
                  id: selectedCategory.id,
                  name: selectedCategory.name
                } : undefined
              }));
            }}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {transaction.type === 'Expense' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Goal
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transaction.budgetgoal?.id || ''}
              onChange={(e) => {
                const goalId = e.target.value;
                const selectedGoal = budgetGoals.find(g => g.id === parseInt(goalId));
                setTransaction(prev => ({
                  ...prev,
                  budgetgoal: selectedGoal ? {
                    id: selectedGoal.id,
                    amount: selectedGoal.amount,
                    timePeriod: selectedGoal.timePeriod,
                    currentSpending: selectedGoal.currentSpending
                  } : undefined
                }));
              }}
            >
              <option value="">Select a budget goal</option>
              {budgetGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  ${goal.amount} - {goal.timePeriod}
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
