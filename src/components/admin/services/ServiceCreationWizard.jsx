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
import { useCreateServiceMutation } from '../../../store/api/servicesApi';

const steps = [
  'Service Details',
  'Package Management',
  'Question Builder', 
  'Price Setup'
];

// ServiceCreationWizardProps: { open, onClose, onComplete, editData }

export const ServiceCreationWizard = ({
  open,
  onClose,
  onComplete,
  editData,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    packages: [],
    questions: [],
    pricing: {},
  }); 
  
  const [savedSteps, setSavedSteps] = useState({
    0: false,
    1: false,
    2: false,
    3: false,
  });

  const [createService, { data, isLoading, isSuccess, isError, error }] = useCreateServiceMutation();
  // Update service data when editData changes
  React.useEffect(() => {
    if (editData) {
      setServiceData(editData);
    } else {
      setServiceData({
        name: '',
        description: '',
        packages: [],
        questions: [],
        pricing: {},
      });
    }
  }, [editData, open]);

  const handleNext = async () => {
      try {
        switch (activeStep) {
          case 0:
            if (!savedSteps[0]) {
              const result = await createService(serviceData).unwrap();
              setServiceData((prev) => ({ ...prev, id: result.id }));
              setSavedSteps((prev) => ({ ...prev, 0: true }));
            }
            break;

          case 1:
            if (!savedSteps[1]) {
              await createPackagesAPI(serviceData.id, serviceData.packages);
              setSavedSteps((prev) => ({ ...prev, 1: true }));
            }
            break;

          case 2:
            if (!savedSteps[2]) {
              await createQuestionsAPI(serviceData.id, serviceData.questions);
              setSavedSteps((prev) => ({ ...prev, 2: true }));
            }
            break;

          case 3:
            if (!savedSteps[3]) {
              await createPricingAPI(serviceData.id, serviceData.pricing);
              setSavedSteps((prev) => ({ ...prev, 3: true }));
            }
            onComplete(serviceData); // Notify parent
            handleReset();
            onClose(); // Close wizard
            return;

          default:
            break;
        }

        setActiveStep((prev) => prev + 1); // Move to next step after success
      } catch (error) {
        console.error("Step failed:", error);
        // Optionally show error to user
      }
    };


  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setServiceData({
      name: '',
      description: '',
      packages: [],
      questions: [],
      pricing: {},
    });
  };

  const updateServiceData = (stepData) => {
    setServiceData((prev) => ({ ...prev, ...stepData }));
  };

  const getStepContent = (step) => {
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