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
  Tabs,
  Tab,
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
import {useGetLeadSourceAnalyticsQuery, useGetMonthlyAnalyticsQuery} from '../../store/api/dashboardApi'

function TabPanel(props) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  )
}

export default function AnalyticsReport() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))
  const [tabValue, setTabValue] = useState(0)
  const [year, setYear] = useState(new Date().getFullYear())
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [activeFilters, setActiveFilters] = useState({ start: '', end: '' })
  const [filterDialogOpen, setFilterDialogOpen] = useState(false)

  // API Queries
  const leadSourceQuery = useGetLeadSourceAnalyticsQuery({
    startDate: activeFilters.start,
    endDate: activeFilters.end,
  })

  const monthlyQuery = useGetMonthlyAnalyticsQuery(year)

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

  const handleExportCSV = (type) => {
    let data = []
    let fileName = ''

    if (type === 'leadsources' && leadSourceQuery.data?.lead_sources) {
      const headers = ['Lead Source', '# Of Leads', '% Of Leads', 'Close Rate', 'Avg Ticket', 'Total $ Booked']
      data = leadSourceQuery.data.lead_sources.map((source) => [
        source.leadsource.replace(/-/g, ' ').toUpperCase(),
        source.num_of_leads,
        `${source.percentage_of_leads.toFixed(1)}%`,
        `${source.close_rate.toFixed(1)}%`,
        `$${source.avg_ticket.toFixed(2)}`,
        `$${source.total_booked.toFixed(2)}`,
      ])
      fileName = `lead-source-analytics-${activeFilters.start}-${activeFilters.end}.csv`
      data.unshift(headers)
    } else if (type === 'monthly' && monthlyQuery.data?.monthly_data) {
      const headers = ['Month', '# Of Bids', 'Closed Bids', 'Close Rate', 'Total $ Booked', 'Avg Ticket']
      data = monthlyQuery.data.monthly_data.map((month) => [
        month.month,
        month.num_of_bids,
        month.closed_bids,
        `${month.close_rate}%`,
        `$${month.total_booked.toFixed(2)}`,
        `$${month.avg_ticket.toFixed(2)}`,
      ])
      fileName = `monthly-analytics-${year}.csv`
      data.unshift(headers)
    }

    if (data.length === 0) return

    const csv = data.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
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

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Box mb={3}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight="semibold" sx={{ mb: 2 }}>
          Reports
        </Typography>
      </Box>

      {/* Tabs Section */}
      <Card sx={{ mb: 3, backgroundColor:"rgba(128, 128, 128, 0.03)"}}>
        <Box
          sx={{
            px: 2,
            pt:2,
            position: 'relative'
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(e, newValue) => setTabValue(newValue)}
            sx={{
              '& .MuiTab-root': {
                // color: 'white',
                color: '#60a5fa',
                fontWeight: 500,
                textTransform: 'none',
                fontSize: '0.95rem',
                zIndex: 2,
                position: 'relative',
                '&.Mui-selected': {
                  color: 'black',
                  backgroundColor: '#fff',
                  borderTop: '1px solid rgba(128, 128, 128, 0.4)',
                  borderLeft: '1px solid rgba(128, 128, 128, 0.4)',
                  borderRight: '1px solid rgba(128, 128, 128, 0.4)',
                  borderBottom: 'none',
                  borderRadius: '6px 6px 0 0', // optional: rounded top corners
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#60a5fa',
                display:"none"
              },
            }}
          >
            <Tab label="Leadsources" />
            <Tab label="Monthly" />
          </Tabs>

          <Box
            sx={{
              position: 'absolute',
              mx:2,
              bottom: 0,
              left: 0,
              right: 0,
              borderBottom: '1px solid rgba(128, 128, 128, 0.4)',
              zIndex: 1,
            }}
          />
        </Box>

        {/* Tab Content */}
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          {/* Leadsources Tab */}
          <TabPanel value={tabValue} index={0}>
            {/* Filter and Export Buttons */}
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              sx={{ mb: 3, justifyContent: { xs: 'stretch', sm: 'flex-start' } }}
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
                onClick={() => handleExportCSV('leadsources')}
                disabled={!leadSourceQuery.data}
                size={isMobile ? 'small' : 'medium'}
                fullWidth={isMobile}
                sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
              >
                {isMobile ? 'Export' : 'Export CSV'}
              </Button>
            </Box>

            {leadSourceQuery.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : leadSourceQuery.data ? (
              <>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={PeopleAlt}
                      label="Total Leads"
                      value={leadSourceQuery.data.summary?.total_leads || 0}
                      color="#1976d2"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={TrendingUp}
                      label="Overall Close Rate"
                      value={`${leadSourceQuery.data.summary?.overall_close_rate?.toFixed(1) || 0}%`}
                      color="#388e3c"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={AttachMoney}
                      label="Total Revenue"
                      value={`$${leadSourceQuery.data.summary?.total_revenue?.toFixed(0) || 0}`}
                      color="#f57c00"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={ShowChart}
                      label="Avg Ticket"
                      value={`$${leadSourceQuery.data.summary?.overall_avg_ticket?.toFixed(0) || 0}`}
                      color="#7b1fa2"
                    />
                  </Grid>
                </Grid>

                {/* Table */}
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
                      {leadSourceQuery.data?.lead_sources?.length > 0 ? (
                        leadSourceQuery.data.lead_sources.map((source, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: idx % 2 === 0 ? 'transparent' : 'grey.50',
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>
                              <Chip
                                label={source.leadsource.replace(/-/g, ' ').toUpperCase()}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600 }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {source.num_of_leads}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {source.percentage_of_leads.toFixed(1)}%
                            </TableCell>
                            {!isTablet && (
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Typography
                                  variant="body2"
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
                                ${source.avg_ticket.toFixed(2)}
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
                            <Typography color="text.secondary">No data available</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <AnalyticsOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Analytics Data
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Monthly Tab */}
          <TabPanel value={tabValue} index={1}>
            {/* Year Selection and Export */}
            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              sx={{ mb: 3, alignItems: 'center', justifyContent: { xs: 'stretch', sm: 'flex-start' } }}
            >
              <TextField
                type="number"
                label="Year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                inputProps={{ min: 2020, max: new Date().getFullYear() }}
                sx={{ width: 120 }}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={<FileDownload />}
                onClick={() => handleExportCSV('monthly')}
                disabled={!monthlyQuery.data}
                size={isMobile ? 'small' : 'medium'}
              >
                {isMobile ? 'Export' : 'Export CSV'}
              </Button>
            </Box>

            {monthlyQuery.isLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress />
              </Box>
            ) : monthlyQuery.data ? (
              <>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={PeopleAlt}
                      label="Total Bids"
                      value={monthlyQuery.data.summary?.total_bids || 0}
                      color="#1976d2"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={TrendingUp}
                      label="Overall Close Rate"
                      value={`${monthlyQuery.data.summary?.overall_close_rate || 0}%`}
                      color="#388e3c"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={AttachMoney}
                      label="Total Revenue"
                      value={`$${monthlyQuery.data.summary?.total_revenue?.toFixed(0) || 0}`}
                      color="#f57c00"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <SummaryCard
                      icon={ShowChart}
                      label="Avg Ticket"
                      value={`$${monthlyQuery.data.summary?.overall_avg_ticket?.toFixed(0) || 0}`}
                      color="#7b1fa2"
                    />
                  </Grid>
                </Grid>

                {/* Table */}
                <TableContainer component={Paper} variant="outlined">
                  <Table size={isTablet ? 'small' : 'medium'}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#1e3a8a' }}>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }}>
                          Month
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                          # Of Bids
                        </TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 'bold', py: 1.5 }} align="center">
                          Closed Bids
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
                      {monthlyQuery.data?.monthly_data?.length > 0 ? (
                        monthlyQuery.data.monthly_data.map((month, idx) => (
                          <TableRow
                            key={idx}
                            sx={{
                              '&:hover': { bgcolor: 'action.hover' },
                              bgcolor: idx % 2 === 0 ? 'transparent' : 'grey.50',
                            }}
                          >
                            <TableCell sx={{ py: 1.5 }}>{month.month}</TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {month.num_of_bids}
                            </TableCell>
                            <TableCell align="center" sx={{ py: 1.5 }}>
                              {month.closed_bids}
                            </TableCell>
                            {!isTablet && (
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                <Typography
                                  variant="body2"
                                  color={
                                    month.close_rate > 50
                                      ? 'success.main'
                                      : month.close_rate > 0
                                        ? 'warning.main'
                                        : 'error.main'
                                  }
                                >
                                  {month.close_rate}%
                                </Typography>
                              </TableCell>
                            )}
                            {!isTablet && (
                              <TableCell align="center" sx={{ py: 1.5 }}>
                                ${month.avg_ticket.toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell align="right" sx={{ py: 1.5 }}>
                              <Typography variant="body2" fontWeight="bold" color="primary">
                                ${month.total_booked.toFixed(2)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                            <Typography color="text.secondary">No data available for {year}</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Box textAlign="center" py={4}>
                <AnalyticsOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No Analytics Data
                </Typography>
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Filter Dialog for LeadSources */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
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
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
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
    </Box>
  )
}