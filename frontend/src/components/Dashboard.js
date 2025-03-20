import React, { useState, useEffect, useMemo } from 'react';
import { Container, Box, Paper, Typography, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getMISOData } from '../services/api.js';

const Dashboard = () => {
  const [misoData, setMisoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getMISOData();
        setMisoData(data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch MISO data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // fetch new every 60 seconds
    const intervalId = setInterval(fetchData, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const displayedNodes = useMemo(() => {
    if (!misoData) return [];
    
    return misoData.nodes.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [misoData, page, rowsPerPage]);
  
  // prepare data for charts
  const chartData = useMemo(() => {
    return displayedNodes.map(node => ({
      nodeName: node.node,
      lmp: Number(node.lmp),
      mcc: Number(node.mcc),
      mlc: Number(node.mlc),
    }));
  }, [displayedNodes]);

  if (loading && !misoData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error && !misoData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        MISO Realtime Data Dashboard
      </Typography>
      
      {misoData && (
        <Box mb={4}>
          <Box display="flex" gap={2} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
            <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Start Time (UTC)
              </Typography>
              <Typography variant="h6">
                {new Date(misoData.interval_start).toLocaleTimeString()}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                End Time (UTC)
              </Typography>
              <Typography variant="h6">
                {new Date(misoData.interval_end).toLocaleTimeString()}
              </Typography>
            </Paper>
            <Paper sx={{ p: 2, textAlign: 'center', flex: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Node Count
              </Typography>
              <Typography variant="h6">
                {misoData.node_count}
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}
      
      <Box display="flex" flexDirection="column" gap={3}>
        <Box>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold' }}>
              MISO Node Data
            </Typography>
            <TableContainer sx={{ maxHeight: '400px' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Node</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>LMP</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>MCC</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>MLC</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedNodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell>{node.node}</TableCell>
                      <TableCell align="center">{formatNumber(node.lmp)}</TableCell>
                      <TableCell align="center">{formatNumber(node.mcc)}</TableCell>
                      <TableCell align="center">{formatNumber(node.mlc)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 15]}
              component="div"
              count={misoData?.node_count || 0}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        </Box>
        
        <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', md: 'row' } }}>
          <Box flex={1}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 500 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold' }}>
                Locational Marginal Prices (LMP) - Current Page
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nodeName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis tickCount={10} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend wrapperStyle={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', paddingBottom: 15 }} />
                  <Bar dataKey="lmp" fill="#8884d8" name="LMP" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
          
          <Box flex={1}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 500 }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ mb: 3, fontWeight: 'bold' }}>
                Price Components Comparison - Current Page
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="nodeName"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis tickCount={10} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Legend wrapperStyle={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', paddingBottom: 15 }} />
                  <Bar dataKey="mcc" fill="#82ca9d" name="MCC" />
                  <Bar dataKey="mlc" fill="#ffc658" name="MLC" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard; 
