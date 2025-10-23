"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  InputAdornment,
  Grid,
  Divider,
  useTheme,
  useMediaQuery,
  Stack,
} from "@mui/material"
import { Add, Edit, Delete, Discount, ContentCopy, CalendarToday, TrendingUp } from "@mui/icons-material"

import {
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
} from "../../store/api/couponsApi"
import { setDialogOpen, setEditingCoupon, setFormData, resetFormData } from "../../store/slices/couponsSlice"

const CouponsManagement = () => {
  const dispatch = useDispatch()
  const { dialogOpen, editingCoupon, formData } = useSelector((state) => state.coupons)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isTablet = useMediaQuery(theme.breakpoints.down('md'))

  // RTK Query hooks
  const { data: coupons = [], isLoading, error } = useGetCouponsQuery()
  const [createCoupon] = useCreateCouponMutation()
  const [updateCoupon] = useUpdateCouponMutation()
  const [deleteCoupon] = useDeleteCouponMutation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [couponToDelete, setCouponToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  console.log(formData, 'formdata')

  const handleOpenDialog = (coupon = null) => {
    if (coupon) {
      dispatch(setEditingCoupon(coupon))
      dispatch(
        setFormData({
          code: coupon.code,
          percentage_discount: coupon.percentage_discount?.toString() || "",
          fixed_discount: coupon.fixed_discount?.toString() || "",
          expiration_date: coupon.expiration_date ? coupon.expiration_date.substring(0, 16) : '',
          is_active: coupon.is_active,
        }),
      )
    } else {
      dispatch(setEditingCoupon(null))
      dispatch(resetFormData())
    }
    dispatch(setDialogOpen(true))
  }

  const handleCloseDialog = () => {
    dispatch(setDialogOpen(false))
    dispatch(setEditingCoupon(null))
    dispatch(resetFormData())
    setFormErrors({})
  }

  const handleSaveCoupon = async () => {
    console.log(formData, 'formdata')
    try {
      setFormErrors({})

      // Validate required fields
      if (!formData.code || !formData.expiration_date || (!formData.percentage_discount && !formData.fixed_discount)) {
        setFormErrors({
          code: !formData.code ? ["Coupon code is required"] : undefined,
          percentage_discount: !formData.percentage_discount && !formData.fixed_discount
            ? ["Enter at least one discount type"] : undefined,
          fixed_discount: !formData.percentage_discount && !formData.fixed_discount
            ? ["Enter at least one discount type"] : undefined,
          expiration_date: !formData.expiration_date ? ["Expiration date is required"] : undefined,
        })
        return
      }

      const couponData = {
        code: formData.code.toUpperCase(),
        percentage_discount: formData.percentage_discount
          ? Number.parseFloat(formData.percentage_discount)
          : null,
        fixed_discount: formData.fixed_discount
          ? Number.parseFloat(formData.fixed_discount)
          : null,
        expiration_date: new Date(formData.expiration_date).toISOString(),
        is_active: formData.is_active,
      }

      console.log(couponData,'coupon data')

      if (editingCoupon) {
        await updateCoupon({
          id: editingCoupon.id,
          ...couponData,
        }).unwrap()
      } else {
        await createCoupon(couponData).unwrap()
      }

      handleCloseDialog()
    } catch (error) {
      if (error?.status === 400 && error?.data) {
        setFormErrors(error.data)
      } else {
        console.error("Failed to save coupon:", error)
      }
    }
  }

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return

    try {
      await deleteCoupon(couponToDelete.id).unwrap()
      setDeleteDialogOpen(false)
      setCouponToDelete(null)
    } catch (error) {
      console.error("Failed to delete coupon:", error)
    }
  }

  const handleFormChange = (field, value) => {
    console.log(field, value)
    dispatch(setFormData({ [field]: value }))
  }

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code)
  }

  const isExpired = (expirationDate) => {
    return new Date(expirationDate) < new Date()
  }

  // Mobile Card View Component
  const CouponCard = ({ coupon }) => (
    <Card 
      sx={{ 
        mb: 2, 
        boxShadow: 2,
        '&:hover': { boxShadow: 4 },
        transition: 'box-shadow 0.3s'
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <Discount color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              {coupon.code}
            </Typography>
            <IconButton size="small" onClick={() => handleCopyCode(coupon.code)} sx={{ ml: 1 }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Box>
          <Box display="flex" gap={0.5}>
            <IconButton size="small" color="primary" onClick={() => handleOpenDialog(coupon)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setCouponToDelete(coupon)
                setDeleteDialogOpen(true)
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          {/* <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Discount Type
            </Typography>
            <Chip
              label={coupon.discount_type === "percentage" ? "Percentage" : "Fixed"}
              size="small"
              color={coupon.discount_type === "percentage" ? "primary" : "secondary"}
              sx={{ mt: 0.5 }}
            />
          </Grid> */}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Discount
            </Typography>
            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
              {[
                coupon.percentage_discount ? `${Number(coupon.percentage_discount).toFixed(0)}%` : null,
                coupon.fixed_discount ? `$${Number(coupon.fixed_discount).toFixed(2)}` : null,
              ]
                .filter(Boolean)
                .join(" + ")}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Expiration Date
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Typography 
                variant="body2" 
                color={isExpired(coupon.expiration_date) ? "error" : "inherit"}
              >
                {new Date(coupon.expiration_date).toLocaleDateString()}
              </Typography>
              {isExpired(coupon.expiration_date) && (
                <Chip label="Expired" size="small" color="error" sx={{ mt: 0.5 }} />
              )}
            </Box>
          </Grid>
          {/* <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Times Used
            </Typography>
            <Chip label={coupon.used_count || 0} size="small" variant="outlined" sx={{ mt: 0.5 }} />
          </Grid> */}
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Chip
              label={coupon.is_active ? "Active" : "Inactive"}
              size="small"
              color={coupon.is_active ? "success" : "default"}
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Created
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {new Date(coupon.created_at).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Error loading coupons: {error.message || "Unknown error"}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box 
        display="flex" 
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
            Coupons Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage discount coupons and promotional codes
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />} 
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
        >
          Add Coupon
        </Button>
      </Box>

      {/* Desktop/Tablet Table View */}
      {!isMobile ? (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Coupon Code</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Expiration Date</TableCell>
                    {/* {!isTablet && <TableCell>Times Used</TableCell>} */}
                    <TableCell>Status</TableCell>
                    {!isTablet && <TableCell>Created</TableCell>}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coupons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTablet ? 6 : 8} align="center">
                        <Typography variant="body2" color="text.secondary" py={3}>
                          No coupons found. Create your first coupon to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    coupons.map((coupon) => (
                      <TableRow key={coupon.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Discount color="primary" sx={{ mr: 1 }} />
                            <Typography variant="subtitle2" fontWeight="bold">
                              {coupon.code}
                            </Typography>
                            <IconButton size="small" onClick={() => handleCopyCode(coupon.code)} sx={{ ml: 1 }}>
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {[
                              coupon.percentage_discount ? `${Number(coupon.percentage_discount).toFixed(0)}%` : null,
                              coupon.fixed_discount ? `$${Number(coupon.fixed_discount).toFixed(2)}` : null,
                            ]
                              .filter(Boolean)
                              .join(" + ")
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color={isExpired(coupon.expiration_date) ? "error" : "inherit"}>
                            {new Date(coupon.expiration_date).toLocaleDateString()}
                          </Typography>
                          {isExpired(coupon.expiration_date) && (
                            <Chip label="Expired" size="small" color="error" sx={{ mt: 0.5 }} />
                          )}
                        </TableCell>
                        {/* {!isTablet && (
                          <TableCell>
                            <Chip label={coupon.used_count || 0} size="small" variant="outlined" />
                          </TableCell>
                        )} */}
                        <TableCell>
                          <Chip
                            label={coupon.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={coupon.is_active ? "success" : "default"}
                          />
                        </TableCell>
                        {!isTablet && (
                          <TableCell>{new Date(coupon.created_at).toLocaleDateString()}</TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(coupon)}>
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setCouponToDelete(coupon)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ) : (
        /* Mobile Card View */
        <Box>
          {coupons.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No coupons found. Create your first coupon to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            coupons.map((coupon) => <CouponCard key={coupon.id} coupon={coupon} />)
          )}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
        fullScreen={isMobile}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete coupon <strong>{couponToDelete?.code}</strong>?
          </Typography>
          {couponToDelete?.used_count > 0 && (
            <Typography color="warning.main" sx={{ mt: 2 }}>
              Warning: This coupon has been used {couponToDelete.used_count} time(s).
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteCoupon} 
            color="error" 
            variant="contained"
            fullWidth={isMobile}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Coupon Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingCoupon ? "Edit Coupon" : "Add New Coupon"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Coupon Code"
              value={formData.code}
              onChange={(e) => handleFormChange("code", e.target.value.toUpperCase())}
              error={Boolean(formErrors.code)}
              helperText={formErrors.code?.[0] || "Enter a unique coupon code (e.g., SUMMER25)"}
              placeholder="SUMMER25"
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />

            {/* <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={formData.discount_type}
                onChange={(e) => handleFormChange("discount_type", e.target.value)}
                label="Discount Type"
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl> */}

            <TextField
              fullWidth
              label="Percentage Discount"
              type="number"
              value={formData.percentage_discount}
              onChange={(e) => handleFormChange("percentage_discount", e.target.value)}
              inputProps={{ step: "0.01", min: 0, max: 100 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">%</InputAdornment>,
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              error={Boolean(formErrors.percentage_discount)}
              helperText={formErrors.percentage_discount?.[0] || "Optional. Leave blank if not using percentage discount."}
            />

            <TextField
              fullWidth
              label="Fixed Discount"
              type="number"
              value={formData.fixed_discount}
              onChange={(e) => handleFormChange("fixed_discount", e.target.value)}
              inputProps={{
                step:"0.01",
                min: 0,
                // max: formData.discount_type === "percentage" ? 100 : undefined,
              }}
              InputProps={{
                startAdornment:<InputAdornment position="start">$</InputAdornment>,
              }}
              error={Boolean(formErrors.fixed_discount)}
              helperText={formErrors.fixed_discount?.[0] || "Optional. Leave blank if not using fixed discount."}
            />

            <TextField
              fullWidth
              label="Expiration Date & Time"
              type="datetime-local"
              value={formData.expiration_date}
              onChange={(e) => handleFormChange("expiration_date", e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              error={Boolean(formErrors.expiration_date)}
              helperText={formErrors.expiration_date?.[0]}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleFormChange("is_active", e.target.checked)}
                  color="primary"
                />
              }
              label="Active"
            />

            {/* Preview Section */}
            {formData.code && (formData.percentage_discount || formData.fixed_discount) && (
              <Box sx={{ p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Coupon Preview:
                </Typography>
                <Typography variant="h6" color="primary">
                  {formData.code}
                </Typography>
                <Typography variant="body2">
                  {[
                    formData.percentage_discount ? `${formData.percentage_discount}% OFF` : null,
                    formData.fixed_discount ? `$${formData.fixed_discount} OFF` : null,
                  ]
                    .filter(Boolean)
                    .join(" + ")}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 1 : 0 }}>
          <Button onClick={handleCloseDialog} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveCoupon} 
            variant="contained"
            fullWidth={isMobile}
          >
            {editingCoupon ? "Update" : "Add"} Coupon
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CouponsManagement