import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Grid,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material'
import {
  FileDownload,
  TrendingUp,
  PeopleAlt,
  AttachMoney,
  ShowChart,
  Close,
  AnalyticsOutlined,
} from '@mui/icons-material'
import { useGetLeadSourceAnalyticsQuery } from '../../store/api/dashboardApi'

export default function LeadSourceAnalytics() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [activeFilters, setActiveFilters] = useState({ start: '', end: '' })
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // RTK Query hook
  const { data: analyticsData, isLoading, error } = useGetLeadSourceAnalyticsQuery(
    {
      startDate: activeFilters.start,
      endDate: activeFilters.end,
    },
  )

  const handleApplyFilters = () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Please select both start and end dates')
      return
    }
    setActiveFilters(dateRange)
    setFilterDialogOpen(false)
  }

  const handleResetFilters = () => {
    setDateRange({ start: '', end: '' })
    setActiveFilters({ start: '', end: '' })
  }

  const handleExportCSV = () => {
    if (!analyticsData?.lead_sources) return

    const headers = ['Lead Source', '# Of Leads', '% Of Leads', 'Close Rate', 'Avg Ticket', 'Total $ Booked']
    const rows = analyticsData.lead_sources.map((source) => [
      source.leadsource.replace(/-/g, ' ').toUpperCase(),
      source.num_of_leads,
      `${source.percentage_of_leads.toFixed(1)}%`,
      `${source.close_rate.toFixed(1)}%`,
      `$${source.avg_ticket.toFixed(2)}`,
      `$${source.total_booked.toFixed(2)}`,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lead-source-analytics-${activeFilters.start}-${activeFilters.end}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SummaryCard = ({ icon: Icon, label, value, color = '#1976d2' }) => (
    <Card
      sx={{
        boxShadow: 1,
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 1,
              bgcolor: `${color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.3s ease',
            }}
          >
            <Icon sx={{ color, fontSize: 28 }} />
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontWeight: 600 }}>
              {label}
            </Typography>
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold">
              {value}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  const SourceCard = ({ source }) => (
    <Card sx={{ mb: 2, boxShadow: 1, '&:hover': { boxShadow: 2 } }}>
      <CardContent>
        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={source.leadsource.replace(/-/g, ' ').toUpperCase()}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
          <Typography variant="caption" color="text.secondary">
            {source.percentage_of_leads.toFixed(1)}%
          </Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              # Of Leads
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {source.num_of_leads}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Close Rate
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={source.close_rate > 50 ? 'success.main' : source.close_rate > 0 ? 'warning.main' : 'error.main'}
            >
              {source.close_rate.toFixed(1)}%
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Avg Ticket
            </Typography>
            <Typography variant="body2" fontWeight="600">
              ${source.avg_ticket.toFixed(2)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              Total $ Booked
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              ${source.total_booked.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  if (error) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Card>
          <CardContent>
            <Typography color="error">
              Error loading analytics: {error?.message || 'Unknown error'}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={4}
        gap={2}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" gutterBottom fontWeight="bold" sx={{ m: 0 }}>
              Lead Source Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track lead sources and conversion metrics
            </Typography>
          </Box>
        </Box>
        <Box
          display="flex"
          gap={1}
          flexWrap="wrap"
          sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}
        >
          <Button
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            onClick={() => setFilterDialogOpen(true)}
            fullWidth={isMobile}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            📅 Filter
          </Button>
          <Button
            variant="contained"
            startIcon={<FileDownload />}
            onClick={handleExportCSV}
            disabled={!analyticsData}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
            sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
          >
            {isMobile ? 'Export' : 'Export CSV'}
          </Button>
        </Box>
      </Box>

      {/* Filter Dialog */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <span>Filter by Date Range</span>
          <IconButton size="small" onClick={() => setFilterDialogOpen(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Box display="flex" flexDirection="column" gap={3}>
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              variant="outlined"
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2, gap: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          <Button onClick={() => setFilterDialogOpen(false)} fullWidth={isMobile} variant="outlined">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyFilters}
            fullWidth={isMobile}
            disabled={!dateRange.start || !dateRange.end}
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Content Section */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : analyticsData ? (
        <>
          {/* Summary Cards Grid */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                icon={PeopleAlt}
                label="Total Leads"
                value={analyticsData.summary.total_leads}
                color="#1976d2"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                icon={TrendingUp}
                label="Overall Close Rate"
                value={`${analyticsData.summary.overall_close_rate.toFixed(1)}%`}
                color="#388e3c"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                icon={AttachMoney}
                label="Total Revenue"
                value={`$${analyticsData.summary.total_revenue.toFixed(0)}`}
                color="#f57c00"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <SummaryCard
                icon={ShowChart}
                label="Avg Ticket"
                value={`$${analyticsData.summary.overall_avg_ticket.toFixed(0)}`}
                color="#7b1fa2"
              />
            </Grid>
          </Grid>

          {/* Table/Card View Section */}
          {!isMobile ? (
            <Card sx={{ boxShadow: 1 }}>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight="bold">
                    Lead Sources Performance
                  </Typography>
                  {activeFilters.start && (
                    <Typography variant="caption" color="text.secondary">
                      {activeFilters.start} to {activeFilters.end}
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isTablet ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#1e3a8a' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>
                          Lead Source
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                          # Of Leads
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                          % Of Leads
                        </TableCell>
                        {!isTablet && (
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                            Close Rate
                          </TableCell>
                        )}
                        {!isTablet && (
                          <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                            Avg Ticket
                          </TableCell>
                        )}
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="right">
                          Total $ Booked
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analyticsData.lead_sources && analyticsData.lead_sources.length > 0 ? (
                        analyticsData.lead_sources.map((source, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: idx % 2 === 0 ? 'transparent' : 'grey.50',
                              borderBottom: '1px solid #e0e0e0',
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Chip
                                  label={source.leadsource.replace(/-/g, ' ').toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight="600">
                                {source.num_of_leads}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight="600">
                                {source.percentage_of_leads.toFixed(1)}%
                              </Typography>
                            </TableCell>
                            {!isTablet && (
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight="600"
                                  color={
                                    source.close_rate > 50
                                      ? 'success.main'
                                      : source.close_rate > 0
                                        ? 'warning.main'
                                        : 'error.main'
                                  }
                                >
                                  {source.close_rate.toFixed(1)}%
                                </Typography>
                              </TableCell>
                            )}
                            {!isTablet && (
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Typography variant="body2" fontWeight="600">
                                  ${source.avg_ticket.toFixed(2)}
                                </Typography>
                              </TableCell>
                            )}
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                ${source.total_booked.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">No data available for selected date range</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          ) : (
            /* Mobile Card View */
            <Box>
              <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" fontWeight="bold">
                  Lead Sources Performance
                </Typography>
                {activeFilters.start && (
                  <Typography variant="caption" color="text.secondary">
                    {activeFilters.start} to {activeFilters.end}
                  </Typography>
                )}
              </Box>
              {analyticsData.lead_sources && analyticsData.lead_sources.length > 0 ? (
                analyticsData.lead_sources.map((source, idx) => <SourceCard key={idx} source={source} />)
              ) : (
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" align="center">
                      No data available for selected date range
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </>
      ) : (
        <Card sx={{ boxShadow: 1 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AnalyticsOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Analytics Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a date range and apply filters to view lead source analytics
            </Typography>
            <Button variant="contained" onClick={() => setFilterDialogOpen(true)} startIcon={<FileDownload />}>
              Select Date Range
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}