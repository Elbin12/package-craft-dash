import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
} from '@mui/material';
import UserInfoForm from './forms/UserInfoForm';
import ServiceSelectionForm from './forms/ServiceSelectionForm';
import PackageSelectionForm from './forms/PackageSelectionForm';
import QuestionsForm from './forms/QuestionsForm';
import CheckoutSummary from './forms/CheckoutSummary';

const steps = [
  'Your Information',
  'Select Service',
  'Choose Package',
  'Answer Questions',
  'Review & Submit'
];

// BookingData structure:
// {
//   userInfo: { firstName, phone, email, address },
//   selectedService: object,
//   selectedPackage: object,
//   questionAnswers: object,
//   pricing: { basePrice, tripSurcharge, questionAdjustments, totalPrice }
// }

export const BookingWizard = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [bookingData, setBookingData] = useState({
    userInfo: {
      firstName: '',
      phone: '',
      email: '',
      address: '',
    },
    selectedService: null,
    selectedPackage: null,
    questionAnswers: {},
    pricing: {
      basePrice: 0,
      tripSurcharge: 0,
      questionAdjustments: 0,
      totalPrice: 0,
    },
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = () => {
    console.log('Submitting booking:', bookingData);
    // Here you would submit to your API
    alert('Booking submitted successfully!');
    handleReset();
  };

  const handleReset = () => {
    setActiveStep(0);
    setBookingData({
      userInfo: {
        firstName: '',
        phone: '',
        email: '',
        address: '',
      },
      selectedService: null,
      selectedPackage: null,
      questionAnswers: {},
      pricing: {
        basePrice: 0,
        tripSurcharge: 0,
        questionAdjustments: 0,
        totalPrice: 0,
      },
    });
  };

  const updateBookingData = (stepData) => {
    setBookingData((prev) => ({ ...prev, ...stepData }));
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return Object.values(bookingData.userInfo).every(value => value.trim() !== '');
      case 1:
        return bookingData.selectedService !== null;
      case 2:
        return bookingData.selectedPackage !== null;
      case 3:
        return bookingData.selectedService?.questions?.every((q) => 
          bookingData.questionAnswers[q.id] !== undefined
        ) ?? true;
      default:
        return false;
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <UserInfoForm
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 1:
        return (
          <ServiceSelectionForm
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 2:
        return (
          <PackageSelectionForm
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 3:
        return (
          <QuestionsForm
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      case 4:
        return (
          <CheckoutSummary
            data={bookingData}
            onUpdate={updateBookingData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Book Your Service
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label, index) => (
              <Step key={label} completed={index < activeStep || isStepComplete(index)}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ minHeight: '400px' }}>
            {getStepContent(activeStep)}
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Button
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button 
              onClick={handleNext} 
              variant="contained"
              disabled={!isStepComplete(activeStep)}
            >
              {activeStep === steps.length - 1 ? 'Submit Booking' : 'Next'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};