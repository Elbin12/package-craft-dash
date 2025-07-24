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
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import ServiceDetailsForm from './forms/ServiceDetailsForm';
import PackageManagementForm from './forms/PackageManagementForm';
import QuestionBuilderForm from './forms/QuestionBuilderForm';
import PriceSetupForm from './forms/PriceSetupForm';

const steps = [
  'Service Details',
  'Package Management',
  'Question Builder', 
  'Price Setup'
];

interface ServiceCreationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (serviceData: any) => void;
  editData?: any;
}

export const ServiceCreationWizard: React.FC<ServiceCreationWizardProps> = ({
  open,
  onClose,
  onComplete,
  editData,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [serviceData, setServiceData] = useState(editData || {
    nickname: '',
    description: '',
    packages: [],
    questions: [],
    pricing: {},
  });

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      onComplete(serviceData);
      handleReset();
      onClose();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setServiceData({
      nickname: '',
      description: '',
      packages: [],
      questions: [],
      pricing: {},
    });
  };

  const updateServiceData = (stepData: any) => {
    setServiceData((prev) => ({ ...prev, ...stepData }));
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ServiceDetailsForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 1:
        return (
          <PackageManagementForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 2:
        return (
          <QuestionBuilderForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      case 3:
        return (
          <PriceSetupForm
            data={serviceData}
            onUpdate={updateServiceData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{editData ? 'Edit Service' : 'Create New Service'}</Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
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
              <Button onClick={handleNext} variant="contained">
                {activeStep === steps.length - 1 ? (editData ? 'Update Service' : 'Create Service') : 'Next'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};