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
// Temporarily removed RTK Query imports
// import { 
//   useGetServicesQuery, 
//   useCreateServiceMutation, 
//   useUpdateServiceMutation, 
//   useDeleteServiceMutation 
// } from '../../store/api/servicesApi';
import {
  setWizardOpen,
  setEditingService,
  setDeleteConfirmOpen,
  setServiceToDelete,
  clearEditingService,
} from '../../store/slices/servicesSlice';

const ServicesManagement = () => {
  console.log('ServicesManagement: Starting component');
  const dispatch = useDispatch();
  console.log('ServicesManagement: useDispatch worked');
  const { 
    wizardOpen, 
    editingService, 
    deleteConfirmOpen, 
    serviceToDelete 
  } = useSelector((state) => {
    console.log('ServicesManagement: useSelector state:', state);
    return state.services;
  });
  console.log('ServicesManagement: useSelector worked');

  // Temporarily disable RTK Query to test basic Redux
  // const { data: services = [], isLoading, error } = useGetServicesQuery();
  // const [createService] = useCreateServiceMutation();
  // const [updateService] = useUpdateServiceMutation();
  // const [deleteService] = useDeleteServiceMutation();
  
  const services = [];
  const isLoading = false;
  const error = null;

  const handleCreateService = async (serviceData) => {
    try {
      console.log('Handle create/update service:', serviceData);
      // if (editingService) {
      //   await updateService({ id: editingService.id, ...serviceData }).unwrap();
      // } else {
      //   await createService(serviceData).unwrap();
      // }
      handleCloseWizard();
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleEditService = (service) => {
    dispatch(setEditingService(service));
    dispatch(setWizardOpen(true));
  };

  const handleDeleteConfirm = (service) => {
    dispatch(setServiceToDelete(service));
    dispatch(setDeleteConfirmOpen(true));
  };

  const handleDeleteService = async () => {
    try {
      console.log('Handle delete service:', serviceToDelete);
      // await deleteService(serviceToDelete.id).unwrap();
      dispatch(setDeleteConfirmOpen(false));
      dispatch(setServiceToDelete(null));
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  };

  const handleCloseWizard = () => {
    dispatch(setWizardOpen(false));
    dispatch(clearEditingService());
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
          onClick={() => dispatch(setWizardOpen(true))}
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
                        onClick={() => handleDeleteConfirm(service)}
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
        onClose={() => dispatch(setDeleteConfirmOpen(false))}
      >
        <DialogTitle>Delete Service</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this service? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => dispatch(setDeleteConfirmOpen(false))}>
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