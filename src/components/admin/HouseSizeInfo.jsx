// src/components/HouseSizeInfo.jsx
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Stack,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
  useGetHouseSizesQuery,
  useCreateHouseSizesMutation,
  useDeleteHouseSizeMutation,
} from '../../store/api/houseSizesApi';

const parseNumber = (v) => {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

const HouseSizeInfo = () => {
  const {
    data: fetched,
    isLoading: isFetching,
    isError,
    error,
  } = useGetHouseSizesQuery();
  const [createHouseSizes, { isLoading: isSaving }] = useCreateHouseSizesMutation();
  const [deleteHouseSize] = useDeleteHouseSizeMutation();

  const [rows, setRows] = useState([{ max: '', andUp: false }]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized && Array.isArray(fetched)) {
      const mapped = fetched.map((r) => ({
        max: r.maximum_sqft != null ? String(r.maximum_sqft) : '',
        andUp: r.maximum_sqft == null,
      }));
      setRows(mapped.length ? mapped : [{ max: '', andUp: false }]);
      setInitialized(true);
    }
  }, [fetched, initialized]);

  // derive rows, stop after first And Up
  const derivedRows = useMemo(() => {
    const result = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const prev = result[i - 1];
      const prevMax = i === 0 ? 0 : prev && prev.max !== '' ? parseNumber(prev.max) : null;
      const min_sq_ft =
        i === 0 ? 0 : prevMax !== null ? prevMax + 1 : '';
      result.push({
        min: min_sq_ft,
        max: row.max,
        andUp: row.andUp,
      });
      if (row.andUp) break;
    }
    return result;
  }, [rows]);

  const handleChangeMax = useCallback((index, value) => {
    setRows((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], max: value, andUp: false };
      return copy;
    });
  }, []);

  const toggleAndUp = (index) => {
    setRows((prev) => {
      const copy = [...prev];
      const currently = copy[index].andUp;
      copy[index] = {
        ...copy[index],
        andUp: !currently,
        // keep max when un-toggling, clear when toggling on (since max is irrelevant for And Up)
        max: currently ? copy[index].max : '',
      };
      if (!currently) {
        // turned on And Up: truncate after
        copy.splice(index + 1);
      }
      return copy;
    });
  };

  const handleAddRow = () => {
    setRows((prev) => {
      if (prev.some((r) => r.andUp)) return prev; // cannot add after And Up
      return [...prev, { max: '', andUp: false }];
    });
  };

  const handleDeleteRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const getRowError = (row, idx, derived) => {
    if (row.andUp) return '';
    const min = idx === 0 ? 0 : derived[idx - 1]?.max !== '' ? parseNumber(derived[idx - 1].max) + 1 : 0;
    if (row.max === '') return '';
    const maxParsed = parseNumber(row.max);
    if (maxParsed === null) return 'Invalid number';
    if (maxParsed < min) return `Must be ≥ ${min}`;
    return '';
  };

  const handleSave = async () => {
    const payload = derivedRows
      .map((r, idx) => {
        const minParsed = parseNumber(String(r.min));
        const maxParsed = parseNumber(r.max);
        if (minParsed === null) return null;

        if (r.andUp || r.max === '') {
          return {
            minimum_sqft: minParsed,
            maximum_sqft: null,
          };
        }
        if (maxParsed === null) return null;
        if (maxParsed < minParsed) return null;
        return {
          minimum_sqft: minParsed,
          maximum_sqft: maxParsed,
        };
      })
      .filter(Boolean);

    if (payload.length === 0) {
      alert('Provide at least one valid range. Max must be ≥ min or mark a row as "And Up".');
      return;
    }

    try {
      await createHouseSizes(payload).unwrap();
      alert('House sizes saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('Error saving house sizes');
    }
  };

  return (
    <Box sx={{ p: 3, background: '#fff', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" mb={2}>
        House Size Information
      </Typography>
      <Typography variant="body2" mb={2} color="text.secondary">
        Define square footage ranges. Minimum is auto-derived; edit maximum. Any row can be toggled to "And Up" (no upper bound). Rows after an "And Up" are removed.
      </Typography>

      {isFetching && <Typography sx={{ mb: 2 }}>Loading existing ranges...</Typography>}
      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load ranges. {error?.toString ? error.toString() : ''}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {derivedRows.map((row, index) => {
          const errorText = getRowError(rows[index], index, derivedRows);
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                borderBottom: '1px solid',
                borderColor: 'divider',
                py: 1,
              }}
            >
              <Typography sx={{ minWidth: 40 }}>Sq Ft</Typography>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  flexGrow: 1,
                  maxWidth: 600,
                  flexWrap: 'wrap',
                }}
              >
                <Typography sx={{ mr: 0.5 }}>{row.min === '' ? '-' : row.min}</Typography>
                {!row.andUp && (
                  <>
                    <Typography>to</Typography>
                    <TextField
                      size="small"
                      type="number"
                      placeholder="Maximum"
                      value={rows[index]?.max || ''}
                      onChange={(e) => handleChangeMax(index, e.target.value)}
                      sx={{ width: 120 }}
                      inputProps={{ min: 0 }}
                      error={!!errorText}
                      helperText={errorText}
                    />
                  </>
                )}
                {row.andUp && (
                  <Typography>
                    <strong>And Up</strong>
                  </Typography>
                )}
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={rows[index]?.andUp || false}
                    onChange={() => toggleAndUp(index)}
                  />
                }
                label="And Up"
              />

              <IconButton
                aria-label="delete"
                size="small"
                onClick={() => handleDeleteRow(index)}
                sx={{ ml: 'auto' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        })}

        {derivedRows.length === 0 && !isFetching && (
          <Typography>No ranges defined. Click "Add New Option" to start.</Typography>
        )}
      </Box>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          size="small"
          data-testid="add-new-option"
          disabled={rows.some((r) => r.andUp)}
        >
          + Add New Option
        </Button>
        <Box flexGrow={1} />
        <Button variant="contained" onClick={handleSave} disabled={isSaving} data-testid="save-house-sizes">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </Box>
  );
};

export default HouseSizeInfo;
