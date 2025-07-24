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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle, LocalOffer } from '@mui/icons-material';

// Mock features data
const mockFeatures = [
  { id: '1', name: 'Deep Cleaning', description: 'Thorough cleaning of all surfaces' },
  { id: '2', name: 'Eco-Friendly Products', description: 'Green cleaning supplies' },
  { id: '3', name: 'Premium Equipment', description: 'Professional grade tools' },
  { id: '4', name: 'Insurance Coverage', description: 'Fully insured service' },
  { id: '5', name: 'Satisfaction Guarantee', description: '100% satisfaction guaranteed' },
];

// PackageSelectionFormProps: { data, onUpdate }

export const PackageSelectionForm = ({
  data,
  onUpdate,
}) => {
  if (!data.selectedService) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Choose Your Package
        </Typography>
        <Typography color="text.secondary">
          Please select a service first.
        </Typography>
      </Box>
    );
  }

  const handlePackageSelect = (packageItem) => {
    onUpdate({
      selectedPackage: packageItem,
      questionAnswers: {}, // Reset answers when package changes
    });
  };

  const getPackageFeatures = (packageId) => {
    // Mock feature assignment based on package
    if (packageId === '1') return ['1', '4']; // Basic package
    if (packageId === '2') return ['1', '2', '3', '4', '5']; // Premium package
    if (packageId === '3') return ['1', '3', '4']; // Standard office
    if (packageId === '4') return ['1', '2', '3', '4', '5']; // Deep office clean
    if (packageId === '5') return ['1', '4']; // Basic carpet
    if (packageId === '6') return ['1', '2', '3', '4', '5']; // Deep carpet
    return [];
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Your Package
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Select a package for <strong>{data.selectedService.nickname}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Each package includes different features and pricing options.
      </Typography>

      <RadioGroup
        value={data.selectedPackage?.id || ''}
        onChange={(e) => {
          const packageItem = data.selectedService.packages.find((p) => p.id === e.target.value);
          if (packageItem) handlePackageSelect(packageItem);
        }}
      >
        <Box sx={{ display: 'grid', gap: 3 }}>
          {data.selectedService.packages.map((packageItem) => {
            const packageFeatures = getPackageFeatures(packageItem.id);
            const includedFeatures = mockFeatures.filter(f => packageFeatures.includes(f.id));
            
            return (
              <Card 
                key={packageItem.id}
                sx={{ 
                  border: data.selectedPackage?.id === packageItem.id ? 2 : 1,
                  borderColor: data.selectedPackage?.id === packageItem.id ? 'primary.main' : 'divider',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 2,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardActionArea onClick={() => handlePackageSelect(packageItem)}>
                  <CardContent>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <FormControlLabel
                        value={packageItem.id}
                        control={<Radio />}
                        label=""
                        sx={{ m: 0 }}
                      />
                      
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          background: 'hsl(var(--secondary) / 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LocalOffer sx={{ color: 'hsl(var(--secondary))' }} />
                      </Box>
                      
                      <Box sx={{ flex: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="h6">
                            {packageItem.name}
                          </Typography>
                          <Chip 
                            label={`$${packageItem.basePrice}`} 
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Base price: ${packageItem.basePrice} (additional charges may apply based on your answers)
                        </Typography>
                        
                        {includedFeatures.length > 0 && (
                          <Box>
                            <Typography variant="subtitle2" gutterBottom>
                              Included Features:
                            </Typography>
                            <List dense sx={{ p: 0 }}>
                              {includedFeatures.map((feature) => (
                                <ListItem key={feature.id} sx={{ px: 0, py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 32 }}>
                                    <CheckCircle color="success" sx={{ fontSize: 20 }} />
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={feature.name}
                                    secondary={feature.description}
                                    primaryTypographyProps={{ variant: 'body2' }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      </RadioGroup>
    </Box>
  );
};

export default PackageSelectionForm;