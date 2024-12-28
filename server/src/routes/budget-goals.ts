import express from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';

const router = express.Router();

// Get all budget goals
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM budget_goal');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching budget goals', error });
  }
});

// Add new budget goal
router.post('/', async (req, res) => {
  const { amount, time_period } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO budget_goal (amount, time_period) VALUES (?, ?)',
      [amount, time_period]
    );
    res.status(201).json({ message: 'Budget goal added successfully', id: result });
  } catch (error) {
    res.status(500).json({ message: 'Error adding budget goal', error });
  }
});

// Update current spending
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { current_spending } = req.body;
  try {
    await db.query(
      'UPDATE budget_goal SET current_spending = ? WHERE id = ?',
      [current_spending, id]
    );
    res.json({ message: 'Budget goal updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating budget goal', error });
  }
});

export default router;
