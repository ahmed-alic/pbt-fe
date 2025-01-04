import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Paper, Typography, Box, FormControl, 
  InputLabel, Select, MenuItem, SelectChangeEvent,
  Grid, CircularProgress, Button
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { ReportAPI, CategoryAPI, MonthlyReport, Category } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('current');
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let startDate: Date;
      let endDate: Date;

      switch (timeRange) {
        case 'current':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'last':
          startDate = startOfMonth(subMonths(new Date(), 1));
          endDate = endOfMonth(subMonths(new Date(), 1));
          break;
        case 'last3':
          startDate = startOfMonth(subMonths(new Date(), 3));
          endDate = endOfMonth(new Date());
          break;
        default:
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
      }

      const response = await ReportAPI.getMonthlySpending(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        selectedCategories.length > 0 ? selectedCategories : undefined
      );
      setReport(response.data);
    } catch (err) {
      setError('Failed to load report data');
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedCategories]);

  const loadCategories = async () => {
    try {
      const response = await CategoryAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    loadCategories();
    fetchReport();
  }, [fetchReport]);

  const handleTimeRangeChange = (event: SelectChangeEvent) => {
    setTimeRange(event.target.value);
  };

  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    setSelectedCategories(event.target.value as string[]);
  };

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      let startDate: Date;
      let endDate: Date;

      switch (timeRange) {
        case 'current':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'last':
          startDate = startOfMonth(subMonths(new Date(), 1));
          endDate = endOfMonth(subMonths(new Date(), 1));
          break;
        case 'last3':
          startDate = startOfMonth(subMonths(new Date(), 3));
          endDate = endOfMonth(new Date());
          break;
        default:
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
      }

      await ReportAPI.exportToPDF(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        selectedCategories.length > 0 ? selectedCategories : undefined
      );
    } catch (err) {
      setError('Failed to export PDF report');
      console.error('Error exporting PDF:', err);
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h4" gutterBottom>
          Spending Reports
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
              >
                <MenuItem value="current">Current Month</MenuItem>
                <MenuItem value="last">Last Month</MenuItem>
                <MenuItem value="last3">Last 3 Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Filter Categories</InputLabel>
              <Select
                multiple
                value={selectedCategories}
                label="Filter Categories"
                onChange={handleCategoryChange}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleExportPDF}
              disabled={exportLoading || loading}
              startIcon={exportLoading ? <CircularProgress size={20} /> : undefined}
              sx={{ mt: 2 }}
            >
              {exportLoading ? 'Exporting...' : 'Export PDF'}
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {report && (
          <>
            <Typography variant="h6" sx={{ mt: 4 }}>
              Total Spending: ${report.totalSpending.toFixed(2)}
            </Typography>

            <Box sx={{ mt: 4, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Spending by Category
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.spendingByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" name="Amount ($)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 4, height: 400 }}>
              <Typography variant="h6" gutterBottom>
                Spending Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.spendingByCategory}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={(entry) => `${entry.category} (${entry.percentage.toFixed(1)}%)`}
                  >
                    {report.spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default Reports;
