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
  Checkbox,
} from "@mui/material"
import { Add, Edit, Delete, Layers } from "@mui/icons-material"

import {
  useGetBundlesQuery,
  useCreateBundleMutation,
  useUpdateBundleMutation,
  useDeleteBundleMutation,
} from "../../store/api/bundlesApi"
import { useGetServicesQuery } from "../../store/api/servicesApi"
import { setDialogOpen, setEditingBundle, setFormData, resetFormData } from "../../store/slices/bundlesSlice"

const formatDiscount = (bundle) => {
  if (bundle.discount_type === "percent" && bundle.discount_percentage) {
    return `${Number(bundle.discount_percentage).toFixed(0)}%`
  }
  if (bundle.discount_fixed) {
    return `$${Number(bundle.discount_fixed).toFixed(2)}`
  }
  return "—"
}

const BundlesManagement = () => {
  const dispatch = useDispatch()
  const { dialogOpen, editingBundle, formData } = useSelector((state) => state.bundles)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))
  const isTablet = useMediaQuery(theme.breakpoints.down("md"))

  const { data: bundles = [], isLoading, error } = useGetBundlesQuery()
  const { data: services = [] } = useGetServicesQuery()
  const [createBundle] = useCreateBundleMutation()
  const [updateBundle] = useUpdateBundleMutation()
  const [deleteBundle] = useDeleteBundleMutation()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bundleToDelete, setBundleToDelete] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  const handleOpenDialog = (bundle = null) => {
    if (bundle) {
      dispatch(setEditingBundle(bundle))
      dispatch(
        setFormData({
          name: bundle.name,
          description: bundle.description || "",
          discount_type: bundle.discount_type || "percent",
          discount_percentage: bundle.discount_percentage?.toString() || "",
          discount_fixed: bundle.discount_fixed?.toString() || "",
          is_active: bundle.is_active,
          services: bundle.services || [],
        }),
      )
    } else {
      dispatch(setEditingBundle(null))
      dispatch(resetFormData())
    }
    dispatch(setDialogOpen(true))
  }

  const handleCloseDialog = () => {
    dispatch(setDialogOpen(false))
    dispatch(setEditingBundle(null))
    dispatch(resetFormData())
    setFormErrors({})
  }

  const handleServiceToggle = (serviceId) => {
    const isSelected = formData.services.includes(serviceId)
    const next = isSelected
      ? formData.services.filter((id) => id !== serviceId)
      : [...formData.services, serviceId]
    dispatch(setFormData({ services: next }))
  }

  const handleSaveBundle = async () => {
    try {
      setFormErrors({})

      const hasPercent = formData.discount_type === "percent" && formData.discount_percentage
      const hasFixed = formData.discount_type === "fixed" && formData.discount_fixed

      if (!formData.name || formData.services.length < 2 || (!hasPercent && !hasFixed)) {
        setFormErrors({
          name: !formData.name ? ["Bundle name is required"] : undefined,
          services: formData.services.length < 2 ? ["Select at least 2 services"] : undefined,
          discount_percentage:
            formData.discount_type === "percent" && !formData.discount_percentage
              ? ["Percentage discount is required"]
              : undefined,
          discount_fixed:
            formData.discount_type === "fixed" && !formData.discount_fixed
              ? ["Fixed discount amount is required"]
              : undefined,
        })
        return
      }

      const bundleData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || "",
        discount_type: formData.discount_type,
        is_active: formData.is_active,
        services: formData.services,
        discount_percentage:
          formData.discount_type === "percent"
            ? Number.parseFloat(formData.discount_percentage).toFixed(2)
            : null,
        discount_fixed:
          formData.discount_type === "fixed"
            ? Number.parseFloat(formData.discount_fixed).toFixed(2)
            : null,
      }

      if (editingBundle) {
        await updateBundle({ id: editingBundle.id, ...bundleData }).unwrap()
      } else {
        await createBundle(bundleData).unwrap()
      }

      handleCloseDialog()
    } catch (err) {
      if (err?.status === 400 && err?.data) {
        setFormErrors(err.data)
      } else {
        console.error("Failed to save bundle:", err)
      }
    }
  }

  const confirmDeleteBundle = async () => {
    if (!bundleToDelete) return
    try {
      await deleteBundle(bundleToDelete.id).unwrap()
      setDeleteDialogOpen(false)
      setBundleToDelete(null)
    } catch (err) {
      console.error("Failed to delete bundle:", err)
    }
  }

  const handleFormChange = (field, value) => {
    dispatch(setFormData({ [field]: value }))
  }

  const BundleCard = ({ bundle }) => (
    <Card sx={{ mb: 2, boxShadow: 2, "&:hover": { boxShadow: 4 }, transition: "box-shadow 0.3s" }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" flex={1}>
            <Layers color="primary" sx={{ mr: 1 }} />
            <Typography variant="h6" fontWeight="bold">
              {bundle.name}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5}>
            <IconButton size="small" color="primary" onClick={() => handleOpenDialog(bundle)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setBundleToDelete(bundle)
                setDeleteDialogOpen(true)
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {bundle.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {bundle.description}
          </Typography>
        )}

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Discount
            </Typography>
            <Typography variant="body1" fontWeight="medium" sx={{ mt: 0.5 }}>
              {formatDiscount(bundle)}
            </Typography>
          </Grid>
          <Grid item xs={6}>
            <Typography variant="caption" color="text.secondary" display="block">
              Status
            </Typography>
            <Chip
              label={bundle.is_active ? "Active" : "Inactive"}
              size="small"
              color={bundle.is_active ? "success" : "default"}
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" display="block">
              Services
            </Typography>
            <Box sx={{ mt: 0.5, display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {(bundle.service_details || []).map((s) => (
                <Chip key={s.id} label={s.name} size="small" variant="outlined" />
              ))}
            </Box>
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
        <Typography color="error">Error loading bundles: {error.message || "Unknown error"}</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        mb={3}
        gap={2}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} component="h1" gutterBottom>
            Bundles Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create service bundles with combined discounts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          fullWidth={isMobile}
          size={isMobile ? "medium" : "large"}
        >
          Add Bundle
        </Button>
      </Box>

      {!isMobile ? (
        <Card>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <TableContainer component={Paper} variant="outlined">
              <Table size={isTablet ? "small" : "medium"}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Services</TableCell>
                    <TableCell>Discount</TableCell>
                    <TableCell>Status</TableCell>
                    {!isTablet && <TableCell>Created</TableCell>}
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bundles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTablet ? 5 : 6} align="center">
                        <Typography variant="body2" color="text.secondary" py={3}>
                          No bundles found. Create your first bundle to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    bundles.map((bundle) => (
                      <TableRow key={bundle.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Layers color="primary" sx={{ mr: 1 }} />
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {bundle.name}
                              </Typography>
                              {bundle.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {bundle.description}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {(bundle.service_details || []).map((s) => (
                              <Chip key={s.id} label={s.name} size="small" variant="outlined" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDiscount(bundle)}</TableCell>
                        <TableCell>
                          <Chip
                            label={bundle.is_active ? "Active" : "Inactive"}
                            size="small"
                            color={bundle.is_active ? "success" : "default"}
                          />
                        </TableCell>
                        {!isTablet && (
                          <TableCell>{new Date(bundle.created_at).toLocaleDateString()}</TableCell>
                        )}
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleOpenDialog(bundle)}>
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              setBundleToDelete(bundle)
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
        <Box>
          {bundles.length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center" py={3}>
                  No bundles found. Create your first bundle to get started.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            bundles.map((bundle) => <BundleCard key={bundle.id} bundle={bundle} />)
          )}
        </Box>
      )}

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} fullScreen={isMobile}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete bundle <strong>{bundleToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button onClick={confirmDeleteBundle} color="error" variant="contained" fullWidth={isMobile}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingBundle ? "Edit Bundle" : "Add New Bundle"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Bundle Name"
              value={formData.name}
              onChange={(e) => handleFormChange("name", e.target.value)}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name?.[0]}
              placeholder="Exterior Combo"
            />

            <TextField
              fullWidth
              label="Description (optional)"
              value={formData.description}
              onChange={(e) => handleFormChange("description", e.target.value)}
              multiline
              rows={2}
              placeholder="Window Cleaning + Pressure Washing"
            />

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Services (select at least 2)
              </Typography>
              <Paper variant="outlined" sx={{ maxHeight: 200, overflow: "auto" }}>
                {services.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    No services found
                  </Typography>
                ) : (
                  services.map((service) => (
                    <FormControlLabel
                      key={service.id}
                      control={
                        <Checkbox
                          checked={formData.services.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                        />
                      }
                      label={service.name}
                      sx={{ display: "flex", mx: 1, my: 0 }}
                    />
                  ))
                )}
              </Paper>
              {formErrors.services && (
                <Typography variant="caption" color="error">
                  {formErrors.services[0]}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {formData.services.length} service{formData.services.length !== 1 ? "s" : ""} selected
              </Typography>
            </Box>

            <FormControl fullWidth>
              <InputLabel>Discount Type</InputLabel>
              <Select
                value={formData.discount_type}
                onChange={(e) => handleFormChange("discount_type", e.target.value)}
                label="Discount Type"
              >
                <MenuItem value="percent">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>

            {formData.discount_type === "percent" ? (
              <TextField
                fullWidth
                label="Percentage Discount"
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => handleFormChange("discount_percentage", e.target.value)}
                inputProps={{ step: "0.01", min: 0, max: 100 }}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                error={Boolean(formErrors.discount_percentage)}
                helperText={formErrors.discount_percentage?.[0]}
              />
            ) : (
              <TextField
                fullWidth
                label="Fixed Discount"
                type="number"
                value={formData.discount_fixed}
                onChange={(e) => handleFormChange("discount_fixed", e.target.value)}
                inputProps={{ step: "0.01", min: 0 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                error={Boolean(formErrors.discount_fixed)}
                helperText={formErrors.discount_fixed?.[0]}
              />
            )}

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
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, flexDirection: isMobile ? "column" : "row", gap: isMobile ? 1 : 0 }}>
          <Button onClick={handleCloseDialog} fullWidth={isMobile}>
            Cancel
          </Button>
          <Button onClick={handleSaveBundle} variant="contained" fullWidth={isMobile}>
            {editingBundle ? "Update" : "Add"} Bundle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BundlesManagement
