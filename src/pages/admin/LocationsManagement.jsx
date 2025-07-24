import React, { useState } from 'react';
// Temporarily comment out Redux to test React context
// import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
} from '@mui/icons-material';
// Temporarily comment out RTK Query to test context
// import { 
//   useGetLocationsQuery, 
//   useCreateLocationMutation, 
//   useUpdateLocationMutation, 
//   useDeleteLocationMutation 
// } from '../../store/api/locationsApi';
// import {
//   setDialogOpen,
//   setEditingLocation,
//   setFormData,
//   resetFormData,
// } from '../../store/slices/locationsSlice';

const LocationsManagement = () => {
  // Temporarily use local state instead of Redux
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    tripSurcharge: '',
  });

  // Temporarily use mock data instead of RTK Query
  const locations = [];
  const isLoading = false;
  const error = null;

  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        lat: location.lat.toString(),
        lng: location.lng.toString(),
        tripSurcharge: location.tripSurcharge.toString(),
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        lat: '',
        lng: '',
        tripSurcharge: '',
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      lat: '',
      lng: '',
      tripSurcharge: '',
    });
  };

  const handleSaveLocation = async () => {
    try {
      console.log('Save location:', formData);
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  };

  const handleDeleteLocation = async (id) => {
    try {
      console.log('Delete location:', id);
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography color="error">
          Error loading locations: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Locations Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage service locations and trip surcharges
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Location
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Location Name</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Coordinates</TableCell>
                  <TableCell>Trip Surcharge</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle2" fontWeight="bold">
                          {location.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {location.address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {typeof location.lat === 'number' ? location.lat.toFixed(4) : location.lat}, {typeof location.lng === 'number' ? location.lng.toFixed(4) : location.lng}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`$${typeof location.tripSurcharge === 'number' ? location.tripSurcharge.toFixed(2) : location.tripSurcharge}`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={location.status || 'active'} 
                        size="small"
                        color={location.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{location.createdAt}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleOpenDialog(location)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Location Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Location Name"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.lat}
                onChange={(e) => handleFormChange('lat', e.target.value)}
                inputProps={{ step: 'any' }}
              />
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.lng}
                onChange={(e) => handleFormChange('lng', e.target.value)}
                inputProps={{ step: 'any' }}
              />
            </Box>
            <TextField
              fullWidth
              label="Trip Surcharge ($)"
              type="number"
              value={formData.tripSurcharge}
              onChange={(e) => handleFormChange('tripSurcharge', e.target.value)}
              inputProps={{ step: '0.01', min: 0 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancel
          </Button>
          <Button onClick={handleSaveLocation} variant="contained">
            {editingLocation ? 'Update' : 'Add'} Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationsManagement;