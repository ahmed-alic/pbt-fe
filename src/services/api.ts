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

export interface MonthlySpending {
  category: string;
  amount: number;
  percentage: number;
  transactionCount: number;
}

export interface MonthlyReport {
  startDate: string;
  endDate: string;
  totalSpending: number;
  spendingByCategory: MonthlySpending[];
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
      if (!response.data) {
        throw new Error('No data received from categories endpoint');
      }
      return response;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  add: async (category: Omit<Category, 'id'>) => {
    try {
      console.log('Creating category:', category);
      const response = await api.post<Category>('/category/create', category);
      console.log('Category created:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  update: async (id: number, category: Omit<Category, 'id'>) => {
    try {
      console.log(`Updating category ${id}:`, category);
      const response = await api.put<Category>(`/category/${id}`, category);
      console.log('Category updated:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  delete: async (id: number) => {
    try {
      console.log('Deleting category:', id);
      const response = await api.delete(`/category/${id}`);
      console.log('Category deleted');
      return response;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  },

  suggestForTransaction: async (description: string) => {
    try {
      console.log('Requesting category suggestion for:', description);
      const url = `/category/suggest?description=${encodeURIComponent(description)}`;
      const response = await api.get<string>(url);
      console.log('Category suggestion:', response.data);
      return response;
    } catch (error) {
      console.error('Error getting category suggestion:', error);
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

export const ReportAPI = {
  getMonthlySpending: (startDate: string, endDate: string, categories?: string[]) => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (categories && categories.length > 0) {
      categories.forEach(category => params.append('categories', category));
    }
    return api.get<MonthlyReport>(`/reports/monthly-spending?${params.toString()}`);
  },
  exportToPDF: async (startDate: string, endDate: string, categories?: string[]) => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (categories && categories.length > 0) {
      categories.forEach(category => params.append('categories', category));
    }
    
    const response = await api.get(`/reports/export-pdf?${params.toString()}`, {
      responseType: 'blob'
    });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(new Blob([response.data]));
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    
    // Set the filename from the Content-Disposition header or use a default
    const contentDisposition = response.headers['content-disposition'];
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `spending-report-${startDate}-to-${endDate}.pdf`;
    
    link.setAttribute('download', filename);
    
    // Append link to body, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    window.URL.revokeObjectURL(url);
  }
};

export default api;
