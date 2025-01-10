import React, { useState, useEffect, useMemo } from 'react';
import { TransactionAPI, BudgetGoalAPI, Transaction, BudgetGoal, TransactionSummary } from '../services/api';
import { FaEdit, FaTrash, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import { TextField, Select, MenuItem, FormControl, InputLabel, Box, IconButton, 
         Grid, Typography, InputAdornment } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

type SortField = 'amount' | 'type' | 'date' | 'description';
type SortDirection = 'asc' | 'desc';

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

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Filter states
  const [filters, setFilters] = useState({
    minAmount: '',
    maxAmount: '',
    type: 'all',
    startDate: null as Date | null,
    endDate: null as Date | null,
  });

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const handleFilterChange = (field: string, value: string | Date | null) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply filters
    if (filters.minAmount !== '') {
      filtered = filtered.filter(t => t.amount >= Number(filters.minAmount));
    }
    if (filters.maxAmount !== '') {
      filtered = filtered.filter(t => t.amount <= Number(filters.maxAmount));
    }
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    if (filters.startDate) {
      filtered = filtered.filter(t => new Date(t.date) >= filters.startDate!);
    }
    if (filters.endDate) {
      filtered = filtered.filter(t => new Date(t.date) <= filters.endDate!);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'amount':
          return (a.amount - b.amount) * direction;
        case 'type':
          return a.type.localeCompare(b.type) * direction;
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
        case 'description':
          return a.description.localeCompare(b.description) * direction;
        default:
          return 0;
      }
    });
  }, [transactions, sortField, sortDirection, filters]);

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

      <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Filters</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Min Amount"
              type="number"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange('minAmount', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              label="Max Amount"
              type="number"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Income">Income</MenuItem>
                <MenuItem value="Expense">Expense</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Date
                  <IconButton size="small" onClick={() => handleSort('date')}>
                    {getSortIcon('date')}
                  </IconButton>
                </Box>
              </th>
              <th>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Description
                  <IconButton size="small" onClick={() => handleSort('description')}>
                    {getSortIcon('description')}
                  </IconButton>
                </Box>
              </th>
              <th>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Type
                  <IconButton size="small" onClick={() => handleSort('type')}>
                    {getSortIcon('type')}
                  </IconButton>
                </Box>
              </th>
              <th>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Amount
                  <IconButton size="small" onClick={() => handleSort('amount')}>
                    {getSortIcon('amount')}
                  </IconButton>
                </Box>
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedTransactions.map((transaction) => (
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
                    <td className="px-6 py-4">{transaction.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{transaction.type}</td>
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
      </Box>

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
