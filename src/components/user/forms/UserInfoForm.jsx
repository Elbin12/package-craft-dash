import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  ListItem,
  ListItemText,
  ClickAwayListener,
  MenuItem,
  Button,
} from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import { useGetInitialDataQuery } from "../../../store/api/user/quoteApi";

// PlacesAutocomplete
const PlacesAutocomplete = ({ value, onSelect, error, helperText }) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
      setGoogleReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_API_KEY
    }&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      autocompleteService.current =
        new window.google.maps.places.AutocompleteService();
      geocoder.current = new window.google.maps.Geocoder();
      setGoogleReady(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const fetchPredictions = (query) => {
    if (!autocompleteService.current || !googleReady) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    autocompleteService.current.getPlacePredictions(
      {
        input: query,
        types: ["geocode", "establishment"],
      },
      (preds, status) => {
        setLoading(false);
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          preds &&
          preds.length
        ) {
          setSuggestions(preds.slice(0, 5));
        } else {
          setSuggestions([]);
        }
      }
    );
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    setShowSuggestions(true);
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      if (v.trim() === "") {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      fetchPredictions(v);
    }, 250);
  };

  const handleSelect = (prediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setSuggestions([]);

    if (!geocoder.current) return;
    geocoder.current.geocode(
      { placeId: prediction.place_id },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const place = results[0];
          const loc = place.geometry.location;
          onSelect({
            address: place.formatted_address,
            latitude: loc.lat(),
            longitude: loc.lng(),
            placeId: prediction.place_id,
          });
        }
      }
    );
  };

  return (
    <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          label="Street Address"
          value={inputValue}
          onChange={handleChange}
          placeholder="Search for a location..."
          error={error}
          helperText={helperText}
          disabled={!googleReady}
          InputProps={{
            endAdornment: loading && <CircularProgress size={20} />,
          }}
        />
        {showSuggestions && suggestions.length > 0 && (
          <Paper
            sx={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 1400,
              mt: 1,
              maxHeight: 220,
              overflowY: "auto",
            }}
          >
            {suggestions.map((s) => (
              <ListItem
                key={s.place_id}
                button
                onClick={() => handleSelect(s)}
              >
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <ListItemText
                  primary={s.structured_formatting.main_text}
                  secondary={s.structured_formatting.secondary_text}
                />
              </ListItem>
            ))}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};

export const UserInfoForm = ({ data, onUpdate }) => {
  const [locations, setLocations] = useState([]);
  const [sizeRanges, setSizeRanges] = useState([]);

  const [touched, setTouched] = useState({ phone: false, email: false });

  const { data: initialData } = useGetInitialDataQuery();

  useEffect(() => {
    if (initialData) {
      setLocations(initialData.locations);
      setSizeRanges(initialData.size_ranges);
    }
  }, [initialData]);

  const handleChange = (field) => (event) => {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        [field]: event.target.value,
      },
    });
  };

  const handlePlaceSelect = (place) => {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.placeId,
      },
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        General Information
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {/* First row: First Name, Street Address */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <TextField
            label="First Name *"
            value={data.userInfo?.firstName || ""}
            onChange={handleChange("firstName")}
            required
          />
          <PlacesAutocomplete
            value={data.userInfo?.address || ""}
            onSelect={handlePlaceSelect}
            error={false}
            helperText="Start typing to search and select your address"
          />
        </Box>

        {/* Second row: Last Name, Province City */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <TextField
            label="Last Name *"
            value={data.userInfo?.lastName || ""}
            onChange={handleChange("lastName")}
            required
          />
          <TextField
            select
            fullWidth
            label="Province, City"
            value={data.userInfo?.selectedLocation || ''}
            onChange={handleChange('selectedLocation')}
          >
            <MenuItem value="">Select Location</MenuItem>
            {locations.map(loc => (
              <MenuItem key={loc.id} value={loc.id}>
                {loc.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        {/* Third row: Company Name, Postal Code */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
          }}
        >
          <TextField
            label="Company Name"
            value={data.userInfo?.companyName || ""}
            onChange={handleChange("companyName")}
          />
          <TextField
            label="Postal Code *"
            value={data.userInfo?.postalCode || ""}
            onChange={handleChange("postalCode")}
            required
          />
        </Box>

        {/* Fourth row: Primary Phone, SMS Consent */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <TextField
            label="Primary Phone *"
            value={data.userInfo?.phone || ""}
            onChange={handleChange("phone")}
            onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
            required
            error={
              touched.phone &&
              (!data.userInfo?.phone || !/^\d{10}$/.test(data.userInfo?.phone))
            }
            helperText={
              touched.phone
                ? !data.userInfo?.phone
                  ? "Phone number is required"
                  : !/^\d{10}$/.test(data.userInfo?.phone)
                  ? "Enter a valid 10-digit phone number"
                  : ""
                : ""
            }
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Would it be okay for us to correspond with you via Text/SMS? (You must select one.)
            </Typography>
            <Button
              variant={
                data.userInfo?.smsConsent === "yes" ? "contained" : "outlined"
              }
              onClick={() =>
                handleChange("smsConsent")({ target: { value: "yes" } })
              }
              sx={{ mr: 1 }}
            >
              YES
            </Button>
            <Button
              variant={
                data.userInfo?.smsConsent === "no" ? "contained" : "outlined"
              }
              onClick={() =>
                handleChange("smsConsent")({ target: { value: "no" } })
              }
            >
              NO
            </Button>
          </Box>
        </Box>

        {/* Fifth row: Email Address, Email Consent */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 3,
            alignItems: "start",
          }}
        >
          <TextField
            label="Email Address *"
            value={data.userInfo?.email || ""}
            onChange={handleChange("email")}
            onBlur={() => setTouched((p) => ({ ...p, email: true }))}
            required
            error={
              touched.email &&
              (!data.userInfo?.email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email))
            }
            helperText={
              touched.email
                ? !data.userInfo?.email
                  ? "Email is required"
                  : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email)
                  ? "Enter a valid email"
                  : ""
                : ""
            }
          />
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Would it be okay for us to correspond with you via email? (You must select one.)
            </Typography>
            <Button
              variant={
                data.userInfo?.emailConsent === "yes" ? "contained" : "outlined"
              }
              onClick={() =>
                handleChange("emailConsent")({ target: { value: "yes" } })
              }
              sx={{ mr: 1 }}
            >
              YES
            </Button>
            <Button
              variant={
                data.userInfo?.emailConsent === "no" ? "contained" : "outlined"
              }
              onClick={() =>
                handleChange("emailConsent")({ target: { value: "no" } })
              }
            >
              NO
            </Button>
          </Box>
        </Box>

        {/* Sixth row: Where did you hear about us (full width) */}
        <TextField
          select
          fullWidth
          label="Where did you hear about us?"
          value={data.userInfo?.heardAboutUs || ""}
          onChange={handleChange("heardAboutUs")}
        >
          <MenuItem value="">Please Select</MenuItem>
          <MenuItem value="business-card">Business Card</MenuItem>
          <MenuItem value="company-car">Company Car</MenuItem>
          <MenuItem value="door-hanger">Door Hanger</MenuItem>
          <MenuItem value="facebook">Facebook</MenuItem>
          <MenuItem value="friend-family">Friend/Family</MenuItem>
          <MenuItem value="google">Google</MenuItem>
          <MenuItem value="mail">La Source/Reno Decor (Mail)</MenuItem>
          <MenuItem value="other">Other</MenuItem>
          <MenuItem value="radio">Radio</MenuItem>
          <MenuItem value="referral">Referral</MenuItem>
          <MenuItem value="returning">Returning Customer</MenuItem>
          <MenuItem value="yellow-pages">Yellow Pages</MenuItem>
        </TextField>

        {/* Seventh row: Project Type (full width) */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>
            What type of project is this?
          </Typography>
          <Button
            variant={
              data.userInfo?.projectType === "residential"
                ? "contained"
                : "outlined"
            }
            onClick={() =>
              handleChange("projectType")({ target: { value: "residential" } })
            }
            sx={{ mr: 1 }}
          >
            Residential
          </Button>
          <Button
            variant={
              data.userInfo?.projectType === "commercial"
                ? "contained"
                : "outlined"
            }
            onClick={() =>
              handleChange("projectType")({ target: { value: "commercial" } })
            }
          >
            Commercial
          </Button>
        </Box>

        {/* Property Name - only show if commercial */}
        {data.userInfo?.projectType === "commercial" && (
          <TextField
            fullWidth
            label="Property Name"
            value={data.userInfo?.propertyName || ""}
            onChange={handleChange("propertyName")}
          />
        )}

        {/* Eighth row: Number of floors (full width) */}
        <TextField
          select
          fullWidth
          label="Number of floors (above ground)"
          value={data.userInfo?.floors || ""}
          onChange={handleChange("floors")}
        >
          <MenuItem value="">Please Select</MenuItem>
          <MenuItem value="1">1 Story</MenuItem>
          <MenuItem value="2">2 Story</MenuItem>
          <MenuItem value="3">3 Story</MenuItem>
          <MenuItem value="4+">4 Stories or more</MenuItem>
        </TextField>

        {/* Ninth row: Current/Previous Customer (full width) */}
        <TextField
          select
          fullWidth
          label="Are you a current or previous customer?"
          value={data.userInfo?.customerStatus || ""}
          onChange={handleChange("customerStatus")}
        >
          <MenuItem value="">Please Select</MenuItem>
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </TextField>

        {/* Tenth row: House Size (full width) */}
        <TextField
          select
          fullWidth
          label="Actual House Size/Square Footage"
          value={data.userInfo?.selectedHouseSize || ""}
          onChange={handleChange("selectedHouseSize")}
        >
          <MenuItem value="">Select House Size/Square Footage</MenuItem>
          {sizeRanges.map(size_range => (
            <MenuItem key={size_range.id} value={size_range.id}>
              {size_range?.min_sqft} - {size_range?.max_sqft}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
};

export default UserInfoForm;