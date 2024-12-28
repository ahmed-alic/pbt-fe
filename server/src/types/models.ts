export interface Category {
  id: number;
  name: string;
}

export interface BudgetGoal {
  id: number;
  amount: number;
  current_spending: number;
  time_period: string;
}

export interface Transaction {
  id: number;
  amount: number;
  date: Date;
  description: string;
  type: 'income' | 'expense';
  category_id?: number;
  budgetgoal_id?: number;
  category?: Category;
  budgetGoal?: BudgetGoal;
}
