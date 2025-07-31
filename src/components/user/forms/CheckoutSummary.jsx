import React, { useEffect } from 'react';
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
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Person,
  BusinessCenter,
  LocalOffer,
  QuestionAnswer,
  Receipt,
  LocationOn,
} from '@mui/icons-material';
import { useCalculatePriceMutation } from '../../../store/api/user/priceApi';

export const CheckoutSummary = ({ data, onUpdate }) => {
  const [calculatePrice, { data: priceResp, isLoading, isError, error }] =
    useCalculatePriceMutation();

  useEffect(() => {
    const contactId = data.userInfo?.contactId;
    const serviceId = data.selectedService?.id;
    const packageId = data.selectedPackage?.id;

    if (!contactId || !serviceId || !packageId) return;

    const questions = data.selectedService?.questions || [];
    const incomplete = questions.some((q) => data.questionAnswers[q.id] === undefined);
    if (questions.length > 0 && incomplete) return;

    const answersPayload = questions.map((q) => {
      const ans = data.questionAnswers[q.id];
      if (q.type === 'yes_no') {
        return {
          question_id: q.id,
          yes_no_answer: ans === 'yes',
        };
      } else {
        return {
          question_id: q.id,
          selected_option_id: ans,
        };
      }
    });

    const payload = {
      contact_id: contactId,
      service_id: serviceId,
      package_id: packageId,
      answers: answersPayload,
    };

    calculatePrice(payload)
      .unwrap()
      .then((resp) => {
        const basePrice = parseFloat(resp.base_price);
        const tripSurcharge = parseFloat(resp.trip_surcharge);
        const questionAdjustments = parseFloat(resp.question_adjustments);
        const totalPrice = parseFloat(resp.total_price);

        onUpdate({
          pricing: {
            basePrice,
            tripSurcharge,
            questionAdjustments,
            totalPrice,
          },
          nearestLocation: resp.nearest_location,
          distanceToLocation: resp.distance_to_location,
        });
      })
      .catch((e) => {
        console.error('Price calculation failed', e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.selectedPackage, data.selectedService, data.userInfo?.contactId, data.questionAnswers]);

  if (!data.selectedService || !data.selectedPackage) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        <Typography color="text.secondary">Please complete all previous steps first.</Typography>
      </Box>
    );
  }

  const pricing = data.pricing || {};
  const hasQuestions = (data.selectedService.questions || []).length > 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Booking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all details before submitting your booking.
      </Typography>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '2fr 1fr' }} gap={3}>
        {/* Left */}
        <Box>
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person color="primary" />
                <Typography variant="h6">Contact Information</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={data.userInfo.firstName} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Phone" secondary={data.userInfo.phone} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={data.userInfo.email} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Address" secondary={data.userInfo.address} />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BusinessCenter color="primary" />
                <Typography variant="h6">Service Details</Typography>
              </Box>
              <Typography variant="subtitle1">{data.selectedService.nickname}</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {data.selectedService.description}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <LocalOffer color="secondary" />
                <Typography variant="subtitle1">Package: {data.selectedPackage.name}</Typography>
                <Chip label={`$${data.selectedPackage.basePrice}`} size="small" color="primary" />
              </Box>
            </CardContent>
          </Card>

          {hasQuestions && (
            <Card sx={{ mb: 3, borderRadius: 2 }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <QuestionAnswer color="primary" />
                  <Typography variant="h6">Your Answers</Typography>
                </Box>
                <List dense>
                  {data.selectedService.questions.map((question) => {
                    const answer = data.questionAnswers[question.id];
                    let displayAnswer = 'Not answered';
                    if (answer !== undefined) {
                      if (question.type === 'yes_no') {
                        displayAnswer = answer === 'yes' ? 'Yes' : 'No';
                      } else {
                        const option = question.options?.find((opt) => opt.id === answer);
                        displayAnswer = option?.text || 'Unknown option';
                      }
                    }
                    return (
                      <ListItem key={question.id}>
                        <ListItemText primary={question.text} secondary={displayAnswer} />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right summary */}
        <Box>
          <Paper sx={{ p: 3, position: 'sticky', top: 20, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <Receipt color="primary" />
              <Typography variant="h6">Pricing Summary</Typography>
            </Box>

            {isLoading && (
              <Box display="flex" justifyContent="center" mb={2}>
                <CircularProgress size={24} />
              </Box>
            )}

            {isError && (
              <Typography color="error" sx={{ mb: 2 }}>
                Failed to calculate price: {error?.message || 'Unknown'}
              </Typography>
            )}

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Base Price ({data.selectedPackage.name})</Typography>
                <Typography>
                  ${pricing?.basePrice != null ? pricing.basePrice.toFixed(2) : '0.00'}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Trip Surcharge</Typography>
                <Typography>
                  ${pricing?.tripSurcharge != null ? pricing.tripSurcharge.toFixed(2) : '0.00'}
                </Typography>
              </Box>

              {(pricing?.questionAdjustments || 0) !== 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Question-based Adjustments</Typography>
                  <Typography>
                    {pricing.questionAdjustments > 0 ? '+' : ''}
                    ${pricing.questionAdjustments.toFixed(2)}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total Price</Typography>
                <Typography variant="h6" color="primary">
                  ${pricing?.totalPrice != null ? pricing.totalPrice.toFixed(2) : '0.00'}
                </Typography>
              </Box>

              {data.nearestLocation && (
                <Box mt={2}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <LocationOn color="action" />
                    <Typography variant="body2">
                      Nearest Location: {data.nearestLocation}
                    </Typography>
                  </Box>
                  {data.distanceToLocation != null && (
                    <Typography variant="body2" color="text.secondary">
                      Distance: {data.distanceToLocation}
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" align="center">
              Final price will be confirmed after service completion
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default CheckoutSummary;
