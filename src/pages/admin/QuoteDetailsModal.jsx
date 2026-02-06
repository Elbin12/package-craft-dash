"use client"
import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
  Grid,
  Collapse,
  TextField,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Home,
  Layers,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Save,
  Image as ImageIcon,
  Upload,
  Trash2,
  AlertCircle,
} from "lucide-react"
import { useAddNotesMutation, useCreateQuestionResponsesMutation, useEditPackagePriceMutation, useUpdateQuestionResponsesForSubmittedMutation, useUploadQuoteImageMutation, useDeleteQuoteImageMutation, useGetInitialDataQuery, useUpdateQuoteSizeRangeMutation } from "../../store/api/user/quoteApi"
import { add, set } from "date-fns"

export function QuoteDetailsModal({ open, onClose, data, isLoading = false, onEdit, isSubmitted }) {
  const [tab, setTab] = useState("overview")
  const [expandedPackages, setExpandedPackages] = useState({})

  const [editPrivate, setEditPrivate] = useState(false);
  const [editPublic, setEditPublic] = useState(false);
  const [privateNotes, setPrivateNotes] = useState(data?.bid_notes_private || "");
  const [publicNotes, setPublicNotes] = useState(data?.bid_notes_public || "");

  const [editingPackagePrice, setEditingPackagePrice] = useState({});
  const [tempPackagePrices, setTempPackagePrices] = useState({});

  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Size range edit state
  const [sizeRangeDialogOpen, setSizeRangeDialogOpen] = useState(false);
  const [selectedSizeRange, setSelectedSizeRange] = useState(null);
  const [updatingSizeRange, setUpdatingSizeRange] = useState(false);

  const [editPackagePrice] = useEditPackagePriceMutation();
  const [updateQuestionResponses] = useCreateQuestionResponsesMutation();
  const [updateQuestionResponsesForSubmitted] = useUpdateQuestionResponsesForSubmittedMutation();

  const [addNotes] = useAddNotesMutation();
  
  // Image management - images come from the quote details API response
  const [uploadQuoteImage] = useUploadQuoteImageMutation();
  const [deleteQuoteImage] = useDeleteQuoteImageMutation();

  // Extract images from the quote details data
  const images = data?.images || [];

  // Size range management
  const propertyType = data?.property_type === 'residential' ? 'Residential' : data?.property_type === 'commercial' ? 'Commercial' : 'Residential';
  const { data: initialData, isLoading: sizeRangesLoading } = useGetInitialDataQuery(propertyType, {
    skip: !sizeRangeDialogOpen || !data?.property_type,
  });
  const [updateQuoteSizeRange] = useUpdateQuoteSizeRangeMutation();
  
  const sizeRanges = initialData?.size_ranges || [];

  const handleTabChange = (event, newValue) => {
    setTab(newValue)
  }

  const togglePackage = (serviceIdx, pkgIdx) => {
    const key = `${serviceIdx}-${pkgIdx}`
    setExpandedPackages(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Add this function inside the QuoteDetailsModal component, after togglePackage
  const handlePackageSelect = async (serviceIdx, pkgIdx) => {
    const service = data.service_selections[serviceIdx]
    console.log('Selected package index:', service)
    const pkg = service.package_quotes[pkgIdx]
    console.log('Selected package:', pkg)

    try {
      if (isSubmitted) {
        await updateQuestionResponsesForSubmitted({
          submissionId: data.id,
          serviceId: service.service,
          payload: {new_package_id: pkg.package}
        }).unwrap()
      }else {
        await updateQuestionResponses({
          submissionId: data.id,
          serviceId: service.service,
          payload: {new_package_id: pkg.package}
        }).unwrap();
      }
      
      // console.log('Payload:', payload) // For testing
      console.log('Submission ID:', data.id)
      console.log('Service ID:', service.service_id)
      onClose(); // Close the modal after successful update
      setEditPrivate(false);
      setEditPublic(false);
    } catch (error) {
      console.error('Error updating package:', error)
    }
  }
  
  const handleSavePrivate = () => {
    // TODO: save privateNotes to backend
    setEditPrivate(false);
    addNotes({ submissionId: data.id, payload: { bid_notes_private: privateNotes } });
  };

  const handleSavePublic = () => {
    // TODO: save publicNotes to backend
    setEditPublic(false);
    addNotes({ submissionId: data.id, payload: { bid_notes_public: publicNotes } });
  };

  const handleClose = () => {
    onClose();
    setEditPrivate(false);
    setEditPublic(false);
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !data?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Please select a valid image file', severity: 'error' });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image size must be less than 10MB', severity: 'error' });
      return;
    }

    setUploadingImage(true);
    try {
      await uploadQuoteImage({ submissionId: data.id, file }).unwrap();
      setSnackbar({ open: true, message: 'Image uploaded successfully', severity: 'success' });
      // Images will be refreshed automatically via cache invalidation
      // The parent component will refetch quote details automatically
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.data?.detail || error?.data?.message || error?.message || 'Failed to upload image', 
        severity: 'error' 
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!data?.id || !imageId) return;
    
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeletingImageId(imageId);
    try {
      await deleteQuoteImage({ submissionId: data.id, imageId }).unwrap();
      setSnackbar({ open: true, message: 'Image deleted successfully', severity: 'success' });
      // Images will be refreshed automatically via cache invalidation
      // The parent component will refetch quote details automatically
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.data?.detail || error?.data?.message || error?.message || 'Failed to delete image', 
        severity: 'error' 
      });
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenSizeRangeDialog = () => {
    // Prevent editing if quote is approved
    if (data?.status === 'approved') {
      return;
    }
    setSelectedSizeRange(data?.size_range?.id || null);
    setSizeRangeDialogOpen(true);
  };

  const handleCloseSizeRangeDialog = () => {
    setSizeRangeDialogOpen(false);
    setSelectedSizeRange(null);
  };

  const handleSaveSizeRange = async () => {
    if (!selectedSizeRange || !data?.id) return;
    
    setUpdatingSizeRange(true);
    try {
      await updateQuoteSizeRange({ submissionId: data.id, sizeRange: selectedSizeRange }).unwrap();
      setSnackbar({ open: true, message: 'Square footage updated successfully', severity: 'success' });
      handleCloseSizeRangeDialog();
      // Close modal to refresh data
      onClose();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error?.data?.detail || error?.data?.message || 'Failed to update square footage', 
        severity: 'error' 
      });
    } finally {
      setUpdatingSizeRange(false);
    }
  };

  const handleEditPackagePrice = (serviceIdx, pkgIdx) => {
    const key = `${serviceIdx}-${pkgIdx}`
    setEditingPackagePrice(prev => ({
      ...prev,
      [key]: true
    }))
  }

  const handleSavePackagePrice = async (serviceIdx, pkgIdx, packageId) => {
    const key = `${serviceIdx}-${pkgIdx}`
    const newPrice = tempPackagePrices[key]
    
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      return
    }

    try {
      await editPackagePrice({
        packageId: packageId,
        payload: { admin_override_price: parseFloat(newPrice) }
      }).unwrap()
      
      setEditingPackagePrice(prev => ({
        ...prev,
        [key]: false
      }))
      setTempPackagePrices(prev => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
      
      onClose(); // Close modal to refresh data
    } catch (error) {
      console.error('Error updating package price:', error)
    }
  }

  const handleCancelEditPrice = (serviceIdx, pkgIdx) => {
    const key = `${serviceIdx}-${pkgIdx}`
    setEditingPackagePrice(prev => ({
      ...prev,
      [key]: false
    }))
    setTempPackagePrices(prev => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  if (isLoading) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <Typography color="text.secondary">No data available</Typography>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth scroll="paper">
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          bgcolor: "primary.main",
          color: "primary.contrastText",
          p: 2,
        }}
      >
        <Box>
          <DialogTitle sx={{ m: 0, p: 0, fontSize: 20 }}>Quote Details</DialogTitle>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Submission ID: {data.id}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {onEdit && (
            <Button
              variant="contained"
              color="secondary"
              size="small"
              startIcon={<Edit2 size={16} />}
              onClick={onEdit}
            >
              Edit
            </Button>
          )}
          <IconButton onClick={handleClose} sx={{ color: "primary.contrastText" }}>
            <X />
          </IconButton>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}>
        <Tabs value={tab} onChange={handleTabChange} textColor="primary" indicatorColor="primary">
          <Tab label="Overview" value="overview" />
          <Tab label="Services" value="services" />
          <Tab label="Additional Info" value="additional" />
          <Tab label="Images" value="images" />
        </Tabs>
      </Box>

      <DialogContent dividers sx={{ maxHeight: "80vh" }}>
        {/* Overview */}
        {tab === "overview" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Customer Info */}
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <User size={18} color="#51b7ae" />
                    <Typography variant="subtitle1">Customer Information</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography>{data.first_name} {data.last_name}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Email
                    </Typography>
                    <Typography>{data.customer_email}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Phone
                    </Typography>
                    <Typography>{data.customer_phone}</Typography>

                    {data.company_name && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Company
                        </Typography>
                        <Typography>{data.company_name}</Typography>
                      </>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Address
                    </Typography>
                    <Typography>{data.street_address}</Typography>
                    <Typography color="text.secondary">{data.postal_code}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Communication Preferences
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                      {data.allow_email && (
                        <Chip 
                          icon={<Mail size={14} />} 
                          label="Email" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                      {data.allow_sms && (
                        <Chip 
                          icon={<Phone size={14} />} 
                          label="SMS" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {data.additional_data?.marketing_consent !== undefined && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Marketing Consent
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          {data.additional_data.marketing_consent ? (
                            <CheckCircle2 color="green" size={18} />
                          ) : (
                            <XCircle color="gray" size={18} />
                          )}
                          <Typography>{data.additional_data.marketing_consent ? "Yes" : "No"}</Typography>
                        </Box>
                      </>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Home size={18} color="#51b7ae" />
                    <Typography variant="subtitle1">Property Details</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Property Type
                    </Typography>
                    <Typography sx={{ textTransform: 'capitalize' }}>{data.property_type}</Typography>

                    {data.property_name && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Property Name
                        </Typography>
                        <Typography>{data.property_name}</Typography>
                      </>
                    )}

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Number of Floors
                    </Typography>
                    <Typography>{data.num_floors}</Typography>

                    {data.size_range && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Size Range
                        </Typography>
                        <Typography>
                          {data.size_range.min_sqft} - {data.size_range.max_sqft} sq ft
                        </Typography>
                      </>
                    )}

                    {data.actual_sqft && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Actual Square Footage
                        </Typography>
                        <Typography>{data.actual_sqft} sq ft</Typography>
                      </>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography>{data.location_details?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {data.location_details?.address}
                    </Typography>

                    {data.location_details?.trip_surcharge && parseFloat(data.location_details.trip_surcharge) > 0 && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Trip Surcharge
                        </Typography>
                        <Typography>${data.location_details.trip_surcharge}</Typography>
                      </>
                    )}

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Heard About Us
                    </Typography>
                    <Typography sx={{ textTransform: 'capitalize' }}>{data.heard_about_us}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Previous Customer
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {data.is_previous_customer ? (
                        <CheckCircle2 color="green" size={18} />
                      ) : (
                        <XCircle color="gray" size={18} />
                      )}
                      <Typography>{data.is_previous_customer ? "Yes" : "No"}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Quote Status & Dates */}
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Calendar size={18} color="#51b7ae" />
                    <Typography variant="subtitle1">Quote Status & Timeline</Typography>
                  </Box>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Status
                    </Typography>
                    <Chip 
                      label={data.status.toUpperCase()} 
                      color={data.status === 'approved' ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Created At
                    </Typography>
                    <Typography>{new Date(data.created_at).toLocaleString()}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Last Updated
                    </Typography>
                    <Typography>{new Date(data.updated_at).toLocaleString()}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {data.additional_data?.submitted_at && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Submitted At
                        </Typography>
                        <Typography>{new Date(data.additional_data.submitted_at).toLocaleString()}</Typography>
                      </>
                    )}

                    {data.additional_data?.preferred_contact_method && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Preferred Contact Method
                        </Typography>
                        <Typography sx={{ textTransform: 'capitalize' }}>
                          {data.additional_data.preferred_contact_method}
                        </Typography>
                      </>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Pricing Summary */}
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DollarSign size={18} color="#51b7ae"/>
                    <Typography variant="subtitle1">Pricing Summary</Typography>
                  </Box>
                }
              />
              <CardContent>
                {/* Service-wise pricing */}
                {data.service_selections?.map((service, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      mb: 3,
                      pb: 2,
                      borderBottom:
                        idx < data.service_selections.length - 1
                          ? '1px solid'
                          : 'none',
                      borderColor: 'divider'
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1.5
                      }}
                    >
                      <Typography>
                        {service.service_details?.name || 'Service ' + (idx + 1)}
                      </Typography>
                      <Typography fontWeight={600} >
                        ${service.final_total_price}
                      </Typography>
                    </Box>
                  </Box>
                ))}

                {/* Add-ons */}
                {data.total_addons_price && parseFloat(data.total_addons_price) > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography>Add-ons</Typography>
                    <Typography fontWeight={600}>${data.total_addons_price}</Typography>
                  </Box>
                )}

                {/* Discount */}
                {data.is_coupon_applied && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, color: "success.main" }}>
                    <Typography>
                      Discount {data.applied_coupon && `(${data.applied_coupon.code})`}
                    </Typography>
                    <Typography fontWeight={600}>- ${data.discounted_amount}</Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />
                
                {/* Final Total */}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6" fontWeight={700}>Final Total</Typography>
                  <Typography variant="h5" fontWeight={700} color="primary">${data.final_total}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Add-ons (if any) */}
            {/* {data.addons && data.addons.length > 0 && (
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tag size={18} color="#51b7ae" />
                      <Typography variant="subtitle1">Selected Add-ons</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {data.addons.map((addon, idx) => (
                      <Box 
                        key={idx} 
                        sx={{ 
                          display: "flex", 
                          justifyContent: "space-between",
                          p: 1.5,
                          bgcolor: "grey.50",
                          borderRadius: 1
                        }}
                      >
                        <Typography>{addon.addon_name}</Typography>
                        <Typography fontWeight={600}>${addon.addon_price}</Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )} */}

            {/* Additional Notes */}
            {data.additional_data?.additional_notes && (
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <FileText size={18} color="#51b7ae" />
                      <Typography variant="subtitle1">Additional Notes</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Typography whiteSpace="pre-wrap">{data.additional_data.additional_notes}</Typography>
                </CardContent>
              </Card>
            )}

            {/* Quote URL */}
            {data.quote_url && (
              <Card>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <MapPin size={18} color="#51b7ae" />
                      <Typography variant="subtitle1">Quote Link</Typography>
                    </Box>
                  }
                />
                <CardContent>
                  <Typography 
                    component="a" 
                    href={data.quote_url} 
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      color: 'primary.main',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    {data.quote_url}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* Services */}
        {tab === "services" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Square Footage Section - Shown once at the top */}
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Layers size={20} color="#51b7ae" />
                    <Typography variant="h6">Square Footage</Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Edit2 size={16} />}
                    onClick={handleOpenSizeRangeDialog}
                    disabled={data?.status === 'approved'}
                  >
                    Edit
                  </Button>
                </Box>
                {data.size_range ? (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: "grey.50", 
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider"
                  }}>
                    <Typography variant="body1" fontWeight={600}>
                      {data.size_range.min_sqft} {data.size_range.max_sqft === null 
                        ? "sq ft And Up" 
                        : `- ${data.size_range.max_sqft} sq ft`}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: "grey.50", 
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider"
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No square footage selected
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {data.service_selections?.map((service, serviceIdx) => (
              <Card key={serviceIdx}>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="h6">{service.service_details?.name || service.service_name}</Typography>
                      </Box>
                      <Chip label={`$${service.final_total_price}`} color="primary" size="large" />
                    </Box>
                  }
                />
                <CardContent>
                  {/* Package Options */}
                  {service.package_quotes?.length > 0 && (
                    <Box mb={2}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                        Final Proposal Pricing
                      </Typography>
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        {service.package_quotes.map((pkg, pkgIdx) => {
                          const key = `${serviceIdx}-${pkgIdx}`
                          const isExpanded = expandedPackages[key]
                          
                          return (
                            <Box 
                              key={pkgIdx}
                              sx={{ 
                                border: pkg.is_selected ? "2px solid #1976d2" : "1px solid #e0e0e0",
                                borderRadius: 1,
                                bgcolor: pkg.is_selected ? "#f0f7ff" : "white"
                              }}
                            >
                              {/* Package Header */}
                              <Box 
                                sx={{ 
                                  display: "flex", 
                                  justifyContent: "space-between", 
                                  alignItems: "center",
                                  p: 2,
                                  cursor: editingPackagePrice[key] ? "default" : "pointer"
                                }}
                                onClick={() => !editingPackagePrice[key] && togglePackage(serviceIdx, pkgIdx)}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                  {!editingPackagePrice[key] && (
                                    <IconButton size="small" sx={{ bgcolor: "#1976d2", color: "white", width: 32, height: 32 }}>
                                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </IconButton>
                                  )}
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {pkg.package_name}
                                      </Typography>
                                      {pkg.is_selected && (
                                        <Chip 
                                          label="SELECTED" 
                                          size="small"
                                          sx={{ 
                                            bgcolor: "#4caf50", 
                                            color: "white",
                                            fontWeight: 600,
                                            fontSize: "0.7rem"
                                          }} 
                                        />
                                      )}
                                    </Box>
                                    
                                    {editingPackagePrice[key] ? (
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                                        <TextField
                                          size="small"
                                          type="number"
                                          label="Override Price"
                                          value={tempPackagePrices[key] || pkg.total_price}
                                          onChange={(e) => setTempPackagePrices(prev => ({
                                            ...prev,
                                            [key]: e.target.value
                                          }))}
                                          InputProps={{
                                            startAdornment: <Typography sx={{ mr: 0.5 }}>$</Typography>,
                                          }}
                                          sx={{ width: 150 }}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                        <IconButton 
                                          size="small" 
                                          color="success"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleSavePackagePrice(serviceIdx, pkgIdx, pkg.id)
                                          }}
                                        >
                                          <Save size={18} />
                                        </IconButton>
                                        <IconButton 
                                          size="small" 
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleCancelEditPrice(serviceIdx, pkgIdx)
                                          }}
                                        >
                                          <X size={18} />
                                        </IconButton>
                                      </Box>
                                    ) : (
                                      <>
                                        {pkg.admin_override_price ? (
                                          <Box sx={{ display: "flex", flexDirection: "column" }}>
                                            <Typography 
                                              variant="body2" 
                                              sx={{ textDecoration: "line-through", color: "text.disabled" }}
                                            >
                                              Original: ${pkg.total_price}
                                            </Typography>

                                            <Typography 
                                              variant="body1" 
                                              sx={{ fontWeight: 600, color: "#d32f2f" }}
                                            >
                                              Override: ${pkg.effective_total_price}
                                            </Typography>
                                          </Box>
                                        ) : (
                                          <Typography variant="body2" color="text.secondary">
                                            ${pkg.effective_total_price}
                                          </Typography>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                </Box>
                                
                                <Box sx={{ display: "flex", gap: 1 }}>
                                  {(data.status === 'submitted' || data.status === "approved") && (
                                    <>
                                      <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Edit2 size={16} />}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleEditPackagePrice(serviceIdx, pkgIdx)
                                        }}
                                      >
                                        Edit Price
                                      </Button>
                                      {data.status === "approved" && !pkg.is_selected && (
                                        <Button
                                          variant="contained"
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handlePackageSelect(serviceIdx, pkgIdx)
                                          }}
                                        >
                                          Select
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </Box>
                              </Box>

                              {/* Expandable Package Details */}
                              <Collapse in={isExpanded}>
                                <Box sx={{ px: 2, pb: 2, pt: 1, borderTop: "1px solid #e0e0e0" }}>
                                  <Grid container spacing={2} mb={2}>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" color="text.secondary">
                                        Fine Tune Adjustments
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        ${pkg.question_adjustments}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" color="text.secondary">
                                        Square Feet Price
                                      </Typography>
                                      <Typography variant="body1" fontWeight={600}>
                                        ${pkg.sqft_price}
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                      <Typography variant="caption" color="text.secondary">
                                        Total
                                      </Typography>

                                      {pkg.admin_override_price ? (
                                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ textDecoration: "line-through", color: "text.disabled" }}
                                          >
                                            Original: ${pkg.total_price}
                                          </Typography>

                                          <Typography 
                                            variant="body1" 
                                            fontWeight={600} 
                                            sx={{ color: "#d32f2f" }}
                                          >
                                            Override: ${pkg.effective_total_price}
                                          </Typography>
                                        </Box>
                                      ) : (
                                        <Typography variant="body1" fontWeight={600} color="primary">
                                          ${pkg.total_price}
                                        </Typography>
                                      )}
                                    </Grid>

                                  </Grid>

                                  {pkg.package_description && (
                                    <Typography variant="body2" color="text.secondary" mb={2}>
                                      {pkg.package_description}
                                    </Typography>
                                  )}

                                  {/* Features Grid - Included and Excluded side by side */}
                                  {(pkg.included_features_details?.length > 0 || pkg.excluded_features_details?.length > 0) && (
                                    <Grid container spacing={2}>
                                      {/* Included Features */}
                                      {pkg.included_features_details?.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                          <Box>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                              Included Features:
                                            </Typography>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                              {pkg.included_features_details.map((feature, fIdx) => (
                                                <Box key={fIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                  <CheckCircle2 size={16} color="#4caf50" />
                                                  <Typography variant="body2">{feature.name}</Typography>
                                                </Box>
                                              ))}
                                            </Box>
                                          </Box>
                                        </Grid>
                                      )}

                                      {/* Excluded Features */}
                                      {pkg.excluded_features_details?.length > 0 && (
                                        <Grid item xs={12} md={6}>
                                          <Box>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                              Excluded Features:
                                            </Typography>
                                            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                                              {pkg.excluded_features_details.map((feature, fIdx) => (
                                                <Box key={fIdx} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                  <XCircle size={16} color="#f44336" />
                                                  <Typography variant="body2" color="text.secondary">
                                                    {feature.name}
                                                  </Typography>
                                                </Box>
                                              ))}
                                            </Box>
                                          </Box>
                                        </Grid>
                                      )}
                                    </Grid>
                                  )}
                                </Box>
                              </Collapse>
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 3 }} />

                  {/* Question responses */}
                  {service.question_responses?.length > 0 && (
                    <Box>
                      <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom mb={2}>
                        <FileText size={20} />
                        Job Specs
                      </Typography>
                      {service.question_responses.map((response, rIdx) => (
                        <Box key={rIdx} sx={{ borderLeft: "2px solid #ddd", pl: 2, mb: 2 }}>
                          <Typography fontWeight={600}>{response.question_text}</Typography>
                          {response.yes_no_answer !== null && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                              {response.yes_no_answer ? (
                                <CheckCircle2 color="green" size={16} />
                              ) : (
                                <XCircle color="red" size={16} />
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {response.yes_no_answer ? "Yes" : "No"}
                              </Typography>
                            </Box>
                          )}
                          {response.text_answer && (
                            <Typography variant="body2" color="text.secondary" pl={3} mt={1}>
                              {response.text_answer}
                            </Typography>
                          )}
                          {response?.option_responses && response?.option_responses.length > 0 && (
                            <Box sx={{ ml: 1.5, mt: 1 }}>
                              {response?.option_responses.map((opt, oIdx) => (
                                <Typography key={oIdx} variant="body2" color="text.secondary">
                                  • {opt?.option_text} {response.question_type === "quantity" && opt?.quantity >= 1 ? ` (Qty: ${opt.quantity})` : ""}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {response?.sub_question_responses && response?.sub_question_responses.length > 0 && (
                            <Box sx={{ ml: 1.5, mt: 1 }}>
                              {response?.sub_question_responses.map((subQ, sIdx) => (
                                <Typography key={sIdx} variant="body2" color="text.secondary">
                                  • {subQ?.sub_question_text}: {subQ?.answer ? 'Yes' : 'No'}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          {response.measurement_responses.map((measurement, idx) => (
                            <Box 
                              key={measurement.id} 
                              sx={{ 
                                mb: idx < response.measurement_responses.length - 1 ? 1 : 0,
                                pl: 1,
                                borderLeft: "3px solid #023c8f"
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 600, color: "#023c8f", fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" } }}>
                                {measurement.option_text}
                              </Typography>
                              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                                  Length: <strong>{measurement.length}</strong>
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                                  Width: <strong>{measurement.width}</strong>
                                </Typography>
                                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                                  Quantity: <strong>{measurement.quantity}</strong>
                                </Typography>
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}

                  {/* Addons Section - Show below Job Specs in each service card */}
                  {data.addons && data.addons.length > 0 && (
                    <>
                      <Divider sx={{ my: 3 }} />
                      <Box>
                        <Typography variant="h6" display="flex" alignItems="center" gap={1} gutterBottom mb={2}>
                          <Tag size={20} color="#51b7ae" />
                          Add-On Services
                        </Typography>
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          {data.addons.map((addon, addonIdx) => (
                            <Box
                              key={addon.id || addonIdx}
                              sx={{
                                p: 2,
                                border: "1px solid",
                                borderColor: "divider",
                                borderRadius: 1,
                                bgcolor: "grey.50",
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                                    {addon.addon_name}
                                  </Typography>
                                  {addon.addon_description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                      {addon.addon_description}
                                    </Typography>
                                  )}
                                </Box>
                                <Box sx={{ textAlign: "right", ml: 2 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    ${addon.addon_price} {addon.quantity > 1 && `× ${addon.quantity}`}
                                  </Typography>
                                  <Typography variant="h6" fontWeight={600} color="primary">
                                    ${addon.subtotal || (parseFloat(addon.addon_price || 0) * (addon.quantity || 1)).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                              {addon.quantity > 1 && (
                                <Typography variant="caption" color="text.secondary">
                                  Quantity: {addon.quantity}
                                </Typography>
                              )}
                            </Box>
                          ))}
                        </Box>
                        {/* {data.total_addons_price && parseFloat(data.total_addons_price) > 0 && (
                          <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="h6" fontWeight={600}>
                                Total Add-Ons
                              </Typography>
                              <Typography variant="h6" fontWeight={600} color="primary">
                                ${data.total_addons_price}
                              </Typography>
                            </Box>
                          </Box>
                        )} */}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        {/* Additional Info */}
        {tab === "additional" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FileText size={20} color="#51b7ae" />
                    <Typography variant="subtitle1">Additional Information</Typography>
                  </Box>
                }
              />
              <CardContent>
                {data.availabilities?.length > 0 && (
                  <Box mb={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                      <Calendar size={16} />
                      <Typography fontWeight={600}>Preferred Dates:</Typography>
                    </Box>
                    {data.availabilities.map((availability, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={1} ml={3} mb={0.5}>
                        <Typography>
                          {new Date(availability.date).toLocaleDateString()} – {availability.time}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
                
                {data.additional_data?.preferred_contact_method && (
                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Phone size={16} />
                    <Typography>
                      <strong>Preferred Contact Method:</strong> {data.additional_data.preferred_contact_method}
                    </Typography>
                  </Box>
                )}
                
                {data.additional_data?.submitted_at && (
                  <Box display="flex" alignItems="center" gap={1} mb={3}>
                    <Calendar size={16} />
                    <Typography>
                      <strong>Submitted At:</strong> {new Date(data.additional_data.submitted_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}

                {data.additional_data?.additional_notes && (
                  <Box mb={3}>
                    <Box display="flex" alignItems="flex-start" gap={1} mb={1}>
                      <FileText size={16} />
                      <Typography fontWeight={600}>Additional Notes:</Typography>
                    </Box>
                    <Typography whiteSpace="pre-wrap" ml={3}>
                      {data.additional_data.additional_notes}
                    </Typography>
                  </Box>
                )}
                
                {!data.additional_data && !data.availabilities?.length && (
                  <Typography color="text.secondary" align="center" py={3}>
                    No additional information available
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Bid Notes Section */}
            <div gap={2} style={{ display: 'flex', gap: '16px' }}>
              {/* Bid Notes (Private) */}
              <Grid item xs={12} md={6} width={"50%"}>
                <Card>
                  <CardHeader
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      py: 1.5
                    }}
                    title={
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          BID NOTES (PRIVATE)
                        </Typography>
                        <IconButton size="small" sx={{ color: "white" }} onClick={() => setEditPrivate(!editPrivate)}>
                          {editPrivate ? <Save size={18} /> : <Edit2 size={18} />}
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent sx={{ minHeight: 200, bgcolor: "#fafafa" }}>
                    <Typography whiteSpace="pre-wrap" color="text.secondary">
                      {editPrivate ? (
                        <Box display="flex" flexDirection="column" gap={2}>
                          <TextField
                            multiline
                            minRows={6}
                            value={privateNotes}
                            onChange={(e) => setPrivateNotes(e.target.value)}
                            variant="outlined"
                            fullWidth
                          />
                          <Button variant="contained" onClick={handleSavePrivate}>Save</Button>
                        </Box>
                      ) : (
                        <Typography whiteSpace="pre-wrap" color="text.secondary">
                          {privateNotes || "No private notes available"}
                        </Typography>
                      )}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Bid Notes (Public) */}
              <Grid item xs={12} md={6} width={"50%"}>
                <Card>
                  <CardHeader
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      py: 1.5
                    }}
                    title={
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          BID NOTES (PUBLIC)
                        </Typography>
                        <IconButton size="small" sx={{ color: "white" }} onClick={() => setEditPublic(!editPublic)}>
                          {editPublic ? <Save size={18} /> : <Edit2 size={18} />}
                        </IconButton>
                      </Box>
                    }
                  />
                  <CardContent sx={{ minHeight: 200, bgcolor: "#fafafa" }}>
                    {editPublic ? (
                      <Box display="flex" flexDirection="column" gap={2}>
                        <TextField
                          multiline
                          minRows={6}
                          value={publicNotes}
                          onChange={(e) => setPublicNotes(e.target.value)}
                          variant="outlined"
                          fullWidth
                        />
                        <Button variant="contained" onClick={handleSavePublic}>Save</Button>
                      </Box>
                    ) : (
                      <Typography whiteSpace="pre-wrap" color="text.secondary">
                        {publicNotes || "No public notes available"}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </div>
          </Box>
        )}

        {/* Images Tab */}
        {tab === "images" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Card>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <ImageIcon size={20} color="#51b7ae" />
                    <Typography variant="subtitle1">Quote Images</Typography>
                  </Box>
                }
                action={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-image-input"
                      type="file"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <label htmlFor="upload-image-input">
                      <Button
                        component="span"
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={uploadingImage ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={uploadingImage || !data?.id}
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </Button>
                    </label>
                  </Box>
                }
              />
              <CardContent>
                {isLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : images && images.length > 0 ? (
                  <Grid container spacing={2}>
                    {images.map((image) => (
                      <Grid item xs={12} sm={6} md={4} key={image.id}>
                        <Paper
                          elevation={2}
                          sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            "&:hover .delete-button": {
                              opacity: 1,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: "relative",
                              width: "100%",
                              paddingTop: "75%", // 4:3 aspect ratio
                              backgroundColor: "grey.100",
                            }}
                          >
                            <img
                              src={image.url || image.image_url || image.file || image.image}
                              alt={`Quote image ${image.id || image.name || 'image'}`}
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <Box
                              sx={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "none",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "grey.200",
                              }}
                            >
                              <AlertCircle size={32} color="#999" />
                            </Box>
                          </Box>
                          <Box
                            className="delete-button"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              opacity: 0,
                              transition: "opacity 0.2s",
                            }}
                          >
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleImageDelete(image.id || image.image_id)}
                              disabled={deletingImageId === (image.id || image.image_id)}
                              sx={{
                                backgroundColor: "rgba(255, 255, 255, 0.9)",
                                "&:hover": {
                                  backgroundColor: "rgba(255, 255, 255, 1)",
                                },
                              }}
                            >
                              {deletingImageId === (image.id || image.image_id) ? (
                                <CircularProgress size={16} />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </IconButton>
                          </Box>
                          {(image.created_at || image.uploaded_at) && (
                            <Box sx={{ p: 1, backgroundColor: "grey.50" }}>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded: {new Date(image.created_at || image.uploaded_at).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      py: 6,
                      textAlign: "center",
                    }}
                  >
                    <ImageIcon size={48} color="#ccc" style={{ marginBottom: 16 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No images uploaded yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Upload images to attach them to this quote
                    </Typography>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-image-input-empty"
                      type="file"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                    <label htmlFor="upload-image-input-empty">
                      <Button
                        component="span"
                        variant="contained"
                        color="primary"
                        startIcon={uploadingImage ? <CircularProgress size={16} /> : <Upload size={16} />}
                        disabled={uploadingImage || !data?.id}
                      >
                        {uploadingImage ? 'Uploading...' : 'Upload Your First Image'}
                      </Button>
                    </label>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Size Range Selection Dialog */}
      <Dialog 
        open={sizeRangeDialogOpen} 
        onClose={handleCloseSizeRangeDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">Select Square Footage</Typography>
            <IconButton onClick={handleCloseSizeRangeDialog} size="small">
              <X />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {sizeRangesLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : sizeRanges.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography color="text.secondary">
                No square footage options available for {propertyType} properties
              </Typography>
            </Box>
          ) : (
            <RadioGroup
              value={selectedSizeRange || ''}
              onChange={(e) => setSelectedSizeRange(e.target.value)}
            >
              <List sx={{ width: '100%' }}>
                {sizeRanges.map((range) => (
                  <ListItem key={range.id} disablePadding>
                    <ListItemButton
                      selected={selectedSizeRange === range.id}
                      onClick={() => setSelectedSizeRange(range.id)}
                      sx={{
                        borderRadius: 1,
                        mb: 1,
                        border: selectedSizeRange === range.id ? '2px solid' : '1px solid',
                        borderColor: selectedSizeRange === range.id ? 'primary.main' : 'divider',
                        bgcolor: selectedSizeRange === range.id ? 'primary.50' : 'transparent',
                        '&:hover': {
                          bgcolor: selectedSizeRange === range.id ? 'primary.100' : 'grey.50',
                        },
                      }}
                    >
                      <FormControlLabel
                        value={range.id}
                        control={<Radio />}
                        label={
                          <ListItemText
                            primary={
                              <Typography variant="body1" fontWeight={600}>
                                {range.min_sqft} {range.max_sqft === null 
                                  ? "sq ft And Up" 
                                  : `- ${range.max_sqft} sq ft`}
                              </Typography>
                            }
                          />
                        }
                        sx={{ margin: 0, width: '100%' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </RadioGroup>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSizeRangeDialog} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleSaveSizeRange}
            variant="contained"
            disabled={!selectedSizeRange || updatingSizeRange || selectedSizeRange === data?.size_range?.id}
            startIcon={updatingSizeRange ? <CircularProgress size={16} /> : <Save size={16} />}
          >
            {updatingSizeRange ? 'Updating...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}