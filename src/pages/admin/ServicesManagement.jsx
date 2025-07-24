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
  DialogContentText,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { ServiceCreationWizard } from '../../components/admin/services/ServiceCreationWizard.jsx';
// Temporarily comment out RTK Query to test Redux connection
// import { 
//   useGetServicesQuery, 
//   useCreateServiceMutation, 
//   useUpdateServiceMutation, 
//   useDeleteServiceMutation 
// } from '../../store/api/servicesApi';
// import {
//   setWizardOpen,
//   setEditingService,
//   setDeleteConfirmOpen,
//   setServiceToDelete,
//   clearEditingService,
// } from '../../store/slices/servicesSlice';

const ServicesManagement = () => {
  // Temporarily use local state instead of Redux
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  // Temporarily use mock data instead of RTK Query
  const services = [];
  const isLoading = false;
  const error = null;
  
  // Mock mutation functions
  const createService = () => Promise.resolve();
  const updateService = () => Promise.resolve();
  const deleteService = () => Promise.resolve();

  const handleCreateService = async (serviceData) => {
    try {
      if (editingService) {
        console.log('Update service:', serviceData);
      } else {
        console.log('Create service:', serviceData);
      }
      setEditingService(null);
      setWizardOpen(false);
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setWizardOpen(true);
  };

  const handleDeleteConfirm = (id) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteService = async () => {
    if (serviceToDelete) {
      try {
        console.log('Delete service:', serviceToDelete);
        setServiceToDelete(null);
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
    setDeleteConfirmOpen(false);
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setEditingService(null);
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
          Error loading services: {error.message || 'Unknown error'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Services Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your service offerings, packages, and pricing
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setWizardOpen(true)}
        >
          Create New Service
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Packages</TableCell>
                  <TableCell>Questions</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {service.nickname}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {service.description && service.description.length > 50 
                          ? `${service.description.substring(0, 50)}...`
                          : service.description
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${service.packages?.length || 0} packages`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${service.questions?.length || 0} questions`} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service.status || 'active'} 
                        size="small"
                        color={service.status === 'active' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{service.createdAt}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary">
                        <Visibility />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditService(service)}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteConfirm(service.id)}
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

      <ServiceCreationWizard
        open={wizardOpen}
        onClose={handleCloseWizard}
        onComplete={handleCreateService}
        editData={editingService}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this service? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteService} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ServicesManagement;