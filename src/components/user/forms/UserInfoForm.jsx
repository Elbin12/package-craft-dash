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
import { commercial_id, residential_id } from "../../../store/axios/axios";

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

          // Extract postal code and city/province from address components
          let postalCode = "";
          let city = "";
          let province = "";

          console.log(place.address_components)

          // console.log()

          if (place.address_components) {
            place.address_components.forEach((comp) => {
              if (comp.types.includes("postal_code")) {
                postalCode = comp.long_name;
              }
              if (comp.types.includes("locality")) {
                city = comp.long_name;
              }
              if (
                comp.types.includes("administrative_area_level_1") || // Province/State
                comp.types.includes("administrative_area_level_2")
              ) {
                province = comp.long_name;
              }
            });
          }

          onSelect({
            address: place.formatted_address,
            latitude: loc.lat(),
            longitude: loc.lng(),
            placeId: prediction.place_id,
            postalCode,
            provinceCity: `${city}`,
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
          size="small"
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

export const UserInfoForm = ({ data, onUpdate, admin }) => {
  const [locations, setLocations] = useState([]);
  const [sizeRanges, setSizeRanges] = useState([]);

  const [touched, setTouched] = useState({ phone: false, email: false });
  const [type_id, setTypeId] = useState('Residential');

  const { data: initialData } = useGetInitialDataQuery(type_id, {
    refetchOnMountOrArgChange: true,
  });

const prevTypeRef = useRef();

useEffect(() => {
  const newType = data?.userInfo?.projectType;
  if (!newType) return;

  setTypeId(newType === "residential" ? "Residential" : "Commercial");

  if (prevTypeRef.current && prevTypeRef.current !== newType) {
    onUpdate({
      userInfo: {
        ...data.userInfo,
        selectedHouseSize: null,
      },
    });
  }

  prevTypeRef.current = newType;
}, [data?.userInfo?.projectType]);

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
    let matchedLocationId = "";
    if (place.provinceCity && locations.length > 0) {
      const match = locations.find(
        (loc) =>
          loc.name.toLowerCase() === place.provinceCity.toLowerCase()
      );
      if (match) {
        matchedLocationId = match.id;
      }
    }

    console.log(place.provinceCity, place.postalCode,'gg')
    onUpdate({
      userInfo: {
        ...data.userInfo,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.placeId,
        postalCode: place.postalCode || "",
        selectedLocation: matchedLocationId || data.userInfo?.selectedLocation || "",
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
        {admin && (
          <Typography variant="body2" color="textSecondary">
            Note: Certain fields are hidden for admins because they are not required.
          </Typography>
        )}
        {!admin && 
        (
          <>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <TextField
                label="First Name"
                size="small"
                value={data.userInfo?.firstName || ""}
                onChange={handleChange("firstName")}
                required={!admin}
              />
              <TextField
                label="Last Name"
                size="small"
                value={data.userInfo?.lastName || ""}
                onChange={handleChange("lastName")}
                required={!admin}
              />
            </Box>

            {/* Second row: Address, Province/City */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
              }}
            >
              <PlacesAutocomplete
                value={data.userInfo?.address || ""}
                onSelect={handlePlaceSelect}
                error={false}
                helperText="Start typing to search and select your address"
              />
              <TextField
                select
                fullWidth
                label="Province, City"
                value={data.userInfo?.selectedLocation || ''}
                onChange={handleChange('selectedLocation')}
                size="small"
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
                size="small"
              />
              <TextField
                label="Postal Code"
                size="small"
                value={data.userInfo?.postalCode || ""}
                onChange={handleChange("postalCode")}
                required={!admin}
              />
            </Box>

            {/* Fourth row: Primary Phone, SMS Consent */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 3,
                alignItems: "end",
              }}
            >
              <TextField
                label="Primary Phone"
                size="small"
                value={data.userInfo?.phone || ""}
                onChange={handleChange("phone")}
                onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                required={!admin}
                error={
                  !admin && touched.phone &&
                  (!data.userInfo?.phone || !/^\d{10}$/.test(data.userInfo?.phone))
                }
                helperText={
                  !admin &&
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
                <Typography variant="body2" sx={{ mb: 1, fontSize: {xs:12, md:14} }}>
                  Would it be okay for us to correspond with you via Text/SMS? (You must select one.)
                </Typography>
                <Button
                  size="small"
                  variant={
                    data.userInfo?.smsConsent === true ? "contained" : "outlined"
                  }
                  onClick={() =>
                    handleChange("smsConsent")({ target: { value: true } })
                  }
                  sx={{ mr: 1 }}
                >
                  YES
                </Button>
                <Button
                  size="small"
                  variant={
                    data.userInfo?.smsConsent === false ? "contained" : "outlined"
                  }
                  onClick={() =>
                    handleChange("smsConsent")({ target: { value: false } })
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
                alignItems: "end",
              }}
            >
              <TextField
                size="small"
                label="Email Address"
                value={data.userInfo?.email || ""}
                onChange={handleChange("email")}
                onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                required={!admin}
                error={
                  !admin && touched.email &&
                  (!data.userInfo?.email ||
                    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email))
                }
                helperText={
                  !admin && touched.email
                    ? !data.userInfo?.email
                      ? "Email is required"
                      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.userInfo?.email)
                      ? "Enter a valid email"
                      : ""
                    : ""
                }
              />
              <Box>
                <Typography variant="body2" sx={{ mb: 1, fontSize: {xs:12, md:14} }}>
                  Would it be okay for us to correspond with you via email? (You must select one.)
                </Typography>
                <Button
                  size="small"
                  variant={
                    data.userInfo?.emailConsent === true ? "contained" : "outlined"
                  }
                  onClick={() =>
                    handleChange("emailConsent")({ target: { value: true } })
                  }
                  sx={{ mr: 1 }}
                >
                  YES
                </Button>
                <Button
                  size="small"
                  variant={
                    data.userInfo?.emailConsent === false ? "contained" : "outlined"
                  }
                  onClick={() =>
                    handleChange("emailConsent")({ target: { value: false } })
                  }
                >
                  NO
                </Button>
              </Box>
            </Box>

            {/* Sixth row: Where did you hear about us (full width) */}
            <TextField
              size="small"
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
          </>
      )}

        {/* Seventh row: Project Type (full width) */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontSize: {xs:12, md:14} }}>
            What type of project is this?
          </Typography>
          <Button
            size="small"
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
            size="small"
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
            size="small"
            fullWidth
            label="Property Name"
            value={data.userInfo?.propertyName || ""}
            onChange={handleChange("propertyName")}
          />
        )}

        {/* Eighth row: Number of floors (full width) */}
        <TextField
          size="small"
          select
          fullWidth
          label="Number of floors (above ground)"
          value={data.userInfo?.floors || ""}
          onChange={handleChange("floors")}
        >
          <MenuItem value="">Please Select</MenuItem>
          <MenuItem value="1">1 story</MenuItem>
          <MenuItem value="2">2 story</MenuItem>
          <MenuItem value="3">3 story</MenuItem>
          <MenuItem value="4+">4 Stories or more</MenuItem>
        </TextField>

        {/* Ninth row: Current/Previous Customer (full width) */}
        <TextField
          size="small"
          select
          fullWidth
          label="Are you a current or previous customer?"
          value={data.userInfo?.customerStatus ?? ""}
          onChange={handleChange("customerStatus")}
        >
          <MenuItem value="">Please Select</MenuItem>
          <MenuItem value={true}>Yes</MenuItem>
          <MenuItem value={false}>No</MenuItem>
        </TextField>

        {/* Tenth row: House Size (full width) */}
        <TextField
          size="small"
          select
          fullWidth
          label="Actual House Size/Square Footage"
          value={data.userInfo?.selectedHouseSize || ""}
          onChange={handleChange("selectedHouseSize")}
        >
          <MenuItem value="">Select House Size/Square Footage</MenuItem>
          {sizeRanges.map(size_range => (
            <MenuItem key={size_range.id} value={size_range.id}>
              {size_range?.min_sqft} {size_range?.max_sqft === null 
                ? " sq ft And Up" 
                : `- ${size_range?.max_sqft} sq ft`}
            </MenuItem>
          ))}
        </TextField>
      </Box>
    </Box>
  );
};

export default UserInfoForm;