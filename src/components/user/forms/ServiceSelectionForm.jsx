// ServiceSelectionForm.jsx
import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Radio,
  FormControlLabel,
  RadioGroup,
  CircularProgress,
} from '@mui/material';
import { BusinessCenter } from '@mui/icons-material';
import { useGetServicesQuery } from '../../../store/api/user/userServicesApi';

// ServiceSelectionFormProps: { data, onUpdate }

export const ServiceSelectionForm = ({ data, onUpdate }) => {
  const {
    data: services = [],
    isLoading,
    isError,
    error,
  } = useGetServicesQuery();

  const handleServiceSelect = (service) => {
    // since list endpoint doesn't include packages/questions, we keep those null/empty
    onUpdate({
      selectedService: {
        id: service.id,
        nickname: service.name,
        description: service.description,
        packages: [], // you can lazy-load or enrich later
        questions: [],
      },
      selectedPackage: null,
      questionAnswers: {},
    });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography color="error">
          Failed to load services: {error?.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Your Service
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the service you need from our available options.
      </Typography>

      <RadioGroup
        value={data.selectedService?.id || ''}
        onChange={(e) => {
          const svc = services.find((s) => s.id === e.target.value);
          if (svc) handleServiceSelect(svc);
        }}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          {services.map((service) => (
            <Card
              key={service.id}
              sx={{
                border:
                  data.selectedService?.id === service.id ? 2 : 1,
                borderColor:
                  data.selectedService?.id === service.id
                    ? 'primary.main'
                    : 'divider',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  boxShadow: 2,
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <CardActionArea onClick={() => handleServiceSelect(service)}>
                <CardContent>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <FormControlLabel
                      value={service.id}
                      control={<Radio />}
                      label=""
                      sx={{ m: 0 }}
                    />

                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        background: 'hsl(var(--primary) / 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <BusinessCenter sx={{ color: 'hsl(var(--primary))' }} />
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {service.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {service.description}
                      </Typography>

                      <Box display="flex" gap={1} flexWrap="wrap">
                        {/* placeholder chips; adapt when you have real packages/questions */}
                        <Chip
                          label="Packages unknown"
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label="Questions unknown"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </RadioGroup>
    </Box>
  );
};

export default ServiceSelectionForm;
