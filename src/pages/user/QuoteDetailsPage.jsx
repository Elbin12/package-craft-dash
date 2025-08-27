import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Stack,
  Avatar,
  Container,
  Grid,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Person,
  BusinessCenter,
  LocalOffer,
  QuestionAnswer,
  Receipt,
  LocationOn,
  ArrowBack,
  Mail,
  Phone,
  Home,
  ExpandMore,
  ExpandLess,
  Check,
  Close,
  Add,
} from '@mui/icons-material';
import { useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

const statusStyles = {
  pending: { bgcolor: 'warning.light', color: 'warning.dark' },
  approved: { bgcolor: 'success.light', color: 'success.dark' },
  rejected: { bgcolor: 'error.light', color: 'error.dark' },
  submitted: { bgcolor: 'info.light', color: 'info.dark' },
  draft: { bgcolor: 'grey.100', color: 'grey.800' },
  responses_completed: { bgcolor: 'success.light', color: 'success.dark' },
};

const formatYesNo = (val) => {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return 'N/A';
};

const QuoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedServices, setExpandedServices] = useState({});
  
  const {
    data: quote,
    isLoading,
    isError,
    error,
  } = useGetQuoteDetailsQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const sigCanvas = useRef();

  // Expand all services by default
  useEffect(() => {
    if (quote?.service_selections) {
      const initialExpanded = {};
      quote.service_selections.forEach((service) => {
        initialExpanded[service.id] = true;
      });
      setExpandedServices(initialExpanded);
    }
  }, [quote]);

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
      </Box>
    );
  }

  if (isError || !quote) {
    return (
      <Box p={4}>
        <Button
          startIcon={<ArrowBack />}
          variant="text"
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load quote
        </Typography>
        <Typography variant="body2">
          {error?.message || 'Quote not found or something went wrong.'}
        </Typography>
      </Box>
    );
  }

  const {
    first_name,
    last_name,
    company_name,
    customer_email,
    customer_phone,
    customer_address,
    street_address,
    postal_code,
    property_type,
    num_floors,
    heard_about_us,
    size_range,
    location_details,
    status,
    total_base_price,
    total_adjustments,
    total_surcharges,
    final_total,
    created_at,
    expires_at,
    service_selections,
    quote_surcharge_applicable,
    additional_data,
    addons,
    total_addons_price,
  } = quote;

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case "yes_no":
      case "conditional":
        return response.yes_no_answer ? "Yes" : "No";
      case "multiple_yes_no":
        return (
          response.sub_question_responses
            .filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected"
        );
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ");
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ");
      default:
        return "N/A";
    }
  };

  return (
    <Box className="min-h-screen" sx={{ background: 'linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)', pb: 6 }}>
      {/* Header - Keep existing navbar */}
      <Box
        sx={{
          bgcolor:'white',
          bg: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          py: 2,
        }}
        className='fixed w-full z-20'
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1} >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box>
                <Typography variant="h4" color='#023c8f' fontWeight="600">
                  Quote Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    ID: {quote.id}
                  </Typography>
                  <Chip
                    label={status?.charAt(0).toUpperCase() + status?.slice(1)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      ...statusStyles[status?.toLowerCase()] || statusStyles['draft'],
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box maxWidth="1400px" className='py-36' mx="auto" px={{ xs: 2, md: 4 }}>
        <Container maxWidth="lg">
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={6}>
            {/* Left column */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Customer Info */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{first_name} {last_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{customer_email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{customer_phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        House sq ft
                      </Typography>
                      <Typography variant="body1">{size_range?.min_sqft} {size_range?.max_sqft===null? " sq ft And Up" : `- ${size_range?.max_sqft} sq ft`}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Property Type
                      </Typography>
                      <Typography variant="body1">{property_type?.charAt(0).toUpperCase() + property_type?.slice(1)}</Typography>
                    </Grid>
                    {company_name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Company
                        </Typography>
                        <Typography variant="body1">{company_name}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Floors
                      </Typography>
                      <Typography variant="body1">{num_floors}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">{street_address || customer_address}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Province, City
                      </Typography>
                      <Typography variant="body1">{location_details?.address}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Postal Code
                      </Typography>
                      <Typography variant="body1">{postal_code}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        How did you hear about us?
                      </Typography>
                      <Typography variant="body1">{heard_about_us?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Service Selections */}
              {service_selections?.map((selection) => (
                <Card key={selection.id}>
                  {/* Service Header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 0.5,
                      backgroundColor: '#023c8f',
                      color: 'white',
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#012a6b" },
                    }}
                    onClick={() => toggleServiceExpansion(selection.id)}
                  >
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="h6" fontWeight={600} sx={{ color: 'white' }}>
                          {selection.service_details?.name}
                        </Typography>
                      </Box>
                      <IconButton sx={{ color: 'white' }}>
                        {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Collapsible Content */}
                  <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 3, py: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
                        {selection.service_details?.description}
                      </Typography>
                      
                      {/* Service Disclaimers */}
                      {(selection.service_details?.service_settings?.general_disclaimer || 
                        selection.service_details?.service_settings?.bid_in_person_disclaimer) && (
                        <Box sx={{ mb: 2 }}>
                          {selection.service_details?.service_settings?.general_disclaimer && (
                            <Box 
                              sx={{ 
                                backgroundColor: '#d9edf7',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                mb: 1,
                                border: '1px solid #023c8f'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#023c8f',
                                  fontWeight: 500,
                                  fontSize: '13px'
                                }}
                              >
                                <strong>General:</strong> {selection.service_details.service_settings.general_disclaimer}
                              </Typography>
                            </Box>
                          )}
                          
                          {selection.service_details?.service_settings?.bid_in_person_disclaimer && (
                            <Box 
                              sx={{ 
                                backgroundColor: '#d9edf7',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                mb: 1,
                                border: '1px solid #023c8f'
                              }}
                            >
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: '#023c8f',
                                  fontWeight: 500,
                                  fontSize: '13px'
                                }}
                              >
                                <strong>Bid in Person:</strong> {selection.service_details.service_settings.bid_in_person_disclaimer}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Selected Package Display */}
                      {selection.package_quotes?.[0] && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                            Selected Package
                          </Typography>
                          <Card
                            variant="outlined"
                            sx={{
                              border: "2px solid #42bd3f",
                              bgcolor: "#f8fff8",
                              borderRadius: 3,
                              minHeight: 220,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                            }}
                          >
                            <CardContent sx={{ p: 4 }}>
                              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                <Typography variant="h6" fontWeight={700}>
                                  {selection.package_quotes[0].package_name}
                                </Typography>
                                <Chip
                                  label="Selected"
                                  sx={{
                                    bgcolor: "#42bd3f",
                                    color: "white",
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                ${formatPrice(selection.package_quotes[0].total_price)}
                              </Typography>

                              {/* Features List */}
                              <Box>
                                {[
                                  ...(selection.package_quotes[0].included_features_details || []).map((f) => ({
                                    ...f,
                                    included: true,
                                  })),
                                  ...(selection.package_quotes[0].excluded_features_details || []).map((f) => ({
                                    ...f,
                                    included: false,
                                  })),
                                ].map((feature) => (
                                  <Box key={feature.id} display="flex" alignItems="center" mb={0.8}>
                                    {feature.included ? (
                                      <Check sx={{ fontSize: 18, color: "#42bd3f", mr: 1 }} />
                                    ) : (
                                      <Close sx={{ fontSize: 18, color: "#9e9e9e", mr: 1 }} />
                                    )}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        color: feature.included ? "text.primary" : "text.disabled",
                                        fontWeight: feature.included ? 500 : 400,
                                      }}
                                    >
                                      {feature.name}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      )}

                      {/* Question Responses */}
                      {selection.question_responses?.length > 0 && (
                        <Box mt={4}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#023c8f' }} gutterBottom>
                            Question Responses
                          </Typography>
                          <Grid container spacing={2}>
                            {selection.question_responses.map((response) => (
                              <Grid item xs={12} sm={6} key={response.id}>
                                <Box p={2} sx={{ bgcolor: "#d9edf7", borderRadius: 1, border: "1px solid #023c8f" }}>
                                  <Typography variant="body2" fontWeight={600} gutterBottom sx={{ color: '#023c8f' }}>
                                    {response.question_text}
                                  </Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {renderQuestionResponse(response)}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              ))}

              {/* Add-ons Section */}
              {addons && addons.length > 0 && (
                <Card>
                  <Box sx={{ p: 3, py: 2}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Add />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#023c8f' }}>
                          Additional Services
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addons.length} additional service{addons.length > 1 ? 's' : ''} selected
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ overflow: 'hidden' }}>
                    {addons.map((addon, index) => (
                      <Box
                        key={addon.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 3,
                          borderBottom: index < addons.length - 1 ? '1px solid #f0f0f0' : 'none',
                          '&:hover': {
                            bgcolor: '#f8f9fa',
                          },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={600}
                            sx={{ color: '#023c8f', mb: 0.5 }}
                          >
                            {addon.name}
                          </Typography>
                          {addon.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {addon.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ color: '#42bd3f' }}
                          >
                            ${formatPrice(addon.base_price)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Additional Information */}
              {additional_data && (
                <Card >
                  <Box sx={{ p: 3, py:2}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color:'#023c8f' }}>
                        Additional Information
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      {additional_data.signature && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Signature
                          </Typography>
                          <img
                            src={`data:image/png;base64,${additional_data.signature}`}
                            alt="Signature"
                            style={{ border: "1px solid #ccc", maxWidth: "200px" }}
                          />
                        </Box>
                      )}

                      {additional_data.additional_notes && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Additional Notes
                          </Typography>
                          <Box
                            sx={{
                              border: "1px solid #334155",
                              borderRadius: 1,
                              p: 2,
                            }}
                          >
                            <Typography variant="body2">
                              {additional_data.additional_notes}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Right column - pricing */}
            <Box>
              <Paper
                elevation={3}
                sx={{
                  borderRadius: 2,
                  position: 'sticky',
                  top: 80,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    background: '#023c8f',
                    color: 'white',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Receipt fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pricing Summary
                  </Typography>
                </Box>
                <CardContent>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2">Base Price</Typography>
                      <Typography variant="subtitle2">
                        ${formatPrice(total_base_price || 0)}
                      </Typography>
                    </Box>
                    
                    {/* Add-ons Price */}
                    {total_addons_price && parseFloat(total_addons_price) > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2">Add-ons</Typography>
                        <Typography variant="subtitle2">
                          ${formatPrice(total_addons_price)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2">Surcharges</Typography>
                      <Typography variant="subtitle2">
                        ${formatPrice(total_surcharges || 0)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="body2">Adjustments</Typography>
                      <Typography variant="subtitle2">
                        ${formatPrice(total_adjustments || 0)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(243,244,246,0.5)',
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle1" fontWeight="600">
                        Final Total
                      </Typography>
                      <Typography variant="h5" fontWeight="500" color="#42bd3f">
                        ${formatPrice(final_total || 0)}
                      </Typography>
                    </Box>
                    
                    <Divider />
                    <Typography variant="caption" color="text.secondary" align="center">
                      Quote created on{' '}
                      {new Date(created_at).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Box>
                </CardContent>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;