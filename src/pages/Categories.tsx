import React, { useState, useEffect } from 'react';
import { CategoryAPI, Category } from '../services/api';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await CategoryAPI.getAll();
      console.log('Categories response:', response);
      setCategories(response.data);
    } catch (error: any) {
      console.error('Error fetching categories:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setError('Failed to load categories');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    setError('');

    try {
      const category: Omit<Category, 'id'> = {
        name: newCategory.trim()
      };
      console.log('Sending category request:', {
        url: '/api/category/create',
        data: category
      });
      const response = await CategoryAPI.add(category);
      console.log('Add category response:', response);
      setNewCategory('');
      await fetchCategories();
    } catch (error: any) {
      console.error('Error adding category:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      });
      setError(error.response?.data?.message || 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Categories</h2>
        
        {/* Add Category Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={loading || !newCategory.trim()}
            >
              {loading ? 'Adding...' : 'Add Category'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-500 text-sm">{error}</p>
          )}
        </form>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="divide-y">
            {categories.length === 0 ? (
              <p className="p-4 text-gray-500">No categories added yet</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="font-medium">{category.name}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
