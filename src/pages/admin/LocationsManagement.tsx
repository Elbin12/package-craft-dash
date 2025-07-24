import React, { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
} from '@mui/icons-material';

interface Location {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  tripSurcharge: number;
  createdAt: string;
  status: 'active' | 'inactive';
}

const LocationsManagement: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([
    {
      id: '1',
      name: 'Downtown District',
      address: '123 Main St, Downtown, City',
      lat: 40.7128,
      lng: -74.0060,
      tripSurcharge: 15.00,
      createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      name: 'Suburban Area',
      address: '456 Oak Avenue, Suburbs, City',
      lat: 40.7589,
      lng: -73.9851,
      tripSurcharge: 25.00,
      createdAt: '2024-01-10',
      status: 'active'
    }
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: 0,
    lng: 0,
    tripSurcharge: 0,
  });

  const handleOpenDialog = (location?: Location) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        tripSurcharge: location.tripSurcharge,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        lat: 0,
        lng: 0,
        tripSurcharge: 0,
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
      lat: 0,
      lng: 0,
      tripSurcharge: 0,
    });
  };

  const handleSaveLocation = () => {
    if (editingLocation) {
      // Update existing location
      setLocations(locations.map(loc => 
        loc.id === editingLocation.id 
          ? { ...loc, ...formData }
          : loc
      ));
    } else {
      // Create new location
      const newLocation: Location = {
        id: Date.now().toString(),
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      setLocations([...locations, newLocation]);
    }
    handleCloseDialog();
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(location => location.id !== id));
  };

  const handleFormChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'lat' || field === 'lng' || field === 'tripSurcharge' 
      ? Number(event.target.value) 
      : event.target.value;
    setFormData({ ...formData, [field]: value });
  };

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
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOn color="primary" />
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
                        {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" color="primary">
                        ${location.tripSurcharge.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={location.status} 
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
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Location Name"
              fullWidth
              value={formData.name}
              onChange={handleFormChange('name')}
              placeholder="e.g., Downtown District"
            />
            
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={2}
              value={formData.address}
              onChange={handleFormChange('address')}
              placeholder="Full address with Google Places integration"
              helperText="In production, this would use Google Places Autocomplete"
            />
            
            <Box display="flex" gap={2}>
              <TextField
                label="Latitude"
                type="number"
                value={formData.lat}
                onChange={handleFormChange('lat')}
                fullWidth
                inputProps={{ step: 'any' }}
              />
              <TextField
                label="Longitude"
                type="number"
                value={formData.lng}
                onChange={handleFormChange('lng')}
                fullWidth
                inputProps={{ step: 'any' }}
              />
            </Box>
            
            <TextField
              label="Trip Surcharge ($)"
              type="number"
              value={formData.tripSurcharge}
              onChange={handleFormChange('tripSurcharge')}
              fullWidth
              inputProps={{ step: '0.01', min: 0 }}
              helperText="Additional charge for trips to this location"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveLocation} 
            variant="contained"
            disabled={!formData.name.trim() || !formData.address.trim()}
          >
            {editingLocation ? 'Update' : 'Create'} Location
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LocationsManagement;