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
} from '@mui/material';
import {
  Add,
  Delete,
  Check,
  Close,
} from '@mui/icons-material';

interface Package {
  id: string;
  name: string;
  basePrice: number;
  order: number;
  features: string[];
}

interface Feature {
  id: string;
  name: string;
  description: string;
}

interface PackageManagementFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const PackageManagementForm: React.FC<PackageManagementFormProps> = ({
  data,
  onUpdate,
}) => {
  const [packages, setPackages] = useState<Package[]>(data.packages || []);
  const [features, setFeatures] = useState<Feature[]>(data.features || []);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', basePrice: 0, order: 1 });
  const [newFeatureName, setNewFeatureName] = useState('');

  const handleAddPackage = () => {
    const packageToAdd = {
      ...newPackage,
      id: Date.now().toString(),
      features: [],
    };
    const updatedPackages = [...packages, packageToAdd];
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features });
    setPackageDialogOpen(false);
    setNewPackage({ name: '', basePrice: 0, order: packages.length + 1 });
  };

  const handleDeletePackage = (id: string) => {
    const updatedPackages = packages.filter(pkg => pkg.id !== id);
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features });
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    
    const featureToAdd = {
      id: Date.now().toString(),
      name: newFeatureName,
      description: '',
    };
    const updatedFeatures = [...features, featureToAdd];
    setFeatures(updatedFeatures);
    onUpdate({ packages, features: updatedFeatures });
    setNewFeatureName('');
  };

  const handleDeleteFeature = (id: string) => {
    const updatedFeatures = features.filter(feature => feature.id !== id);
    const updatedPackages = packages.map(pkg => ({
      ...pkg,
      features: pkg.features.filter(featureId => featureId !== id)
    }));
    setFeatures(updatedFeatures);
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features: updatedFeatures });
  };

  const handleFeatureToggle = (packageId: string, featureId: string) => {
    const updatedPackages = packages.map(pkg => {
      if (pkg.id === packageId) {
        const hasFeature = pkg.features.includes(featureId);
        return {
          ...pkg,
          features: hasFeature 
            ? pkg.features.filter(id => id !== featureId)
            : [...pkg.features, featureId]
        };
      }
      return pkg;
    });
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features });
  };

  const isFeatureIncluded = (packageId: string, featureId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    return pkg?.features.includes(featureId) || false;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Package & Feature Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create packages for your service and assign features to them.
      </Typography>

      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setPackageDialogOpen(true)}
        >
          Add Package
        </Button>
      </Box>

      {packages.length === 0 ? (
        <Typography color="text.secondary">Please add at least one package to continue.</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'grey.50' }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton size="small" />
                  </Box>
                </TableCell>
                {packages.map((pkg) => (
                  <TableCell key={pkg.id} align="center" sx={{ bgcolor: 'grey.50' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {pkg.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Target Hourly
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ${pkg.basePrice}
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
                    <Box display="flex" alignItems="center" gap={1}>
                      <IconButton size="small" />
                      <Typography>{feature.name}</Typography>
                    </Box>
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={pkg.id} align="center">
                      <IconButton
                        onClick={() => handleFeatureToggle(pkg.id, feature.id)}
                        color={isFeatureIncluded(pkg.id, feature.id) ? "success" : "default"}
                      >
                        {isFeatureIncluded(pkg.id, feature.id) ? <Check /> : <Close />}
                      </IconButton>
                    </TableCell>
                  ))}
                  <TableCell>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteFeature(feature.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={packages.length + 2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={handleAddFeature}
                      disabled={!newFeatureName.trim()}
                    >
                      Add Line
                    </Button>
                    <TextField
                      size="small"
                      placeholder="Feature name"
                      value={newFeatureName}
                      onChange={(e) => setNewFeatureName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddFeature();
                        }
                      }}
                    />
                  </Box>
                </TableCell>
              </TableRow>
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
              onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
            />
            <TextField
              label="Base Price"
              type="number"
              fullWidth
              value={newPackage.basePrice}
              onChange={(e) => setNewPackage({ ...newPackage, basePrice: Number(e.target.value) })}
            />
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={newPackage.order}
              onChange={(e) => setNewPackage({ ...newPackage, order: Number(e.target.value) })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPackageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddPackage} variant="contained">Add Package</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageManagementForm;