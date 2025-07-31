import React from 'react';
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
} from '@mui/icons-material';
import { useGetQuoteByIdQuery } from '../../store/api/user/quotesApi';

const statusStyles = {
  pending: { bgcolor: 'warning.light', color: 'warning.dark' },
  approved: { bgcolor: 'success.light', color: 'success.dark' },
  rejected: { bgcolor: 'error.light', color: 'error.dark' },
  draft: { bgcolor: 'grey.100', color: 'grey.800' },
};

const formatYesNo = (val) => {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return 'N/A';
};

const QuoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    data: quote,
    isLoading,
    isError,
    error,
  } = useGetQuoteByIdQuery(id);

  if (isLoading) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
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
    contact,
    service,
    package: pkg,
    nearest_location_name,
    distance_to_location,
    base_price,
    trip_surcharge,
    question_adjustments,
    total_price,
    status,
    question_answers,
    created_at,
  } = quote;

  return (
    <Box className="min-h-screen" sx={{ background: 'linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)', pb: 6 }}>
      {/* Header */}
      <Box
        sx={{
          bg: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          py: 3,
        }}
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="text"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
                sx={{ textTransform: 'none' }}
              >
                Back
              </Button>
              <Box>
                <Typography variant="h4" fontWeight="bold">
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
      <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }}>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Left column */}
          <Box display="flex" flexDirection="column" gap={6}>
            {/* Contact Card */}
            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  background: 'linear-gradient(90deg,#2563eb,#7c3aed)',
                  color: 'white',
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Person fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Contact Information
                </Typography>
              </Box>
              <CardContent sx={{ pt: 2 }}>
                <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
                  <Box flex="1" display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Person color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {contact?.first_name || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Full Name
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Phone color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {contact?.phone_number || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box flex="1" display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Mail color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {contact?.email || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      <Home color="action" />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600">
                          {contact?.address || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Address
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                {contact?.latitude && contact?.longitude && (
                  <Divider sx={{ my: 2 }} />
                )}
                {contact?.latitude && contact?.longitude && (
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <LocationOn color="action" />
                    <Box>
                      <Typography variant="body2">
                        {Number.parseFloat(contact.latitude).toFixed(6)}, {Number.parseFloat(contact.longitude).toFixed(6)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Coordinates
                      </Typography>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Service & Package Card */}
            <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                sx={{
                  background: 'linear-gradient(90deg,#059669,#10b981)',
                  color: 'white',
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <BusinessCenter fontSize="small" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Service & Package
                </Typography>
              </Box>
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="600">
                      {service?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {service?.description}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      background: '#ecfdf5',
                      borderRadius: 1,
                      p: 2,
                      border: '1px solid',
                      borderColor: 'success.light',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <LocalOffer fontSize="small" sx={{ color: '#047857' }} />
                      <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#065f46' }}>
                        {pkg?.name} - ${parseFloat(pkg?.base_price || 0).toFixed(2)}
                      </Typography>
                    </Box>

                    {pkg?.features && (
                      <Box>
                        <Typography variant="caption" fontWeight="600" gutterBottom>
                          Package Features:
                        </Typography>
                        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr' }} gap={1}>
                          {pkg.features.map((f, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                borderRadius: 1,
                                background: f.is_included ? 'rgba(16,185,129,0.08)' : 'rgba(107,114,128,0.04)',
                                border: '1px solid',
                                borderColor: f.is_included ? 'success.light' : 'grey.200',
                              }}
                            >
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: f.is_included ? '#10b981' : '#9ca3af',
                                }}
                              />
                              <Typography
                                variant="body2"
                                sx={{ color: f.is_included ? 'text.primary' : 'text.secondary' }}
                              >
                                {f.feature.name}
                              </Typography>
                              <Chip
                                label={f.is_included ? 'Included' : 'Excluded'}
                                size="small"
                                sx={{
                                  ml: 'auto',
                                  bgcolor: f.is_included ? 'success.light' : 'grey.100',
                                }}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Question Answers */}
            {Array.isArray(question_answers) && question_answers.length > 0 && (
              <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  sx={{
                    background: 'linear-gradient(90deg,#9333ea,#c084fc)',
                    color: 'white',
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <QuestionAnswer fontSize="small" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Question Answers
                  </Typography>
                </Box>
                <CardContent>
                  <Box display="flex" flexDirection="column" gap={3}>
                    {question_answers.map((qa) => {
                      const q = qa.question;
                      let answerDisplay = 'Not answered';
                      if (q.question_type === 'yes_no') {
                        answerDisplay = formatYesNo(qa.yes_no_answer);
                      } else if (qa.selected_option) {
                        const opt = q.options?.find((o) => o.id === qa.selected_option);
                        answerDisplay = opt ? opt.option_text : qa.selected_option;
                      }
                      return (
                        <Box
                          key={qa.id}
                          sx={{
                            background: 'rgba(243,244,246,0.8)',
                            borderRadius: 1,
                            p: 3,
                            border: '1px solid',
                            borderColor: 'grey.200',
                            position: 'relative',
                          }}
                        >
                          <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                            {q.question_text}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Answer:</strong> {answerDisplay}
                          </Typography>
                          {/* <Typography variant="caption" color="text.secondary">
                            Price Adjustment: ${parseFloat(qa.price_adjustment || 0).toFixed(2)}
                          </Typography> */}
                        </Box>
                      );
                    })}
                  </Box>
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
                  background: 'linear-gradient(90deg,#4f46e5,#6366f1)',
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
                      ${parseFloat(base_price || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">Trip Surcharge</Typography>
                    <Typography variant="subtitle2">
                      ${parseFloat(trip_surcharge || 0).toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography variant="body2">Question Adjustments</Typography>
                    <Typography variant="subtitle2">
                      ${parseFloat(question_adjustments || 0).toFixed(2)}
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
                      Total
                    </Typography>
                    <Typography variant="h6" color="primary">
                      ${parseFloat(total_price || 0).toFixed(2)}
                    </Typography>
                  </Box>

                  {nearest_location_name && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        borderRadius: 1,
                      }}
                    >
                      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                        <LocationOn fontSize="small" />
                        <Typography variant="subtitle2" fontWeight="600">
                          Nearest Location
                        </Typography>
                      </Box>
                      <Typography variant="body2">{nearest_location_name}</Typography>
                      {distance_to_location != null && (
                        <Typography variant="caption" color="text.secondary">
                          Distance: {distance_to_location}
                        </Typography>
                      )}
                    </Box>
                  )}

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
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;
