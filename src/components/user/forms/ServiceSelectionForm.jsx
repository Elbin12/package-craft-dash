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
} from '@mui/material';
import { BusinessCenter } from '@mui/icons-material';

// Mock data - in production this would come from your API
const mockServices = [
  {
    id: '1',
    nickname: 'Premium House Cleaning',
    description: 'Complete house cleaning service with premium supplies and professional team',
    packages: [
      { id: '1', name: 'Basic', basePrice: 100 },
      { id: '2', name: 'Premium', basePrice: 150 }
    ],
    questions: [
      { id: '1', text: 'Do you have pets?', type: 'yes_no' },
      { id: '2', text: 'How many bedrooms?', type: 'options', options: [
        { id: '1', text: '1-2 bedrooms' },
        { id: '2', text: '3-4 bedrooms' },
        { id: '3', text: '5+ bedrooms' }
      ]}
    ],
  },
  {
    id: '2',
    nickname: 'Office Deep Clean',
    description: 'Professional office cleaning with sanitization and detailed care',
    packages: [
      { id: '3', name: 'Standard', basePrice: 200 },
      { id: '4', name: 'Deep Clean', basePrice: 300 }
    ],
    questions: [
      { id: '3', text: 'After hours cleaning required?', type: 'yes_no' },
      { id: '4', text: 'Office size', type: 'options', options: [
        { id: '4', text: 'Small (1-10 desks)' },
        { id: '5', text: 'Medium (11-25 desks)' },
        { id: '6', text: 'Large (25+ desks)' }
      ]}
    ],
  },
  {
    id: '3',
    nickname: 'Carpet Cleaning',
    description: 'Professional carpet and upholstery cleaning service',
    packages: [
      { id: '5', name: 'Basic Vacuum', basePrice: 80 },
      { id: '6', name: 'Deep Steam', basePrice: 120 }
    ],
    questions: [
      { id: '5', text: 'Heavy stain treatment needed?', type: 'yes_no' },
      { id: '6', text: 'Carpet area', type: 'options', options: [
        { id: '7', text: 'Small room (< 200 sq ft)' },
        { id: '8', text: 'Medium room (200-500 sq ft)' },
        { id: '9', text: 'Large area (500+ sq ft)' }
      ]}
    ],
  }
];

// ServiceSelectionFormProps: { data, onUpdate }

export const ServiceSelectionForm = ({
  data,
  onUpdate,
}) => {
  const handleServiceSelect = (service) => {
    onUpdate({
      selectedService: service,
      selectedPackage: null, // Reset package selection
      questionAnswers: {}, // Reset answers
    });
  };

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
          const service = mockServices.find(s => s.id === e.target.value);
          if (service) handleServiceSelect(service);
        }}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          {mockServices.map((service) => (
            <Card 
              key={service.id}
              sx={{ 
                border: data.selectedService?.id === service.id ? 2 : 1,
                borderColor: data.selectedService?.id === service.id ? 'primary.main' : 'divider',
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
                        {service.nickname}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {service.description}
                      </Typography>
                      
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip 
                          label={`${service.packages.length} packages`} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                        <Chip 
                          label={`${service.questions.length} questions`} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip 
                          label={`From $${Math.min(...service.packages.map(p => p.basePrice))}`} 
                          size="small" 
                          color="success"
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