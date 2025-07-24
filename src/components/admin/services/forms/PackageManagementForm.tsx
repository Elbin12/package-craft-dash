import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
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
  const [featureDialogOpen, setFeatureDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [newPackage, setNewPackage] = useState({ name: '', basePrice: 0, order: 1, features: [] });
  const [newFeature, setNewFeature] = useState({ name: '', description: '' });

  const handleAddPackage = () => {
    const packageToAdd = {
      ...newPackage,
      id: Date.now().toString(),
    };
    const updatedPackages = [...packages, packageToAdd];
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features });
    setPackageDialogOpen(false);
    setNewPackage({ name: '', basePrice: 0, order: 1, features: [] });
  };

  const handleDeletePackage = (id: string) => {
    const updatedPackages = packages.filter(pkg => pkg.id !== id);
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages, features });
  };

  const handleAddFeature = () => {
    const featureToAdd = {
      ...newFeature,
      id: Date.now().toString(),
    };
    const updatedFeatures = [...features, featureToAdd];
    setFeatures(updatedFeatures);
    onUpdate({ packages, features: updatedFeatures });
    setFeatureDialogOpen(false);
    setNewFeature({ name: '', description: '' });
  };

  const handleDeleteFeature = (id: string) => {
    const updatedFeatures = features.filter(feature => feature.id !== id);
    // Remove feature from all packages
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Package & Feature Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create packages for your service and assign features to them.
      </Typography>

      {/* Features Section */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Features</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setFeatureDialogOpen(true)}
          >
            Add Feature
          </Button>
        </Box>

        {features.length === 0 ? (
          <Typography color="text.secondary">No features created yet.</Typography>
        ) : (
          <List>
            {features.map((feature) => (
              <ListItem key={feature.id} divider>
                <ListItemText
                  primary={feature.name}
                  secondary={feature.description}
                />
                <ListItemSecondaryAction>
                  <IconButton onClick={() => handleDeleteFeature(feature.id)}>
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {/* Packages Section */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Packages</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setPackageDialogOpen(true)}
          >
            Add Package
          </Button>
        </Box>

        {packages.length === 0 ? (
          <Typography color="text.secondary">No packages created yet.</Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2 }}>
            {packages.map((pkg) => (
              <Card key={pkg.id}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box>
                      <Typography variant="h6">{pkg.name}</Typography>
                      <Typography color="text.secondary" gutterBottom>
                        Base Price: ${pkg.basePrice} | Order: {pkg.order}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {pkg.features.map((featureId) => {
                          const feature = features.find(f => f.id === featureId);
                          return feature ? (
                            <Chip key={featureId} label={feature.name} size="small" />
                          ) : null;
                        })}
                      </Box>
                    </Box>
                    <IconButton onClick={() => handleDeletePackage(pkg.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  {features.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle2" gutterBottom>
                        Assign Features:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {features.map((feature) => (
                          <Box key={feature.id} display="flex" alignItems="center">
                            <Checkbox
                              checked={pkg.features.includes(feature.id)}
                              onChange={() => handleFeatureToggle(pkg.id, feature.id)}
                              size="small"
                            />
                            <Typography variant="body2">{feature.name}</Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

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

      {/* Add Feature Dialog */}
      <Dialog open={featureDialogOpen} onClose={() => setFeatureDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Feature Name"
              fullWidth
              value={newFeature.name}
              onChange={(e) => setNewFeature({ ...newFeature, name: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newFeature.description}
              onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeatureDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddFeature} variant="contained">Add Feature</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageManagementForm;