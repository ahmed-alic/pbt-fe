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
  name: string;
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
  update: (id: number, transaction: Omit<Transaction, 'id'>) => api.put<Transaction>(`/transaction/update/${id}`, transaction),
  delete: (id: number) => api.delete(`/transaction/${id}`),
  suggestCategory: (transactionId: number) => api.get<string>(`/transaction/suggest/${transactionId}`),
  getSummary: () => api.get<TransactionSummary>('/transaction/summary')
};

export const CategoryAPI = {
  getAll: async () => {
    try {
      console.log('Fetching all categories...');
      const response = await api.get<Category[]>('/category');
      console.log('Categories response:', response);
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid categories response:', response);
        throw new Error('Invalid categories response');
      }
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },
  add: (category: Omit<Category, 'id'>) => api.post<Category>('/category/create', category),
  update: (id: number, category: Omit<Category, 'id'>) => api.put<Category>(`/category/update/${id}`, category),
  delete: (id: number) => api.delete(`/category/${id}`),
  suggestForTransaction: async (description: string) => {
    console.log('Making suggestion request for:', description);
    try {
      const url = `/category/suggest?description=${encodeURIComponent(description)}`;
      console.log('Full request URL:', `http://localhost:8080/api${url}`);
      const response = await api.get<string>(url);
      console.log('Raw response:', response);
      return response;
    } catch (error) {
      console.error('Error in suggestForTransaction:', error);
      throw error;
    }
  },
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
