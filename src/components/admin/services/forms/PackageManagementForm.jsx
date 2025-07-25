import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Check,
  Close,
} from '@mui/icons-material';
import { useCreatePackageMutation } from '../../../../store/api/packagesApi';
import { useCreateFeatureMutation } from '../../../../store/api/featuresApi';
import { useCreatePackageFeatureMutation } from '../../../../store/api/packageFeaturesApi';

const PackageManagementForm = ({
  data,
  onUpdate,
}) => {
  const [packages, setPackages] = useState(data.packages || []);
  const [features, setFeatures] = useState(data.features || []);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', base_price: '' });
  const [newFeature, setNewFeature] = useState({ name: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const [createPackage] = useCreatePackageMutation();
  const [createFeature] = useCreateFeatureMutation();
  const [createPackageFeature] = useCreatePackageFeatureMutation();

  const validatePackage = () => {
    const newErrors = {};
    
    if (!newPackage.name || newPackage.name.trim().length < 3) {
      newErrors.name = 'Package name must be at least 3 characters';
    }
    
    if (!newPackage.base_price || isNaN(newPackage.base_price) || parseFloat(newPackage.base_price) <= 0) {
      newErrors.base_price = 'Base price must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFeature = () => {
    const newErrors = {};
    
    if (!newFeature.name || newFeature.name.trim().length < 3) {
      newErrors.feature_name = 'Feature name must be at least 3 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPackage = async () => {
    if (!validatePackage()) return;
    
    setIsLoading(true);
    try {
      const packagePayload = {
        service: data.id,
        name: newPackage.name.trim(),
        base_price: parseFloat(newPackage.base_price),
      };
      
      const result = await createPackage(packagePayload).unwrap();
      
      const packageToAdd = {
        ...result,
        features: [],
      };
      
      const updatedPackages = [...packages, packageToAdd];
      setPackages(updatedPackages);
      onUpdate({ packages: updatedPackages });
      setPackageDialogOpen(false);
      setNewPackage({ name: '', base_price: '' });
      setErrors({});
    } catch (error) {
      console.error('Failed to create package:', error);
      setErrors({ 
        general: error?.data?.message || error?.data?.detail || 'Failed to create package. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeature = async () => {
    if (!validateFeature()) return;
    
    setIsLoading(true);
    try {
      const featurePayload = {
        service: data.id,
        name: newFeature.name.trim(),
      };
      
      const result = await createFeature(featurePayload).unwrap();
      
      const updatedFeatures = [...features, result];
      setFeatures(updatedFeatures);
      onUpdate({ features: updatedFeatures });
      setFeatureDialogOpen(false);
      setNewFeature({ name: '' });
      setErrors({});
    } catch (error) {
      console.error('Failed to create feature:', error);
      setErrors({ 
        general: error?.data?.message || error?.data?.detail || 'Failed to create feature. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePackage = (id) => {
    const updatedPackages = packages.filter(pkg => pkg.id !== id);
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages });
  };

  const handleDeleteFeature = (id) => {
    const updatedFeatures = features.filter(feat => feat.id !== id);
    setFeatures(updatedFeatures);
    onUpdate({ features: updatedFeatures });
  };

  const handleFeatureToggle = async (packageId, featureId, isIncluded) => {
    try {
      const payload = {
        package: packageId,
        feature: featureId,
        is_included: isIncluded,
      };
      
      await createPackageFeature(payload).unwrap();
      
      // Update local state
      const updatedPackages = packages.map(pkg => {
        if (pkg.id === packageId) {
          const updatedFeatures = pkg.features || [];
          if (isIncluded) {
            if (!updatedFeatures.find(f => f.id === featureId)) {
              const feature = features.find(f => f.id === featureId);
              updatedFeatures.push(feature);
            }
          } else {
            const index = updatedFeatures.findIndex(f => f.id === featureId);
            if (index > -1) {
              updatedFeatures.splice(index, 1);
            }
          }
          return { ...pkg, features: updatedFeatures };
        }
        return pkg;
      });
      
      setPackages(updatedPackages);
      onUpdate({ packages: updatedPackages });
    } catch (error) {
      console.error('Failed to update package feature:', error);
    }
  };

  const isFeatureIncluded = (packageId, featureId) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.features?.some(f => f.id === featureId) || false;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Package & Feature Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create packages for your service and assign features to them.
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setPackageDialogOpen(true)}
          disabled={!data.id}
        >
          Add Package
        </Button>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setFeatureDialogOpen(true)}
          disabled={!data.id}
        >
          Add Feature
        </Button>
      </Box>

      {!data.id && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please save the service details first before adding packages and features.
        </Alert>
      )}

      {packages.length === 0 ? (
        <Typography color="text.secondary">Please add at least one package to continue.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'grey.50' }}>
                  <Typography variant="subtitle2" fontWeight="bold">
                    Features
                  </Typography>
                </TableCell>
                {packages.map((pkg) => (
                  <TableCell key={pkg.id} align="center" sx={{ bgcolor: 'grey.50' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {pkg.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${pkg.base_price}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeletePackage(pkg.id)}
                        sx={{ mt: 1 }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
                <TableCell sx={{ bgcolor: 'grey.50' }}>
                  <IconButton size="small" />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {features.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="body2">
                        {feature.name}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteFeature(feature.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={pkg.id} align="center">
                      <Checkbox
                        checked={isFeatureIncluded(pkg.id, feature.id)}
                        onChange={(e) => handleFeatureToggle(pkg.id, feature.id, e.target.checked)}
                      />
                    </TableCell>
                  ))}
                  <TableCell />
                </TableRow>
              ))}
              
              {features.length === 0 && (
                <TableRow>
                  <TableCell colSpan={packages.length + 2}>
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                      No features created yet. Add features to assign them to packages.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Package Dialog */}
      <Dialog open={packageDialogOpen} onClose={() => setPackageDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Package</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Package Name"
              fullWidth
              value={newPackage.name}
              onChange={(e) => {
                setNewPackage({ ...newPackage, name: e.target.value });
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              label="Base Price"
              type="number"
              fullWidth
              value={newPackage.base_price}
              onChange={(e) => {
                setNewPackage({ ...newPackage, base_price: e.target.value });
                if (errors.base_price) setErrors(prev => ({ ...prev, base_price: '' }));
              }}
              error={!!errors.base_price}
              helperText={errors.base_price}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setPackageDialogOpen(false);
            setErrors({});
            setNewPackage({ name: '', base_price: '' });
          }}>Cancel</Button>
          <Button 
            onClick={handleAddPackage} 
            variant="contained"
            disabled={!newPackage.name || !newPackage.base_price || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Add Package
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Feature Dialog */}
      <Dialog open={featureDialogOpen} onClose={() => setFeatureDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Feature Name"
              fullWidth
              value={newFeature.name}
              onChange={(e) => {
                setNewFeature({ ...newFeature, name: e.target.value });
                if (errors.feature_name) setErrors(prev => ({ ...prev, feature_name: '' }));
              }}
              error={!!errors.feature_name}
              helperText={errors.feature_name}
              placeholder="e.g., Screen Cleaning"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFeatureDialogOpen(false);
            setErrors({});
            setNewFeature({ name: '' });
          }}>Cancel</Button>
          <Button 
            onClick={handleAddFeature} 
            variant="contained"
            disabled={!newFeature.name || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Add Feature
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageManagementForm;