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
} from "lucide-react"

export function QuoteDetailsModal({ open, onClose, data, isLoading = false, onEdit }) {
  const [tab, setTab] = useState("overview")

  const handleTabChange = (event, newValue) => {
    setTab(newValue)
  }

  if (isLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <CircularProgress />
        </DialogContent>
      </Dialog>
    )
  }

  if (!data) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
          <Typography color="text.secondary">No data available</Typography>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
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
          <IconButton onClick={onClose} sx={{ color: "primary.contrastText" }}>
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
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    {data.company_name && (
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Company
                        </Typography>
                        <Typography>{data.company_name}</Typography>
                      </>
                    )}
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Address
                    </Typography>
                    <Typography>{data.street_address}</Typography>
                    <Typography color="text.secondary">{data.postal_code}</Typography>
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
                      Type
                    </Typography>
                    <Typography>{data.property_type}</Typography>

                    {data.property_name && (
                      <>
                        <Typography variant="body2" color="text.secondary" mt={2}>
                          Property Name
                        </Typography>
                        <Typography>{data.property_name}</Typography>
                      </>
                    )}

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Floors
                    </Typography>
                    <Typography>{data.num_floors}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography>{data.location_details?.name}</Typography>

                    <Typography variant="body2" color="text.secondary" mt={2}>
                      Heard About Us
                    </Typography>
                    <Typography>{data.heard_about_us}</Typography>

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

            {/* Pricing Summary */}
            <Card sx={{ color: "primary" }}>
              <CardHeader
                title={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <DollarSign size={18} color="#51b7ae"/>
                    <Typography variant="subtitle1">Pricing Summary</Typography>
                  </Box>
                }
              />
              <CardContent spacing={4}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Base Price</Typography>
                  <Typography>${data.total_base_price}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Adjustments</Typography>
                  <Typography>${data.total_adjustments}</Typography>
                </Box>
                {/* <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Surcharges</Typography>
                  <Typography>${data.total_surcharges}</Typography>
                </Box> */}
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Add-ons</Typography>
                  <Typography>${data.total_addons_price}</Typography>
                </Box>
                {data.is_coupon_applied && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", color: "success.light" }}>
                    <Typography>Discount</Typography>
                    <Typography>- ${data.discounted_amount}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2, borderColor: "primary.contrastText" }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h6">Final Total</Typography>
                  <Typography variant="h5">${data.final_total}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Services */}
        {tab === "services" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {data.service_selections?.map((service, idx) => (
              <Card key={idx}>
                <CardHeader
                  title={
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Box>
                        <Typography variant="subtitle1">{service.service_details.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Package: {service.selected_package_details?.name}
                        </Typography>
                      </Box>
                      <Chip label={`$${service.final_total_price}`} color="primary" />
                    </Box>
                  }
                />
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Base Price
                      </Typography>
                      <Typography>${service.final_base_price}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Adjustments
                      </Typography>
                      <Typography>${service.question_adjustments}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="caption" color="text.secondary">
                        Total
                      </Typography>
                      <Typography color="primary">${service.final_total_price}</Typography>
                    </Grid>
                  </Grid>

                  {/* Question responses */}
                  {service.question_responses?.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" display="flex" alignItems="center" gap={1} gutterBottom mb={2}>
                        <FileText size={20} />
                        <Typography variant="h6">Question Responses</Typography>
                      </Typography>
                      {service.question_responses.map((response, rIdx) => (
                        <Box key={rIdx} sx={{ borderLeft: "2px solid #ddd", pl: 2, mb: 2 }}>
                          <Typography>{response.question_text}</Typography>
                          {response.yes_no_answer !== null && (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
                            <Typography variant="body2" color="text.secondary" pl={3}>
                              {response.text_answer}
                            </Typography>
                          )}
                          {response?.option_responses && response?.option_responses.length > 0 && (
                                  <div style={{ marginLeft: '12px' }}>
                                    {response?.option_responses.map((opt, oIdx) => (
                                      <p key={oIdx} style={{ color: '#6b7280' }}>
                                        • {opt?.option_text} {opt?.quantity >= 1 ? `(Qty: ${opt?.quantity})` : ''}
                                      </p>
                                    ))}
                                  </div>
                                )}
                                {response?.sub_question_responses && response?.sub_question_responses.length > 0 && (
                                  <div style={{ marginLeft: '12px' }}>
                                    {response?.sub_question_responses.map((subQ, sIdx) => (
                                      <p key={sIdx} style={{ color: '#6b7280' }}>
                                        • {subQ?.sub_question_text}: {subQ?.answer ? 'Yes' : 'No'}
                                      </p>
                                    ))}
                                  </div>
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
              {data.additional_data?.preferred_start_date && (
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Calendar size={16} />
                  <Typography>
                    Preferred Start Date:{" "}
                    {new Date(data.additional_data.preferred_start_date).toLocaleDateString()}
                  </Typography>
                </Box>
              )}
              {data.additional_data?.preferred_contact_method && (
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Phone size={16} />
                  <Typography>Preferred Contact Method: {data.additional_data.preferred_contact_method}</Typography>
                </Box>
              )}
              {data.additional_data?.additional_notes && (
                <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                  <FileText size={16} />
                  <Typography whiteSpace="pre-wrap">{data.additional_data.additional_notes}</Typography>
                </Box>
              )}
              {data.additional_data?.submitted_at && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Calendar size={16} />
                  <Typography>
                    Submitted At: {new Date(data.additional_data.submitted_at).toLocaleString()}
                  </Typography>
                </Box>
              )}
              {!data.additional_data && (
                <Typography color="text.secondary" align="center" py={3}>
                  No additional information available
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
