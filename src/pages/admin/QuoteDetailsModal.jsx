"use client"
import React, { useState } from "react"
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
} from "lucide-react"
import { useAddNotesMutation, useCreateQuestionResponsesMutation, useUpdateQuestionResponsesForSubmittedMutation } from "../../store/api/user/quoteApi"
import { add, set } from "date-fns"

export function QuoteDetailsModal({ open, onClose, data, isLoading = false, onEdit, isSubmitted }) {
  const [tab, setTab] = useState("overview")
  const [expandedPackages, setExpandedPackages] = useState({})

  const [editPrivate, setEditPrivate] = useState(false);
  const [editPublic, setEditPublic] = useState(false);
  const [privateNotes, setPrivateNotes] = useState(data?.bid_notes_private || "");
  const [publicNotes, setPublicNotes] = useState(data?.bid_notes_public || "");

  const [updateQuestionResponses] = useCreateQuestionResponsesMutation();
  const [updateQuestionResponsesForSubmitted] = useUpdateQuestionResponsesForSubmittedMutation();

  const [addNotes] = useAddNotesMutation();

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
                      color={data.status === 'submitted' ? 'success' : 'default'}
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
                      <Typography variant="subtitle2" fontWeight={700} color="primary">
                        {service.service_details?.name || 'Service ' + (idx + 1)}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={700} color="primary">
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
                                  cursor: "pointer"
                                }}
                                onClick={() => togglePackage(serviceIdx, pkgIdx)}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                  <IconButton size="small" sx={{ bgcolor: "#1976d2", color: "white", width: 32, height: 32 }}>
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </IconButton>
                                  <Box>
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
                                    <Typography variant="body2" color="text.secondary">
                                      ${pkg.total_price}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Plus Tax
                                    </Typography>
                                  </Box>
                                </Box>
                                {isSubmitted && !pkg.is_selected && (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent toggle when clicking button
                                      handlePackageSelect(serviceIdx, pkgIdx)
                                    }}
                                    sx={{ ml: 2 }}
                                  >
                                    Select
                                  </Button>
                                )}
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
                                      <Typography variant="body1" fontWeight={600} color="primary">
                                        ${pkg.total_price}
                                      </Typography>
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
                                  • {opt?.option_text} {opt?.quantity >= 1 ? `(Qty: ${opt?.quantity})` : ''}
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
                        </Box>
                      ))}
                    </Box>
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
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}