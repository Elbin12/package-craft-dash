import React, { useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { CheckCircle, LocalOffer } from '@mui/icons-material';
import { useGetServiceByIdQuery } from '../../../store/api/user/userServicesApi';

// Mock features data (you can replace this with real features if they come separately)
const mockFeatures = [
  { id: '1', name: 'Deep Cleaning', description: 'Thorough cleaning of all surfaces' },
  { id: '2', name: 'Eco-Friendly Products', description: 'Green cleaning supplies' },
  { id: '3', name: 'Premium Equipment', description: 'Professional grade tools' },
  { id: '4', name: 'Insurance Coverage', description: 'Fully insured service' },
  { id: '5', name: 'Satisfaction Guarantee', description: '100% satisfaction guaranteed' },
];

// PackageSelectionFormProps: { data, onUpdate }

export const PackageSelectionForm = ({ data, onUpdate }) => {
  if (!data.selectedService || !data.selectedService.id) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Choose Your Package
        </Typography>
        <Typography color="text.secondary">Please select a service first.</Typography>
      </Box>
    );
  }

  const {
    data: serviceDetail,
    isLoading,
    isError,
    error,
  } = useGetServiceByIdQuery(data.selectedService.id);

  console.log(serviceDetail, data, 'from package');
  

  // When the detailed service loads, merge its packages into bookingData.selectedService
  useEffect(() => {
    if (serviceDetail) {
      onUpdate({
        selectedService: {
          ...data.selectedService,
          // map API shape to your internal shape (e.g., nickname vs name)
          nickname: serviceDetail.name,
          description: serviceDetail.description,
          packages: (serviceDetail.packages || []).map((p) => ({
            id: p.id,
            name: p.name,
            basePrice: p.base_price,
            features: p.features || [],
          })),
          // if questions come from elsewhere, attach here; else keep existing
          questions: data.selectedService.questions || [],
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDetail]);

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
          Failed to load service details: {error?.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  // if after loading we still don't have packages, guard
  const packages = data.selectedService?.packages || [];

  const handlePackageSelect = (packageItem) => {
    onUpdate({
      selectedPackage: packageItem,
      questionAnswers: {}, // reset when package changes
    });
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
          const packageItem = packages.find((p) => p.id === e.target.value);
          if (packageItem) handlePackageSelect(packageItem);
        }}
      >
        <Box sx={{ display: 'grid', gap: 3 }}>
          {packages.map((packageItem) => {
            // determine included features from the API's features array
            const includedFeatures = (packageItem.features || [])
              .filter((f) => f.is_included)
              .map((f) => ({
                id: f.feature.id,
                name: f.feature.name,
                description: f.feature.description,
              }));

            return (
              <Card
                key={packageItem.id}
                sx={{
                  border: data.selectedPackage?.id === packageItem.id ? 2 : 1,
                  borderColor:
                    data.selectedPackage?.id === packageItem.id
                      ? 'primary.main'
                      : 'divider',
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
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={1}
                        >
                          <Typography variant="h6">{packageItem.name}</Typography>
                          <Chip
                            label={`$${packageItem.basePrice}`}
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          Base price: ${packageItem.basePrice} (additional charges may apply
                          based on your answers)
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
          {packages.length === 0 && (
            <Typography color="text.secondary">
              No packages available for this service.
            </Typography>
          )}
        </Box>
      </RadioGroup>
    </Box>
  );
};

export default PackageSelectionForm;