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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
} from '@mui/icons-material';
import { ServiceCreationWizard } from '../../components/admin/services/ServiceCreationWizard';

interface Service {
  id: string;
  nickname: string;
  description: string;
  packages: any[];
  questions: any[];
  createdAt: string;
  status: 'active' | 'inactive';
}

const ServicesManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      nickname: 'Premium House Cleaning',
      description: 'Complete house cleaning service with premium supplies',
      packages: [
        { id: '1', name: 'Basic', basePrice: 100 },
        { id: '2', name: 'Premium', basePrice: 150 }
      ],
      questions: [
        { id: '1', text: 'Do you have pets?', type: 'yes_no' },
        { id: '2', text: 'How many bedrooms?', type: 'options' }
      ],
      createdAt: '2024-01-15',
      status: 'active'
    }
  ]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);

  const handleCreateService = (serviceData: any) => {
    if (editingService) {
      // Update existing service
      setServices(services.map(service => 
        service.id === editingService.id 
          ? { ...service, ...serviceData }
          : service
      ));
      setEditingService(null);
    } else {
      // Create new service
      const newService: Service = {
        id: Date.now().toString(),
        ...serviceData,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'active'
      };
      setServices([...services, newService]);
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setWizardOpen(true);
  };

  const handleDeleteConfirm = (id: string) => {
    setServiceToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteService = () => {
    if (serviceToDelete) {
      setServices(services.filter(service => service.id !== serviceToDelete));
      setServiceToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleCloseWizard = () => {
    setWizardOpen(false);
    setEditingService(null);
  };

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
                        {service.description.length > 50 
                          ? `${service.description.substring(0, 50)}...`
                          : service.description
                        }
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${service.packages.length} packages`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`${service.questions.length} questions`} 
                        size="small" 
                        color="secondary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={service.status} 
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