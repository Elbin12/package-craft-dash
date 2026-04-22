import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
  MenuItem,
  Button,
} from "@mui/material";
import { LocationOn } from "@mui/icons-material";
import { useGetInitialDataQuery } from "../../../store/api/user/quoteApi";
import { commercial_id, residential_id } from "../../../store/axios/axios";

/** Strip to 10 digits; handles +1 and common autofill formats */
function normalizePhoneDigits(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) return d.slice(1);
  if (d.length > 10) return d.slice(-10);
  return d;
}

const BOOKING_INPUT = {
  firstName: "booking-firstName",
  lastName: "booking-lastName",
  postalCode: "booking-postalCode",
  phone: "booking-phone",
  email: "booking-email",
  companyName: "booking-companyName",
  streetAddress: "booking-streetAddress",
};

/** Read text inputs from the DOM in the same tick as autofill (before React re-renders). */
function collectBookingFieldsFromDom(root) {
  if (!root?.querySelector) return {};
  const q = (name) => root.querySelector(`input[name="${name}"]`)?.value ?? "";
  const out = {};
  const fn = q(BOOKING_INPUT.firstName).trim();
  const ln = q(BOOKING_INPUT.lastName).trim();
  const pc = q(BOOKING_INPUT.postalCode).trim();
  const phoneNorm = normalizePhoneDigits(q(BOOKING_INPUT.phone));
  const em = q(BOOKING_INPUT.email).trim();
  const co = q(BOOKING_INPUT.companyName).trim();
  const street = q(BOOKING_INPUT.streetAddress).trim();
  if (fn) out.firstName = fn;
  if (ln) out.lastName = ln;
  if (pc) out.postalCode = pc;
  if (phoneNorm) out.phone = phoneNorm;
  if (em) out.email = em;
  if (co) out.companyName = co;
  if (street) out.address = street;
  return out;
}

function extractPlaceFromGeocoderResult(result, explicitPlaceId) {
  const loc = result.geometry.location;
  let postalCode = "";
  let city = "";
  if (result.address_components) {
    result.address_components.forEach((comp) => {
      if (comp.types.includes("postal_code")) {
        postalCode = comp.long_name;
      }
      if (comp.types.includes("locality")) {
        city = comp.long_name;
      }
    });
  }
  const placeId =
    explicitPlaceId !== undefined && explicitPlaceId !== null && explicitPlaceId !== ""
      ? explicitPlaceId
      : result.place_id || "";
  return {
    address: result.formatted_address,
    latitude: loc.lat(),
    longitude: loc.lng(),
    placeId,
    postalCode,
    provinceCity: city,
  };
}

// PlacesAutocomplete
const PlacesAutocomplete = ({
  value,
  onSelect,
  onAddressTextChange,
  error,
  helperText,
}) => {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const autocompleteService = useRef(null);
  const geocoder = useRef(null);
  const debounceRef = useRef(null);
  const geocodeDebounceRef = useRef(null);
  const geocodeRequestIdRef = useRef(0);
  const inputValueRef = useRef(value || "");

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
    return () => {
      if (geocodeDebounceRef.current) {
        window.clearTimeout(geocodeDebounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const v = value || "";
    setInputValue(v);
    inputValueRef.current = v;
  }, [value]);

  const runAddressGeocode = (trimmed) => {
    if (!trimmed || !geocoder.current) return;
    const myId = ++geocodeRequestIdRef.current;
    geocoder.current.geocode({ address: trimmed }, (results, status) => {
      if (myId !== geocodeRequestIdRef.current) return;
      if (status !== "OK" || !results?.[0]) return;
      if (inputValueRef.current.trim() !== trimmed) return;
      onSelect(extractPlaceFromGeocoderResult(results[0]));
    });
  };

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

  /**
   * @param {string} v
   * @param {{ geocodeMode?: 'debounce' | 'immediate' | 'none' }} opts
   *   debounce — while typing / autofill input events
   *   immediate — on blur (user left the field)
   *   none — dropdown pick; caller runs placeId geocode
   */
  const pushAddressText = (v, opts = {}) => {
    const geocodeMode = opts.geocodeMode ?? "debounce";
    inputValueRef.current = v;
    setInputValue(v);
    onAddressTextChange?.(v);

    if (geocodeMode === "none") {
      if (geocodeDebounceRef.current) {
        window.clearTimeout(geocodeDebounceRef.current);
        geocodeDebounceRef.current = null;
      }
      geocodeRequestIdRef.current++;
      return;
    }

    if (geocodeDebounceRef.current) {
      window.clearTimeout(geocodeDebounceRef.current);
      geocodeDebounceRef.current = null;
    }

    const trimmed = v.trim();
    if (!trimmed) {
      geocodeRequestIdRef.current++;
      return;
    }

    if (geocodeMode === "immediate") {
      runAddressGeocode(trimmed);
      return;
    }

    geocodeDebounceRef.current = window.setTimeout(() => {
      geocodeDebounceRef.current = null;
      runAddressGeocode(trimmed);
    }, 650);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    pushAddressText(v, { geocodeMode: "debounce" });
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
    pushAddressText(prediction.description, { geocodeMode: "none" });
    setShowSuggestions(false);
    setSuggestions([]);

    if (!geocoder.current) return;
    geocoder.current.geocode(
      { placeId: prediction.place_id },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          onSelect(
            extractPlaceFromGeocoderResult(results[0], prediction.place_id)
          );
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
          onBlur={(e) => {
            // Browser autofill often skips React onChange; read committed DOM value
            pushAddressText(e.target.value, { geocodeMode: "immediate" });
            setShowSuggestions(false);
          }}
          placeholder="Search for a location..."
          error={error}
          helperText={helperText}
          disabled={!googleReady}
          InputProps={{
            endAdornment: loading && <CircularProgress size={20} />,
          }}
          inputProps={{
            name: BOOKING_INPUT.streetAddress,
            autoComplete: "street-address",
            // Autofill may not fire synthetic change; input event is more reliable
            onInput: (e) =>
              pushAddressText(e.target.value, { geocodeMode: "debounce" }),
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
              <ListItemButton
                key={s.place_id}
                onClick={() => handleSelect(s)}
              >
                <LocationOn color="primary" sx={{ mr: 1 }} />
                <ListItemText
                  primary={s.structured_formatting.main_text}
                  secondary={s.structured_formatting.secondary_text}
                />
              </ListItemButton>
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
  const formRef = useRef(null);

  const { data: initialData } = useGetInitialDataQuery(type_id, {
    refetchOnMountOrArgChange: true,
  });

const prevTypeRef = useRef();

useEffect(() => {
  const newType = data?.userInfo?.projectType;
  if (!newType) return;

  setTypeId(newType === "residential" ? "Residential" : "Commercial");

  if (prevTypeRef.current && prevTypeRef.current !== newType) {
    onUpdate((prev) => ({
      ...prev,
      userInfo: { ...prev.userInfo, selectedHouseSize: null },
    }));
  }

  prevTypeRef.current = newType;
}, [data?.userInfo?.projectType]);

  useEffect(() => {
    if (initialData) {
      setLocations(initialData.locations);
      setSizeRanges(initialData.size_ranges);
    }
  }, [initialData]);

  /**
   * Merge patch into userInfo using fresh DOM values when available.
   * Chrome autofill fills many inputs in one tick but only fires change on one;
   * reading the form here preserves phone/email/postal before React clears them.
   */
  const mergeUserInfoFromDomAndPatch = (patch) => {
    onUpdate((prev) => {
      const fromDom = collectBookingFieldsFromDom(formRef.current);
      const u = {
        ...prev.userInfo,
        ...fromDom,
        ...patch,
      };
      if (
        typeof fromDom.address === "string" &&
        fromDom.address !== prev.userInfo?.address
      ) {
        u.latitude = "";
        u.longitude = "";
        u.googlePlaceId = "";
      }
      return { ...prev, userInfo: u };
    });
  };

  const handleChange = (field) => (event) => {
    mergeUserInfoFromDomAndPatch({ [field]: event.target.value });
  };

  const handleAddressTextChange = (text) => {
    onUpdate((prev) => ({
      ...prev,
      userInfo: {
        ...prev.userInfo,
        address: text,
        latitude: "",
        longitude: "",
        googlePlaceId: "",
      },
    }));
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
    onUpdate((prev) => ({
      ...prev,
      userInfo: {
        ...prev.userInfo,
        address: place.address,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.placeId,
        postalCode: place.postalCode || "",
        selectedLocation:
          matchedLocationId || prev.userInfo?.selectedLocation || "",
      },
    }));
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
          <Box
            component="form"
            ref={formRef}
            autoComplete="on"
            noValidate
            onSubmit={(e) => e.preventDefault()}
            sx={{ display: "flex", flexDirection: "column", gap: 3 }}
          >
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
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  mergeUserInfoFromDomAndPatch({ firstName: v });
                }}
                inputProps={{
                  name: BOOKING_INPUT.firstName,
                  autoComplete: "given-name",
                }}
                required={!admin}
              />
              <TextField
                label="Last Name"
                size="small"
                value={data.userInfo?.lastName || ""}
                onChange={handleChange("lastName")}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  mergeUserInfoFromDomAndPatch({ lastName: v });
                }}
                inputProps={{
                  name: BOOKING_INPUT.lastName,
                  autoComplete: "family-name",
                }}
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
                onAddressTextChange={handleAddressTextChange}
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
                inputProps={{
                  name: BOOKING_INPUT.companyName,
                  autoComplete: "organization",
                }}
              />
              <TextField
                label="Postal Code"
                size="small"
                value={data.userInfo?.postalCode || ""}
                onChange={handleChange("postalCode")}
                required={!admin}
                inputProps={{
                  name: BOOKING_INPUT.postalCode,
                  autoComplete: "postal-code",
                }}
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
                onChange={(e) => {
                  const normalized = normalizePhoneDigits(e.target.value);
                  mergeUserInfoFromDomAndPatch({ phone: normalized });
                }}
                onBlur={(e) => {
                  setTouched((p) => ({ ...p, phone: true }));
                  const normalized = normalizePhoneDigits(e.target.value);
                  mergeUserInfoFromDomAndPatch({ phone: normalized });
                }}
                inputProps={{
                  name: BOOKING_INPUT.phone,
                  autoComplete: "tel",
                  onInput: (e) => {
                    const normalized = normalizePhoneDigits(e.target.value);
                    mergeUserInfoFromDomAndPatch({ phone: normalized });
                  },
                }}
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
                onBlur={(e) => {
                  setTouched((p) => ({ ...p, email: true }));
                  const v = e.target.value.trim();
                  mergeUserInfoFromDomAndPatch({ email: v });
                }}
                inputProps={{
                  name: BOOKING_INPUT.email,
                  autoComplete: "email",
                  onInput: (e) => {
                    mergeUserInfoFromDomAndPatch({ email: e.target.value });
                  },
                }}
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
          </Box>
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