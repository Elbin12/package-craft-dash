import React from 'react';
import {
  Box,
  TextField,
  Typography,
} from '@mui/material';

// ServiceDetailsFormProps: { data, onUpdate }

const ServiceDetailsForm = ({
  data,
  onUpdate,
}) => {
  const handleChange = (field) => (event) => {
    onUpdate({ [field]: event.target.value });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Service Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Enter the basic details for your new service.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Service Nickname"
          variant="outlined"
          fullWidth
          value={data.nickname || ''}
          onChange={handleChange('nickname')}
          placeholder="e.g., Premium Cleaning Service"
          required
        />

        <TextField
          label="Description"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={data.description || ''}
          onChange={handleChange('description')}
          placeholder="Describe what this service includes..."
          required
        />
      </Box>
    </Box>
  );
};

export default ServiceDetailsForm;