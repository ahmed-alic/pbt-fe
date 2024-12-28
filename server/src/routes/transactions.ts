import express from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import db from '../config/db';

const router = express.Router();

// Get all transactions with category and budget goal info
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, c.name as category_name, bg.amount as budget_amount, bg.time_period
      FROM transaction t
      LEFT JOIN category c ON t.category_id = c.id
      LEFT JOIN budget_goal bg ON t.budgetgoal_id = bg.id
      ORDER BY t.date DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions', error });
  }
});

// Add new transaction
router.post('/', async (req, res) => {
  const { description, amount, date, type, category_id, budgetgoal_id } = req.body;
  const finalAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount);

  try {
    // Start transaction
    await db.query('START TRANSACTION');

    // Insert transaction
    const [result] = await db.query<ResultSetHeader>(
      'INSERT INTO transaction (description, amount, date, type, category_id, budgetgoal_id) VALUES (?, ?, ?, ?, ?, ?)',
      [description, finalAmount, date, type, category_id, budgetgoal_id]
    );

    // If it's an expense and has a budget goal, update the current spending
    if (type === 'expense' && budgetgoal_id) {
      await db.query(
        'UPDATE budget_goal SET current_spending = current_spending + ? WHERE id = ?',
        [Math.abs(finalAmount), budgetgoal_id]
      );
    }

    // Commit transaction
    await db.query('COMMIT');

    res.status(201).json({ message: 'Transaction added successfully', id: result.insertId });
  } catch (error) {
    // Rollback in case of error
    await db.query('ROLLBACK');
    res.status(500).json({ message: 'Error adding transaction', error });
  }
});

// Get summary (total balance, income, expenses)
router.get('/summary', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(ABS(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END)), 0) as expenses,
        COALESCE(SUM(amount), 0) as total_balance
      FROM transaction
    `) as RowDataPacket[];
    
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching summary', error });
  }
});

// Get transactions by category
router.get('/by-category/:categoryId', async (req, res) => {
  const { categoryId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT * FROM transaction WHERE category_id = ? ORDER BY date DESC',
      [categoryId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions by category', error });
  }
});

export default router;
