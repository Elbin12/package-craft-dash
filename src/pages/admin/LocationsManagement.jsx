import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
// Temporarily removed RTK Query imports
import { 
  useGetLocationsQuery, 
  useCreateLocationMutation, 
  useUpdateLocationMutation, 
  useDeleteLocationMutation, 
  locationsApi
} from '../../store/api/locationsApi';
import {
  setDialogOpen,
  setEditingLocation,
  setFormData,
  resetFormData,
  setLocations,
} from '../../store/slices/locationsSlice';

const LocationsManagement = () => {
  const dispatch = useDispatch();
  const { 
    dialogOpen, 
    editingLocation, 
    formData 
  } = useSelector((state) => state.locations);

  // Temporarily disable RTK Query to test basic Redux
  const { data: locations = [], isLoading, error } = useGetLocationsQuery();
  const [createLocation] = useCreateLocationMutation();
  const [updateLocation] = useUpdateLocationMutation();
  const [deleteLocation] = useDeleteLocationMutation();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [locationToDelete, setLocationToDelete] = React.useState(null);

  const [formErrors, setFormErrors] = React.useState({});

  const handleOpenDialog = (location = null) => {
    if (location) {
      dispatch(setEditingLocation(location));
      dispatch(setFormData({
        name: location.name,
        address: location.address,
        latitude: location.latitude.toString(),
        longitude: location.longitude.toString(),
        trip_surcharge: location.trip_surcharge.toString(),
      }));
    } else {
      dispatch(setEditingLocation(null));
      dispatch(resetFormData());
    }
    dispatch(setDialogOpen(true));
  };

  const handleCloseDialog = () => {
    dispatch(setDialogOpen(false));
    dispatch(setEditingLocation(null));
    dispatch(resetFormData());
  };

  const handleSaveLocation = async () => {
    try {
      setFormErrors({}); // Clear previous errors

      const locationData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        trip_surcharge: parseFloat(formData.trip_surcharge),
      };

      if (editingLocation) {
        const updatedLocation = await updateLocation({ id: editingLocation.id, ...locationData }).unwrap();
        dispatch(
          locationsApi.util.updateQueryData('getLocations', undefined, (draft) => {
            const index = draft.findIndex((loc) => loc.id === updatedLocation.id);
            if (index !== -1) {
              draft[index] = updatedLocation;
            }
          })
        );
      } else {
        await createLocation(locationData).unwrap();
      }

      handleCloseDialog();
    } catch (error) {
      if (error?.status === 400 && error?.data) {
        setFormErrors(error.data);
      } else {
        console.error('Failed to save location:', error);
      }
    }
  };


  const confirmDeleteLocation = async () => {
    if (!locationToDelete) return;

    try {
      await deleteLocation(locationToDelete.id).unwrap();
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error) {
      console.error('Failed to delete location:', error);
    }
  };


  const handleFormChange = (field, value) => {
    dispatch(setFormData({ [field]: value }));
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
                        {typeof location?.latitude === 'number' ? location?.latitude.toFixed(4) : location?.latitude}, {typeof location?.longitude === 'number' ? location?.longitude.toFixed(4) : location?.longitude}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`$${typeof location?.trip_surcharge === 'number' ? location?.trip_surcharge.toFixed(2) : location?.trip_surcharge}`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={location?.status || 'active'} 
                        size="small"
                        color={location?.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{new Date(location?.created_at).toLocaleDateString()}</TableCell>
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
                        onClick={() => {
                          setLocationToDelete(location);
                          setDeleteDialogOpen(true);
                        }}
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

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{' '}
            <strong>{locationToDelete?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteLocation}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>


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
              error={Boolean(formErrors.name)}
              helperText={formErrors.name?.[0]}
            />
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => handleFormChange('address', e.target.value)}
              multiline
              rows={2}
              error={Boolean(formErrors.address)}
              helperText={formErrors.address?.[0]}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) => handleFormChange('latitude', e.target.value)}
                inputProps={{ step: 'any' }}
                error={Boolean(formErrors.latitude)}
                helperText={formErrors.latitude?.[0]}
              />
              <TextField
                fullWidth
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) => handleFormChange('longitude', e.target.value)}
                inputProps={{ step: 'any' }}
                error={Boolean(formErrors.longitude)}
                helperText={formErrors.longitude?.[0]}
              />
            </Box>
            <TextField
              fullWidth
              label="Trip Surcharge ($)"
              type="number"
              value={formData.trip_surcharge}
              onChange={(e) => handleFormChange('trip_surcharge', e.target.value)}
              inputProps={{ step: '0.01', min: 0 }}
              error={Boolean(formErrors.trip_surcharge)}
              helperText={formErrors.trip_surcharge?.[0]}
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