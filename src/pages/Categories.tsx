import React, { useState, useEffect } from 'react';
import { CategoryAPI, Category } from '../services/api';
import { FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await CategoryAPI.getAll();
      setCategories(response.data);
      setError('');
    } catch (error: any) {
      setError('Failed to load categories. Please try again.');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    setError('');

    try {
      await CategoryAPI.add({ name: newCategory.trim() });
      setNewCategory('');
      await fetchCategories();
      showSuccess('Category added successfully!');
    } catch (error: any) {
      setError('Failed to add category. Please try again.');
      console.error('Error adding category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory({ ...category });
    setError('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    setLoading(true);
    setError('');

    try {
      await CategoryAPI.update(editingCategory.id, {
        name: editingCategory.name
      });
      setEditingCategory(null);
      await fetchCategories();
      showSuccess('Category updated successfully!');
    } catch (error: any) {
      setError('Failed to update category. Please try again.');
      console.error('Error updating category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setLoading(true);
    setError('');

    try {
      await CategoryAPI.delete(id);
      await fetchCategories();
      showSuccess('Category deleted successfully!');
    } catch (error: any) {
      setError('Failed to delete category. Please try again.');
      console.error('Error deleting category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Add Category Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 p-2 border rounded"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading || !newCategory.trim()}
          >
            {loading ? <FaSpinner className="animate-spin" /> : 'Add Category'}
          </button>
        </div>
      </form>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-6 py-4">
                  {editingCategory?.id === category.id ? (
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value
                        })
                      }
                      className="w-full p-2 border rounded"
                      disabled={loading}
                    />
                  ) : (
                    category.name
                  )}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  {editingCategory?.id === category.id ? (
                    <>
                      <button
                        onClick={handleUpdate}
                        className="text-green-600 hover:text-green-900 mr-3"
                        disabled={loading}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        disabled={loading}
                      >
                        <FaEdit className="inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={loading}
                      >
                        <FaTrash className="inline" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
