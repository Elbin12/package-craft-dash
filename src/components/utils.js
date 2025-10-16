/**
 * Format date to YYYY-MM-DD format
 */
export const formatDateForAPI = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/**
 * Format date to readable format
 */
export const formatDateDisplay = (date) => {
  if (!date) return ''
  const options = { year: 'numeric', month: 'short', day: 'numeric' }
  return new Date(date).toLocaleDateString('en-US', options)
}

/**
 * Format currency
 */
export const formatCurrency = (value, decimals = 2) => {
  if (!value && value !== 0) return '$0.00'
  return `$${parseFloat(value).toFixed(decimals)}`
}

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (!value && value !== 0) return '0%'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Format lead source name for display
 */
export const formatLeadSourceName = (source) => {
  if (!source) return ''
  return source
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get color based on close rate
 */
export const getCloseRateColor = (closeRate) => {
  if (closeRate > 50) return '#388e3c' // Green
  if (closeRate > 0) return '#f57c00' // Orange
  return '#d32f2f' // Red
}

/**
 * Get status badge properties
 */
export const getStatusBadgeProps = (value, threshold = 50) => {
  if (value > threshold) {
    return { color: 'success', label: 'Excellent' }
  }
  if (value > threshold / 2) {
    return { color: 'warning', label: 'Good' }
  }
  return { color: 'error', label: 'Needs Improvement' }
}

/**
 * Calculate growth percentage
 */
export const calculateGrowth = (current, previous) => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

/**
 * Export data to CSV
 */
export const exportToCSV = (data, filename = 'export.csv') => {
  const csv = [data.headers, ...data.rows].map((row) => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Get date range for common filters
 */
export const getDateRange = (rangeType) => {
  const today = new Date()
  let startDate = new Date()

  switch (rangeType) {
    case 'today':
      startDate = new Date(today)
      break
    case 'week':
      startDate = new Date(today.setDate(today.getDate() - 7))
      break
    case 'month':
      startDate = new Date(today.setMonth(today.getMonth() - 1))
      break
    case 'quarter':
      startDate = new Date(today.setMonth(today.getMonth() - 3))
      break
    case 'year':
      startDate = new Date(today.setFullYear(today.getFullYear() - 1))
      break
    default:
      startDate = new Date(today.setDate(today.getDate() - 30))
  }

  return {
    startDate: formatDateForAPI(startDate),
    endDate: formatDateForAPI(new Date()),
  }
}

/**
 * Validate date range
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false
  const start = new Date(startDate)
  const end = new Date(endDate)
  return start <= end
}

/**
 * Sort lead sources by specific field
 */
export const sortLeadSources = (sources, sortBy = 'total_booked', order = 'desc') => {
  return [...sources].sort((a, b) => {
    const aVal = a[sortBy] || 0
    const bVal = b[sortBy] || 0

    if (order === 'desc') {
      return bVal - aVal
    }
    return aVal - bVal
  })
}

/**
 * Filter lead sources by minimum threshold
 */
export const filterLeadSources = (sources, minLeads = 0, minRevenue = 0) => {
  return sources.filter((source) => source.num_of_leads >= minLeads && source.total_booked >= minRevenue)
}