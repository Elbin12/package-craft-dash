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
} from '@mui/material';
import { 
  Person, 
  BusinessCenter, 
  LocalOffer, 
  QuestionAnswer,
  LocationOn,
  Receipt 
} from '@mui/icons-material';

interface CheckoutSummaryProps {
  data: any;
  onUpdate: (data: any) => void;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({
  data,
  onUpdate,
}) => {
  // Calculate pricing based on answers
  useEffect(() => {
    if (!data.selectedPackage) return;

    const basePrice = data.selectedPackage.basePrice;
    const tripSurcharge = 15.00; // Mock trip surcharge
    let questionAdjustments = 0;

    // Mock pricing calculations based on answers
    Object.entries(data.questionAnswers).forEach(([questionId, answer]) => {
      const question = data.selectedService?.questions?.find((q: any) => q.id === questionId);
      if (!question) return;

      // Mock pricing logic
      if (questionId === '1' && answer === 'yes') { // Has pets
        questionAdjustments += basePrice * 0.15; // 15% upcharge
      }
      if (questionId === '2') { // Bedroom count
        if (answer === '2') questionAdjustments += 25; // 3-4 bedrooms
        if (answer === '3') questionAdjustments += 50; // 5+ bedrooms
      }
      if (questionId === '3' && answer === 'yes') { // After hours
        questionAdjustments += basePrice * 0.25; // 25% upcharge
      }
      if (questionId === '5' && answer === 'yes') { // Heavy stains
        questionAdjustments += 30; // Fixed price
      }
    });

    const totalPrice = basePrice + tripSurcharge + questionAdjustments;

    onUpdate({
      pricing: {
        basePrice,
        tripSurcharge,
        questionAdjustments,
        totalPrice,
      },
    });
  }, [data.selectedPackage, data.questionAnswers, onUpdate]);

  if (!data.selectedService || !data.selectedPackage) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Review & Submit
        </Typography>
        <Typography color="text.secondary">
          Please complete all previous steps first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Booking
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please review all details before submitting your booking.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Booking Details */}
        <Box>
          {/* User Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Person color="primary" />
                <Typography variant="h6">Contact Information</Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Name" 
                    secondary={data.userInfo.firstName} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Phone" 
                    secondary={data.userInfo.phone} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Email" 
                    secondary={data.userInfo.email} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Address" 
                    secondary={data.userInfo.address} 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <BusinessCenter color="primary" />
                <Typography variant="h6">Service Details</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{data.selectedService.nickname}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {data.selectedService.description}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <LocalOffer color="secondary" />
                <Typography variant="subtitle1">
                  Package: {data.selectedPackage.name}
                </Typography>
                <Chip label={`$${data.selectedPackage.basePrice}`} size="small" color="primary" />
              </Box>
            </CardContent>
          </Card>

          {/* Answers */}
          {data.selectedService.questions?.length > 0 && (
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <QuestionAnswer color="primary" />
                  <Typography variant="h6">Your Answers</Typography>
                </Box>
                <List dense>
                  {data.selectedService.questions.map((question: any) => {
                    const answer = data.questionAnswers[question.id];
                    let displayAnswer = 'Not answered';
                    
                    if (answer) {
                      if (question.type === 'yes_no') {
                        displayAnswer = answer === 'yes' ? 'Yes' : 'No';
                      } else {
                        const option = question.options?.find((opt: any) => opt.id === answer);
                        displayAnswer = option?.text || 'Unknown option';
                      }
                    }

                    return (
                      <ListItem key={question.id}>
                        <ListItemText 
                          primary={question.text}
                          secondary={displayAnswer}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Pricing Summary */}
        <Box>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Box display="flex" alignItems="center" gap={1} mb={3}>
              <Receipt color="primary" />
              <Typography variant="h6">Pricing Summary</Typography>
            </Box>

            <Box mb={3}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Base Price ({data.selectedPackage.name})</Typography>
                <Typography>${data.pricing?.basePrice?.toFixed(2) || '0.00'}</Typography>
              </Box>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Trip Surcharge</Typography>
                <Typography>${data.pricing?.tripSurcharge?.toFixed(2) || '0.00'}</Typography>
              </Box>
              
              {(data.pricing?.questionAdjustments || 0) !== 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography>Question-based Adjustments</Typography>
                  <Typography>
                    {data.pricing.questionAdjustments > 0 ? '+' : ''}
                    ${data.pricing.questionAdjustments.toFixed(2)}
                  </Typography>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6">Total Price</Typography>
                <Typography variant="h6" color="primary">
                  ${data.pricing?.totalPrice?.toFixed(2) || '0.00'}
                </Typography>
              </Box>
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