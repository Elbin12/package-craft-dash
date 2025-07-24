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

  const handleCreateService = (serviceData: any) => {
    const newService: Service = {
      id: Date.now().toString(),
      ...serviceData,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'active'
    };
    setServices([...services, newService]);
  };

  const handleDeleteService = (id: string) => {
    setServices(services.filter(service => service.id !== id));
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
                      <IconButton size="small" color="primary">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteService(service.id)}
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
        onClose={() => setWizardOpen(false)}
        onComplete={handleCreateService}
      />
    </Box>
  );
};

export default ServicesManagement;