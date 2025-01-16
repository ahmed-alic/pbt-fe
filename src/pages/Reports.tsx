import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Paper, Typography, Box, FormControl, 
  InputLabel, Select, MenuItem, SelectChangeEvent,
  Grid, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { ReportAPI, CategoryAPI, MonthlyReport, Category, MonthlyTrendData, Transaction } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, parse } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState('current');
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [trendData, setTrendData] = useState<MonthlyTrendData[]>([]);
  const [selectedView, setSelectedView] = useState<'bar' | 'trend'>('bar');
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

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

  const fetchTrendData = useCallback(async () => {
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

      console.log('Fetching trend data:', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        selectedCategories
      });

      const response = await ReportAPI.getCategoryTrends(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        selectedCategories.length > 0 ? selectedCategories : undefined
      );

      console.log('Received trend data:', response.data);
      setTrendData(response.data.trends);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError('Failed to load trend data');
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
    console.log('View type changed:', selectedView);
    loadCategories();
    if (selectedView === 'bar') {
      fetchReport();
    } else {
      fetchTrendData();
    }
  }, [fetchReport, fetchTrendData, selectedView]);

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

  const handleBarClick = async (data: any) => {
    try {
      setSelectedCategory(data.category);
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

      const response = await ReportAPI.getCategoryTransactions(
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        data.category
      );
      
      // Filter transactions by category, safely handling undefined
      const filteredTransactions = response.data.filter(
        transaction => transaction.category?.name === data.category
      );
      
      setSelectedTransactions(filteredTransactions);
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTransactions([]);
    setSelectedCategory('');
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>View Type</InputLabel>
              <Select
                value={selectedView}
                label="View Type"
                onChange={(e) => setSelectedView(e.target.value as 'bar' | 'trend')}
              >
                <MenuItem value="bar">Bar Chart</MenuItem>
                <MenuItem value="trend">Trend Lines</MenuItem>
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

        {selectedView === 'bar' && report && (
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
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="amount" 
                    fill="#8884d8" 
                    name="Amount" 
                    onClick={handleBarClick}
                    cursor="pointer"
                  />
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

        {selectedView === 'trend' && (
          <Box sx={{ mt: 4, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Category Spending Trends
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => format(parse(value, 'yyyy-MM', new Date()), 'MMM yyyy')}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
                    labelFormatter={(label) => format(parse(label as string, 'yyyy-MM', new Date()), 'MMMM yyyy')}
                  />
                  <Legend />
                  {Object.keys(trendData[0].categoryData).map((category, index) => (
                    <Line
                      key={category}
                      type="monotone"
                      dataKey={`categoryData.${category}`}
                      stroke={COLORS[index % COLORS.length]}
                      name={category}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="text.secondary">No trend data available</Typography>
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* Transaction Details Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Transactions for {selectedCategory}
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{format(new Date(transaction.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell align="right">${transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>{transaction.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Reports;
