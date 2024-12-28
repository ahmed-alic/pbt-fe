import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

export interface Category {
  id: number;
  name: string;
}

export interface BudgetGoal {
  id: number;
  amount: number;
  timePeriod: string;
  currentSpending: number;
}

export interface Transaction {
  id?: number;
  amount: number;
  type: 'Income' | 'Expense';
  description: string;
  date: string;
  category?: Category;
  budgetgoal?: BudgetGoal;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  recentTransactions: Transaction[];
}

export const TransactionAPI = {
  getAll: () => api.get<Transaction[]>('/transaction/'),
  getById: (id: number) => api.get<Transaction>(`/transaction/${id}`),
  add: (transaction: Omit<Transaction, 'id'>) => api.post<Transaction>('/transaction/create', transaction),
  delete: (id: number) => api.delete(`/transaction/${id}`),
  suggestCategory: (transactionId: number) => api.get<string>(`/transaction/suggest/${transactionId}`),
  getSummary: () => api.get<TransactionSummary>('/transaction/summary'),
};

export const CategoryAPI = {
  getAll: () => api.get<Category[]>('/category/'),
  add: (category: Omit<Category, 'id'>) => api.post<Category>('/category/create', category),
  suggestForTransaction: (description: string) => api.get<string>(`/category/suggest/${description}`),
};

export const BudgetGoalAPI = {
  getAll: () => api.get<BudgetGoal[]>('/budget-goal/'),
  getById: (id: number) => api.get<BudgetGoal>(`/budget-goal/${id}`),
  add: (budgetGoal: Omit<BudgetGoal, 'id'>) => api.post<BudgetGoal>('/budget-goal/create', budgetGoal),
  update: (id: number, budgetGoal: Omit<BudgetGoal, 'id'>) => 
    api.put<BudgetGoal>(`/budget-goal/update/${id}`, budgetGoal),
  delete: (id: number) => api.delete(`/budget-goal/${id}`),
};

export default api;
