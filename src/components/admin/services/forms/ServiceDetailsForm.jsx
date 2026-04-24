import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import { ImageDialog } from './ImageDialog';
import { BASE_URL } from '../../../../store/axios/axios';

function resolveMediaUrl(path) {
  if (!path) return null;
  const s = String(path);
  if (s.startsWith('http')) return s;
  const base = BASE_URL.replace(/\/api\/?$/, '');
  return `${base}${s.startsWith('/') ? '' : '/'}${s}`;
}

// ServiceDetailsFormProps: { data, onUpdate, setSavedSteps, onPersistServiceIcon }

const ServiceDetailsForm = ({
  data,
  onUpdate,
  setSavedSteps,
  onPersistServiceIcon,
}) => {
  const [errors, setErrors] = useState({});
  const [iconDialogOpen, setIconDialogOpen] = useState(false);

  const iconFileUrl = useMemo(
    () => (data?.iconFile ? URL.createObjectURL(data.iconFile) : null),
    [data?.iconFile]
  );

  useEffect(() => {
    return () => {
      if (iconFileUrl) URL.revokeObjectURL(iconFileUrl);
    };
  }, [iconFileUrl]);

  const displayIcon =
    data?.iconRemoved && !data?.iconFile
      ? null
      : (iconFileUrl || resolveMediaUrl(data?.icon));

  const handleIconImageChange = async (file) => {
    if (onPersistServiceIcon) {
      const result = await onPersistServiceIcon(file);
      if (result == null) {
        setSavedSteps((prev) => ({ ...prev, 0: false }));
        if (file === null) {
          onUpdate({ iconFile: null, iconRemoved: true });
        } else {
          onUpdate({ iconFile: file, iconRemoved: false });
        }
      }
      return;
    }
    setSavedSteps((prev) => ({ ...prev, 0: false }));
    if (file === null) {
      onUpdate({ iconFile: null, iconRemoved: true });
    } else {
      onUpdate({ iconFile: file, iconRemoved: false });
    }
  };

  const handleChange = (field) => (event) => {
    setSavedSteps((prev) => ({ ...prev, 0: false }));
    const value = event.target.type === "checkbox"
      ? event.target.checked
      : event.target.value;
    onUpdate({ [field]: value });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateField = (field, value) => {
    switch (field) {
      case 'name':
        if (!value || value.trim().length < 3) {
          return 'Service name must be at least 3 characters';
        }
        break;
      // case 'description':
      //   if (!value || value.trim().length < 10) {
      //     return 'Description must be at least 10 characters';
      //   }
      //   break;
    }
    return '';
  };

  const handleBlur = (field) => (event) => {
    const error = validateField(field, event.target.value);
    setErrors(prev => ({ ...prev, [field]: error }));
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
          label="Service Name"
          variant="outlined"
          fullWidth
          value={data?.name || ''}
          onChange={handleChange('name')}
          onBlur={handleBlur('name')}
          placeholder="e.g., Premium Cleaning Service"
          required
          error={!!errors.name}
          helperText={errors.name}
        />

        <TextField
          label="Description"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={data?.description || ''}
          onChange={handleChange('description')}
          onBlur={handleBlur('description')}
          placeholder="Describe what this service includes..."
          // required
          error={!!errors.description}
          helperText={errors.description}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Service icon (optional)
          </Typography>
          <Tooltip title={displayIcon ? 'View / change icon' : 'Add icon'}>
            <IconButton
              type="button"
              onClick={() => setIconDialogOpen(true)}
              size="small"
              sx={{ color: displayIcon ? '#14a55c' : '#ccc' }}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>
          {displayIcon && (
            <Box
              component="img"
              src={displayIcon}
              alt=""
              sx={{
                maxWidth: 48,
                maxHeight: 48,
                objectFit: 'contain',
                border: '1px solid #e0e0e0',
                borderRadius: 1,
              }}
            />
          )}
        </Box>

        <ImageDialog
          open={iconDialogOpen}
          onClose={() => setIconDialogOpen(false)}
          imageUrl={displayIcon}
          onImageChange={handleIconImageChange}
          title="Service icon"
        />

        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1}}>
          <FormControlLabel
            control={
              <Switch
                checked={data?.is_residential || false}
                onChange={handleChange("is_residential")}
              />
            }
            label="Allow website bids for Residential?"
          />

          <FormControlLabel
            control={
              <Switch
                checked={data?.is_commercial || false}
                onChange={handleChange("is_commercial")}
              />
            }
            label="Allow website bids for Commercial?"
          />

        </Box>
      </Box>
    </Box>
  );
};

export default ServiceDetailsForm;