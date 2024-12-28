import express from 'express';
import cors from 'cors';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import budgetGoalRoutes from './routes/budget-goals';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budget-goals', budgetGoalRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
