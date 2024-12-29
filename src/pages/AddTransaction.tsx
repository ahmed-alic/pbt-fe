import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TransactionAPI, CategoryAPI, BudgetGoalAPI, Category, BudgetGoal, Transaction } from '../services/api';
import Button from '../components/Button';

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetGoals, setBudgetGoals] = useState<BudgetGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedCategory, setSuggestedCategory] = useState<Category | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

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
      setLoading(true);
      setError('');
      try {
        console.log('Fetching categories and budget goals...');
        const [categoriesRes, budgetGoalsRes] = await Promise.all([
          CategoryAPI.getAll(),
          BudgetGoalAPI.getAll()
        ]);
        
        console.log('Categories response:', categoriesRes);
        console.log('Budget goals response:', budgetGoalsRes);
        
        if (!Array.isArray(categoriesRes.data)) {
          throw new Error('Categories data is not an array');
        }
        
        if (!Array.isArray(budgetGoalsRes.data)) {
          throw new Error('Budget goals data is not an array');
        }
        
        setCategories(categoriesRes.data);
        
        const filteredBudgetGoals = budgetGoalsRes.data.filter(goal => 
          transaction.type === 'Expense' ? true : goal.timePeriod !== 'Expense'
        );
        setBudgetGoals(filteredBudgetGoals);

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
        setError('Failed to load categories or budget goals. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [transaction.type]);

  // Enhanced category suggestion with debounce and loading state
  useEffect(() => {
    const suggestCategory = async () => {
      if (transaction.description.trim().length > 3) {
        setIsSuggesting(true);
        try {
          const response = await CategoryAPI.suggestForTransaction(transaction.description);
          const suggestedCategoryName = response.data;
          const category = categories.find(c => c.name.toLowerCase() === suggestedCategoryName.toLowerCase());
          setSuggestedCategory(category || null);
        } catch (error) {
          console.error('Error getting category suggestion:', error);
          setSuggestedCategory(null);
        } finally {
          setIsSuggesting(false);
        }
      } else {
        setSuggestedCategory(null);
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
        category: suggestedCategory
      }));
      setSuggestedCategory(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add Transaction</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <div className="relative">
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transaction.description}
              onChange={async (e) => {
                const newDescription = e.target.value;
                setTransaction({ ...transaction, description: newDescription });
                
                if (newDescription.length > 3) {
                  setIsSuggesting(true);
                  try {
                    console.log('Fetching suggestion for:', newDescription);
                    const response = await CategoryAPI.suggestForTransaction(newDescription);
                    console.log('Suggestion response:', response);
                    if (response.data) {
                      const suggestedName = response.data.trim().toLowerCase();
                      console.log('Looking for category with name:', suggestedName);
                      console.log('Available categories:', categories);
                      const suggestedCat = categories.find(
                        cat => cat.name.toLowerCase() === suggestedName
                      );
                      if (suggestedCat) {
                        console.log('Matching category found:', suggestedCat);
                        setSuggestedCategory(suggestedCat);
                      } else {
                        console.log('No matching category found for:', suggestedName);
                        console.log('Available categories:', categories.map(c => c.name));
                      }
                    }
                  } catch (error) {
                    console.error('Error getting category suggestion:', error);
                  } finally {
                    setIsSuggesting(false);
                  }
                } else {
                  setSuggestedCategory(null);
                }
              }}
              placeholder="Enter transaction description"
            />
            {isSuggesting && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          {suggestedCategory && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Suggested category: <span className="font-medium">{suggestedCategory.name}</span>
                </span>
                <Button
                  type="button"
                  onClick={applySuggestedCategory}
                  variant="secondary"
                  className="text-sm"
                >
                  Apply Suggestion
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              Type
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transaction.type}
              onChange={(e) => setTransaction({ ...transaction, type: e.target.value as 'Income' | 'Expense' })}
            >
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
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
                const categoryId = parseInt(e.target.value);
                const selectedCategory = categories.find(c => c.id === categoryId);
                setTransaction({ ...transaction, category: selectedCategory });
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Goal (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={transaction.budgetgoal?.id || ''}
              onChange={(e) => {
                const goalId = parseInt(e.target.value);
                const selectedGoal = budgetGoals.find(g => g.id === goalId);
                setTransaction({ ...transaction, budgetgoal: selectedGoal });
              }}
            >
              <option value="">Select a budget goal</option>
              {budgetGoals.map((goal) => {
                const selectedGoal = budgetGoals.find(g => g.id === goal.id);
                return (
                  <option key={goal.id} value={goal.id}>
                    ${selectedGoal?.amount} - {selectedGoal?.timePeriod}
                  </option>
                );
              })}
            </select>
          </div>
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

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
