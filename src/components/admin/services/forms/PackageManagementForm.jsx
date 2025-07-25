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

// Package structure: { id, name, basePrice, order, features }
// Feature structure: { id, name, description }
// PackageManagementFormProps: { data, onUpdate }

const PackageManagementForm = ({
  data,
  onUpdate,
}) => {
  const [packages, setPackages] = useState(data.packages || []);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [newPackage, setNewPackage] = useState({ name: '', base_price: '', features: [] });
  const [errors, setErrors] = useState({});

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

  const handleAddPackage = () => {
    if (!validatePackage()) return;
    
    const packageToAdd = {
      ...newPackage,
      base_price: parseFloat(newPackage.base_price),
      id: Date.now().toString(),
      features: newPackage.features || [],
    };
    const updatedPackages = [...packages, packageToAdd];
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages });
    setPackageDialogOpen(false);
    setNewPackage({ name: '', base_price: '', features: [] });
    setErrors({});
  };

  const handleDeletePackage = (id) => {
    const updatedPackages = packages.filter(pkg => pkg.id !== id);
    setPackages(updatedPackages);
    onUpdate({ packages: updatedPackages });
  };

  // Simplified feature management - features are part of packages now

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
                        Base Price
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
              <TableRow>
                <TableCell colSpan={packages.length + 2}>
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                    Features will be managed in the next step of the wizard.
                  </Typography>
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
            setNewPackage({ name: '', base_price: '', features: [] });
          }}>Cancel</Button>
          <Button 
            onClick={handleAddPackage} 
            variant="contained"
            disabled={!newPackage.name || !newPackage.base_price}
          >
            Add Package
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PackageManagementForm;