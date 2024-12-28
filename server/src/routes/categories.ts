import express from 'express';
import { RowDataPacket } from 'mysql2';
import db from '../config/db';

const router = express.Router();

// Get all categories
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM category');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
});

// Add new category
router.post('/', async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO category (name) VALUES (?)',
      [name]
    );
    res.status(201).json({ message: 'Category added successfully', id: result });
  } catch (error) {
    res.status(500).json({ message: 'Error adding category', error });
  }
});

export default router;
