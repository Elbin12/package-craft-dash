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
  Download,
  PictureAsPdf,
} from '@mui/icons-material';
import { useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

// PDF generation import
import jsPDF from 'jspdf';
import DisclaimerBox from '../../components/user/DisclaimerBox';
import { handleDownloadPDF } from '../../utils/handleDownloadPDF';

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
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
  useEffect(() => {
    if (quote?.service_selections) {
      const allExpanded = {};
      quote.service_selections.forEach((s) => {
        allExpanded[s.id] = true;
      });
      setExpandedServices(allExpanded);
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
    is_bid_in_person
  } = quote;

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
    return numPrice
  };

  const findFinalTotal = ()=> {
    return formatPrice(total_base_price) ; 
  }

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
        <Box
          sx={{
            bgcolor:'white',
            bg: 'white',
            borderBottom: 1,
            borderColor: 'divider',
            mb: 4,
          }}
          className='w-full z-20 py-2 fixed'
        >
          <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1} >
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="start" flexDirection="column" gap={0} flexWrap="wrap">
                <Typography variant="h4" color='#023c8f' fontWeight="600"
                  sx={{
                    fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" }, // xs=h6-ish, sm=h5, md=h4
                  }}
                >
                  Quote Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  <Typography variant="body2" color="text.secondary" sx={{fontSize:{ xs: "0.6rem", sm: "0.8rem", md: "0.9rem"}}}>
                    ID: {quote.id}
                  </Typography>
                  {/* <Chip
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
                  </Typography> */}
                </Box>
              </Box>
              
              {/* PDF Download Button */}
              {status!=="declined"&&
              <Button
                variant="contained"
                onClick={() =>
                  handleDownloadPDF(setIsGeneratingPDF, quote)
                }
                disabled={isGeneratingPDF}
                startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <Download />}
                sx={{
                    minWidth: { xs: 0 },
                    bgcolor: '#023c8f',
                    '&:hover': { bgcolor: '#012a6b' },
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '& .pdf-btn-label': {
                      display: 'none',
                      '@media (min-width:600px)': {
                        display: 'inline',
                      },
                    },
                    '& .MuiButton-startIcon': {
                      margin: { xs: 0, sm: '0 8px 0 0' }, // ✅ remove left gap on mobile
                    },
                  }}
                fullWidth={{ xs: true, sm: false }}
              >
                <span className="pdf-btn-label">
                  {isGeneratingPDF ? "Generating..." : "Download PDF"}
                </span>
              </Button>
              }
            </Box>
          </Box>
        </Box>

      {/* Body */}
      <Box maxWidth="1400px" className='py-36' mx="auto" sx={{px: { xs: 0, sm: 2, md: 4 }}}>
        <Container maxWidth="lg">
          <Box display="grid"  gridTemplateColumns={
              is_bid_in_person || status === "declined"
                  ? "1fr"
                  : { xs: "1fr", lg: "2fr 1fr" }
              } gap={6}>
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
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{first_name} {last_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{customer_email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{customer_phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        House sq ft
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{size_range?.min_sqft} {size_range?.max_sqft===null? " sq ft And Up" : `- ${size_range?.max_sqft} sq ft`}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Property Type
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{property_type?.charAt(0).toUpperCase() + property_type?.slice(1)}</Typography>
                    </Grid>
                    {company_name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Company
                        </Typography>
                        <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{company_name}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Floors
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{num_floors}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{street_address || customer_address}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Province, City
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{location_details?.address}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Postal Code
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{postal_code}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        How did you hear about us?
                      </Typography>
                      <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{heard_about_us?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {status === "declined" && (
                <Card
                  sx={{
                    backgroundColor: "#fefefe",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    mb: 2,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2.5} alignItems="flex-start">
                      <Avatar 
                        sx={{ 
                          bgcolor: "#ef4444", 
                          width: 40, 
                          height: 40,
                          fontSize: "1.1rem"
                        }}
                      >
                        ✕
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: "#dc2626",
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            mb: 1
                          }}
                        >
                          Quote Declined
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#6b7280",
                            lineHeight: 1.5,
                            fontSize: "0.95rem"
                          }}
                        >
                          We’d be happy to work with you on adjustments or create a new proposal tailored to your needs.
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

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
                        <Typography variant="h6" fontWeight={600} sx={{ color: 'white', fontSize:{ xs: "1rem", sm: "1.2rem", md: "1.5rem"},flex: 1,
                          whiteSpace: "normal",
                          wordBreak: "break-word"
                        }}>
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
                      {(selection.service_details.service_settings?.general_disclaimer || 
                      selection.service_details.service_settings?.bid_in_person_disclaimer) && (
                      <Box>
                        {!is_bid_in_person ?
                          selection.service_details.service_settings?.general_disclaimer && (
                            <DisclaimerBox 
                              title="Disclaimer"
                              content={selection.service_details.service_settings.general_disclaimer}
                              bgColor="#f5f5f5"
                              textColor="#333"
                              borderColor="#ddd"
                            />
                          ) :
                          selection.service_details.service_settings?.bid_in_person_disclaimer && (
                            <DisclaimerBox 
                              title="Notice"
                              content={selection.service_details.service_settings.bid_in_person_disclaimer}
                              bgColor="#fffbf0"
                              textColor="#8a6d3b"
                              borderColor="#f0ad4e"
                            />
                          )
                        }
                      </Box>
                    )}

                      {/* Selected Package Display */}
                      {!is_bid_in_person && status!=="declined"&&
                        selection.package_quotes?.find(pkg => pkg.is_selected) && (
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
                                      {selection.package_quotes?.find(pkg => pkg.is_selected).package_name}
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
                                    ${formatPrice(selection.package_quotes?.find(pkg => pkg.is_selected).total_price)}
                                  </Typography>

                                  {/* Features List */}
                                  <Box
                                    sx={{ 
                                      maxHeight: {xs:240,sm:280, md:340}, 
                                      overflowY: "auto", 
                                      pb:2,
                                      "&::-webkit-scrollbar": {
                                        width: 4
                                      },
                                      "&::-webkit-scrollbar-track": {
                                        background: "#f1f1f1",
                                        borderRadius: 3
                                      },
                                      "&::-webkit-scrollbar-thumb": {
                                        background: "#c1c1c1",
                                        borderRadius: 3,
                                        "&:hover": {
                                          background: "#a8a8a8"
                                        }
                                      }
                                    }}
                                  >
                                    {[
                                      ...(selection.package_quotes?.find(pkg => pkg.is_selected).included_features_details || []).map((f) => ({
                                        ...f,
                                        included: true,
                                      })),
                                      ...(selection.package_quotes?.find(pkg => pkg.is_selected).excluded_features_details || []).map((f) => ({
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
                          )
                      }

                      {/* Question Responses */}
                      {selection.question_responses?.length > 0 && (
                        <Box mt={2}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#023c8f", fontSize:{ xs: "0.9rem", sm: "1.2rem", md: "1.3rem"} }}>
                            Your Responses
                          </Typography>
                          <Box sx={{ bgcolor: "#f8f9fa", borderRadius: 1, p: 1 }}>
                            {selection.question_responses.map((response, index) => (
                              <Box key={response.id} sx={{ display: 'flex', mb: 0.5, alignItems: "flex-start"}}>
                                  <Typography variant="body1" sx={{ color: "#023c8f", fontWeight: 600, mr: 1, minWidth: '25px', fontSize: { xs: "0.8rem", sm: "1rem", md: "1rem" }}}>
                                    Q{index + 1}:
                                  </Typography>
                                <Box >
                                  <Typography variant="body1" sx={{ color: "#023c8f", flex: 1, mr: 1, fontSize: { xs: "0.8rem", sm: "1rem", md: "1rem" }}}>
                                    {response.question_text}
                                  </Typography>
                                  <Typography variant="body2" sx={{color: "#023c8f", fontWeight: 600, minWidth: 'fit-content', pl:1, fontSize: { xs: "0.7rem", sm: "0.85rem", md: "0.9rem" }}}>
                                    {renderQuestionResponse(response)}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
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
              {additional_data && (additional_data?.signature || additional_data?.additional_notes) && (
                <Card >
                  <Box sx={{ p: 3, py:2}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color:'#023c8f',fontSize:{ xs: "1rem", sm: "1.2rem", md: "1.5rem"} }}>
                        Additional Information
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      {!is_bid_in_person && additional_data.signature && (
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
            {!is_bid_in_person && status!=="declined" &&
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
                      {service_selections?.map((selection) => (
                        <Box
                          sx={{ 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2">{selection?.service_details?.name}</Typography>
                          <Typography variant="subtitle2">
                            ${formatPrice(selection?.final_total_price || 0)}
                          </Typography>
                        </Box>
                      ))}
                      
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
                      
                      {/* <Box
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
                      </Box> */}
                      {/* <Box
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
                      </Box> */}

                      {quote?.applied_coupon &&
                        <Box display="flex" flexDirection="column" gap={2}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Typography variant="body2">
                              {quote?.applied_coupon?.code}
                            </Typography>
                            <Typography variant="subtitle2">
                              - ${quote?.discounted_amount}
                            </Typography>
                          </Box>
                        </Box>
                      }

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
                        <Typography variant="subtitle1" fontWeight={600} noWrap>
                          Final Total
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Typography variant="h5" fontWeight={500} color="#42bd3f" noWrap>
                            ${formatPrice(final_total || 0)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1 }}>
                            Plus Tax
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Divider />
                      <Box display={"flex"} flexDirection={"column"} alignItems={"center"} gap={1}>
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
                        <Typography variant="caption" color="text.secondary" align="center"
                          sx={{
                            fontWeight: 600,
                            fontSize:{ xs: "0.7rem", sm: "0.8rem", md: "0.8rem"},
                            borderRadius: 0.3,
                            bgcolor:"#D9FFD9",
                            color:"success.dark",
                            width:"fit-content",
                            px:3
                          }}
                        >
                          Status:{" "}
                          {status?.charAt(0).toUpperCase() + status?.slice(1)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Paper>
              </Box>
            }
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;