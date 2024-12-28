import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddTransaction from './pages/AddTransaction';
import Categories from './pages/Categories';
import BudgetGoals from './pages/BudgetGoals';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* Navigation */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/categories" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900 ml-4">
                  Categories
                </Link>
                <Link to="/budget-goals" className="flex items-center px-2 py-2 text-gray-700 hover:text-gray-900 ml-4">
                  Budget Goals
                </Link>
              </div>
              <div className="flex items-center">
                <Link
                  to="/add-transaction"
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add Transaction
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-transaction" element={<AddTransaction />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budget-goals" element={<BudgetGoals />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
