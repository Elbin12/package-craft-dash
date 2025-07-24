import React from 'react';
import {
  Box,
  TextField,
  Typography,
} from '@mui/material';

interface UserInfoFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({
  data,
  onUpdate,
}) => {
  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        [field]: event.target.value,
      },
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide your contact information to proceed with the booking.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TextField
          label="First Name"
          variant="outlined"
          fullWidth
          value={data.userInfo?.firstName || ''}
          onChange={handleChange('firstName')}
          required
        />

        <TextField
          label="Phone Number"
          variant="outlined"
          fullWidth
          value={data.userInfo?.phone || ''}
          onChange={handleChange('phone')}
          placeholder="(555) 123-4567"
          required
        />

        <TextField
          label="Email Address"
          variant="outlined"
          fullWidth
          type="email"
          value={data.userInfo?.email || ''}
          onChange={handleChange('email')}
          placeholder="john@example.com"
          required
        />

        <TextField
          label="Address"
          variant="outlined"
          fullWidth
          value={data.userInfo?.address || ''}
          onChange={handleChange('address')}
          placeholder="123 Main St, City, State"
          helperText="In production, this would use Google Places Autocomplete"
          required
        />
      </Box>
    </Box>
  );
};

export default UserInfoForm;