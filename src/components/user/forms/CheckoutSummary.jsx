"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  Grid,
  Button,
  Radio,
  FormControlLabel,
  RadioGroup,
  FormControl,
  TextField,
  Checkbox,
  Container,
  CircularProgress,
  Chip,
  Collapse,
  IconButton,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
} from "@mui/material"
import { Check, Close, ExpandMore, ExpandLess, Add, Remove } from "@mui/icons-material"
import { useGetQuoteDetailsQuery, useGetAddonsQuery, useAddAddonsMutation, useDeleteAddonsMutation, useDeclineQuoteMutation } from "../../../store/api/user/quoteApi"
import { useRef } from "react"
import SignatureCanvas from "react-signature-canvas"
import { useNavigate } from "react-router-dom"
import DisclaimerBox from "../DisclaimerBox"

export const CheckoutSummary = ({
  data,
  onUpdate,
  termsAccepted,
  setTermsAccepted,
  additionalNotes,
  setAdditionalNotes,
  handleSignatureEnd,
  setSignature,
  isStepComplete,
  handleNext,
  isBidInPerson,
  setIsBidInPerson
}) => {
  const [selectedPackages, setSelectedPackages] = useState({})
  const [expandedServices, setExpandedServices] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [isDeclineLoading, setIsDeclineLoading] = useState(false)

  const navigate = useNavigate();

  const {
    data: response,
    isLoading,
    isError,
  } = useGetQuoteDetailsQuery(data.submission_id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  useEffect(() => {
    if (response?.addons) {
      const addonIds = response.addons.map((addon) => addon.id);
      setSelectedAddons(addonIds);
    }
  }, [response]);
  
  const {
    data: addonsResponse,
    isLoading: addonsLoading,
    isError: addonsError,
  } = useGetAddonsQuery()

  console.log(addonsResponse, 'response', addonsError)

  const [addAddonsToSubmission] = useAddAddonsMutation()
  const [removeAddonFromSubmission] = useDeleteAddonsMutation()
  const [declineQuote] = useDeclineQuoteMutation()

  const sigCanvasRef = useRef(null);

  const quoteData = useMemo(() => response, [response])
  const addonsData = useMemo(() => addonsResponse || [], [addonsResponse])

  // Expand all services by default
  useEffect(() => {
    if (quoteData?.service_selections) {
      const initialExpanded = {}
      let bidInPerson = false

      quoteData.service_selections.forEach((service) => {
        initialExpanded[service.id] = true
        if (service.package_quotes.length === 0) {
          bidInPerson = true
        }
      })
      setExpandedServices(initialExpanded)
      setIsBidInPerson(bidInPerson)
    }
  }, [quoteData])

  useEffect(() => {
    if (quoteData && !isLoading && !data.quoteDetails) {
      onUpdate({
        quoteDetails: quoteData,
        pricing: {
          basePrice: Number.parseFloat(quoteData.total_base_price || 0),
          totalAdjustments: Number.parseFloat(quoteData.total_adjustments || 0),
          totalSurcharges: Number.parseFloat(quoteData.total_surcharges || 0),
          finalTotal: Number.parseFloat(quoteData.final_total || 0),
        },
      })
    }
  }, [quoteData, isLoading, data.quoteDetails, onUpdate])

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }))
  }

  const handlePackageSelect = (serviceSelectionId, packageQuote) => {
    const newSelected = {
      ...selectedPackages,
      [serviceSelectionId]: packageQuote.id,
    }

    setSelectedPackages(newSelected)

    const selectedPackagesArray = Object.entries(newSelected)
      .map(([serviceId, packageId]) => {
        const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId)
        const packageDetails = serviceSelection?.package_quotes.find((p) => p.id === packageId)
        if (packageDetails && serviceSelection) {
          return {
            service_selection_id: serviceId,
            package_id: packageDetails.package,
            package_name: packageDetails.package_name,
            total_price: packageDetails.total_price,
          }
        }
        return null
      })
      .filter(Boolean)

    onUpdate({
      selectedPackages: selectedPackagesArray,
    })
  }

  const handleAddonToggle = async (addonId, isSelected) => {
    try {
      if (isSelected) {
        // Remove addon
        await removeAddonFromSubmission({
          submissionId: data.submission_id,
          addon_ids: [addonId]
        }).unwrap()
        setSelectedAddons(prev => prev.filter(id => id !== addonId))
      } else {
        // Add addon
        await addAddonsToSubmission({
          submissionId: data.submission_id,
          addon_ids: {addon_ids:[addonId]}
        }).unwrap()
        setSelectedAddons(prev => [...prev, addonId])
      }
    } catch (error) {
      console.error('Error toggling addon:', error)
    }
  }

  const handleDeclineClick = () => {
    setDeclineDialogOpen(true)
  }

  const handleDeclineConfirm = async () => {
    try {
      setIsDeclineLoading(true)
      await declineQuote({ submissionId: data.submission_id }).unwrap()
      
      // Redirect to details page after successful decline
      navigate(`/quote/details/${data.submission_id}`)
    } catch (error) {
      console.error('Error declining quote:', error)
      // You might want to show a toast/snackbar error message here
    } finally {
      setIsDeclineLoading(false)
      setDeclineDialogOpen(false)
    }
  }

  const handleDeclineCancel = () => {
    setDeclineDialogOpen(false)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
      </Box>
    )
  }

  if (isError || !quoteData) {
    return (
      <Box textAlign="center" p={4}>
        <Typography variant="h6" color="error" gutterBottom>
          Failed to load quote details
        </Typography>
        <Typography color="text.secondary">Please refresh and try again.</Typography>
      </Box>
    )
  }

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
  }

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case "yes_no":
      case "conditional":
        return response.yes_no_answer ? "Yes" : "No"
      case "multiple_yes_no":
        return (
          response.sub_question_responses
            .filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected"
        )
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ")
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ")
      default:
        return "N/A"
    }
  }

  const calculateTotalSelectedPrice = () => {
    let total = 0
    Object.entries(selectedPackages).forEach(([serviceId, packageId]) => {
      const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId)
      const packageDetails = serviceSelection?.package_quotes.find((p) => p.id === packageId)
      if (packageDetails) {
        total += Number.parseFloat(packageDetails.total_price || 0)
      }
    })
    return total
  }

  const calculateAddonsTotal = () => {
    return selectedAddons.reduce((total, addonId) => {
      const addon = addonsData.find(addon => addon.id === addonId)
      return total + (addon ? Number.parseFloat(addon.base_price || 0) : 0)
    }, 0)
  }

  const totalSelectedPrice = calculateTotalSelectedPrice()
  const addonsTotal = calculateAddonsTotal()
  const surchargeAmount = quoteData.quote_surcharge_applicable
    ? Number.parseFloat(quoteData.location_details?.trip_surcharge || 0)
    : 0
  const finalTotal = formatPrice(totalSelectedPrice + addonsTotal + surchargeAmount)

  return (
    <Box>
      <Container maxWidth="lg">
        {/* Quote Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight={300} sx={{ color: '#023c8f', textAlign: 'center' }}>
            Quote Summary
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="center">
            <Typography variant="body1" color="text.secondary">
              Quote #{quoteData.id}
            </Typography>
            <Chip
              label={quoteData.status.replace("_", " ").toUpperCase()}
              size="small"
              sx={{ bgcolor: "#d9edf7", color: "#023c8f", fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              {new Date(quoteData.created_at).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Customer Info */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1">{quoteData.first_name} {quoteData.last_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">{quoteData.customer_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">{quoteData.customer_phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  House sq ft
                </Typography>
                <Typography variant="body1">{quoteData?.size_range?.min_sqft} {quoteData?.size_range?.max_sqft===null? " sq ft And Up" : `- ${quoteData?.size_range?.max_sqft} sq ft`}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Property Type
                </Typography>
                <Typography variant="body1">{quoteData.property_type?.charAt(0).toUpperCase() + quoteData.property_type?.slice(1)}</Typography>
              </Grid>
              {quoteData.company_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1">{quoteData.company_name}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Floors
                </Typography>
                <Typography variant="body1">{quoteData.num_floors}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">{quoteData.street_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Postal Code
                </Typography>
                <Typography variant="body1">{quoteData.postal_code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  How did you hear about us?
                </Typography>
                <Typography variant="body1">{quoteData.heard_about_us?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Service Selections */}
        {quoteData.service_selections.map((selection) => (
          <Card key={selection.id} sx={{ mb: 1.5 }}>
              {/* Service Header */}
              <Box
                sx={{
                  px: 3,
                  py:0.5,
                  backgroundColor: '#023c8f',
                  color: 'white',
                  cursor: "pointer",
                  "&:hover": { bgcolor: "#012a6b" },
                }}
                onClick={() => toggleServiceExpansion(selection.id)}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'white' }}>
                      {selection.service_details.name}
                    </Typography>
                  </Box>
                  <IconButton sx={{ color: 'white' }}>
                    {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
              </Box>

              {/* Collapsible Content */}
              <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                <Box sx={{ px: 3, py:1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
                      {selection.service_details.description}
                    </Typography>
                  
                  {(selection.service_details.service_settings?.general_disclaimer || 
                    selection.service_details.service_settings?.bid_in_person_disclaimer) && (
                    <Box>
                      {!isBidInPerson ?
                        selection.service_details.service_settings?.general_disclaimer && (
                          <DisclaimerBox 
                            title="Disclaimer"
                            content={selection.service_details.service_settings.general_disclaimer}
                            bgColor="#f5f5f5"
                            textColor="#333"
                            borderColor="#ddd"
                          />
                        ) :
                        selection.service_details.service_settings?.bid_in_person_disclaimer && (
                          <DisclaimerBox 
                            title="Notice"
                            content={selection.service_details.service_settings.bid_in_person_disclaimer}
                            bgColor="#fffbf0"
                            textColor="#8a6d3b"
                            borderColor="#f0ad4e"
                          />
                        )
                      }
                    </Box>
                  )}
                  {/* Package Selection */}
                  {!isBidInPerson&&
                  <>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                      Select Package
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <RadioGroup
                        value={selectedPackages[selection.id] || ""}
                        onChange={(e) => {
                          const packageQuote = selection.package_quotes.find((p) => p.id === e.target.value)
                          if (packageQuote) {
                            handlePackageSelect(selection.id, packageQuote)
                          }
                        }}
                      >
                        <Grid container spacing={3}>
                          {selection.package_quotes.map((packageQuote) => (
                            <Grid item xs={12} md={6} key={packageQuote.id}>
                              <Card
                                variant="outlined"
                                sx={{
                                  cursor: "pointer",
                                  border:
                                    selectedPackages[selection.id] === packageQuote.id
                                      ? "2px solid #42bd3f"
                                      : "1px solid #e0e0e0",
                                  bgcolor: selectedPackages[selection.id] === packageQuote.id ? "#f8fff8" : "white",
                                  "&:hover": { borderColor: "#42bd3f" },
                                  borderRadius: 3,
                                  minHeight: 220,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                                onClick={() => handlePackageSelect(selection.id, packageQuote)}
                              >
                                <CardContent sx={{ p: 4 }}>
                                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Typography variant="h6" fontWeight={700}>
                                      {packageQuote.package_name}
                                    </Typography>
                                    <FormControlLabel
                                      value={packageQuote.id}
                                      control={
                                        <Radio
                                          sx={{
                                            color: "#42bd3f",
                                            "&.Mui-checked": { color: "#42bd3f" },
                                          }}
                                        />
                                      }
                                      label=""
                                      sx={{ m: 0 }}
                                    />
                                  </Box>

                                  <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                    ${formatPrice(packageQuote.total_price)}
                                  </Typography>

                                  {/* ✅ Professional Features List */}
                                  <Box>
                                    {[
                                      ...(packageQuote.included_features_details || []).map((f) => ({
                                        ...f,
                                        included: true,
                                      })),
                                      ...(packageQuote.excluded_features_details || []).map((f) => ({
                                        ...f,
                                        included: false,
                                      })),
                                    ].map((feature) => (
                                      <Box key={feature.id} display="flex" alignItems="center" mb={0.8}>
                                        {feature.included ? (
                                          <Check sx={{ fontSize: 18, color: "#42bd3f", mr: 1 }} />
                                        ) : (
                                          <Close sx={{ fontSize: 18, color: "#9e9e9e", mr: 1 }} />
                                        )}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            color: feature.included ? "text.primary" : "text.disabled",
                                            fontWeight: feature.included ? 500 : 400,
                                          }}
                                        >
                                          {feature.name}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </RadioGroup>
                    </FormControl>
                  </>
                  }
                  {/* Question Responses */}
                  {selection.question_responses?.length > 0 && (
                    <Box mt={3}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        sx={{ color: "#023c8f", mb: 1 }}
                      >
                        Your Responses
                      </Typography>

                      <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
                        {selection.question_responses.map((response, index) => (
                          <Box
                            key={response.id}
                            component="li"
                            sx={{ mb: 0.1, display: "flex", alignItems: "flex-start" }}
                          >
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              sx={{ minWidth: "24px", color: "#023c8f", mr: 1 }}
                            >
                              {index + 1}.
                            </Typography>
                            <Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ color: "#023c8f" }}
                              >
                                {response.question_text}:
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ color: "#023c8f", textAlign: "right", ml: 2 }}
                              >
                                {renderQuestionResponse(response)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Collapse>
          </Card>
        ))}

        {/* Add-ons Section */}
        {!addonsLoading && !addonsError && addonsData.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                Add-Ons
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enhance your service with these additional options
              </Typography>
              <Grid container spacing={2}>
                {addonsData.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.id)
                  return (
                    <Grid item xs={12} sm={6} md={4} key={addon.id}>
                      <Card
                        variant="outlined"
                        sx={{
                          cursor: "pointer",
                          border: isSelected ? "2px solid #42bd3f" : "1px solid #e0e0e0",
                          bgcolor: isSelected ? "#f8fff8" : "white",
                          "&:hover": { borderColor: "#42bd3f" },
                          borderRadius: 2,
                          height: "100%",
                        }}
                        onClick={() => handleAddonToggle(addon.id, isSelected)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
                            <Typography variant="h6" fontWeight={600}>
                              {addon.name}
                            </Typography>
                            <IconButton
                              size="small"
                              sx={{
                                color: isSelected ? "#42bd3f" : "#9e9e9e",
                                bgcolor: isSelected ? "#f8fff8" : "transparent",
                                border: isSelected ? "2px solid #42bd3f" : "2px solid #e0e0e0",
                                "&:hover": {
                                  bgcolor: isSelected ? "#f0fff0" : "#f5f5f5",
                                },
                              }}
                            >
                              {isSelected ? <Remove /> : <Add />}
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {addon.description}
                          </Typography>
                          <Typography variant="h6" sx={{ color: "#42bd3f", fontWeight: 700 }}>
                            ${formatPrice(addon.base_price)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Additional Notes */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Additional Notes
            </Typography>
            <TextField
              placeholder="Any special requests or notes..."
              multiline
              rows={3}
              fullWidth
              value={additionalNotes}
              onChange={(e) => {
                setAdditionalNotes(e.target.value)
                onUpdate({ additionalNotes: e.target.value, termsAccepted })
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#023c8f',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#023c8f',
                  },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
              Order Summary
            </Typography>

            {Object.keys(selectedPackages).length > 0 ? (
              <Box mb={2}>
                {Object.entries(selectedPackages).map(([serviceId, packageId]) => {
                  const serviceSelection = quoteData?.service_selections.find((s) => s.id === serviceId)
                  const pkg = serviceSelection?.package_quotes.find((p) => p.id === packageId)
                  if (pkg && serviceSelection) {
                    return (
                      <Box key={serviceId} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {pkg.package_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {serviceSelection.service_details.name}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={600}>
                            ${formatPrice(pkg.total_price)}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  }
                  return null
                })}
              </Box>
            ) : !isBidInPerson && (
              <Box mb={2} p={2} sx={{ bgcolor: "#d9edf7", borderRadius: 1, textAlign: "center" }}>
                <Typography variant="body2" sx={{ color: '#023c8f' }}>
                  Please select a package above
                </Typography>
              </Box>
            )}

            {/* Add-ons in Summary */}
            {selectedAddons.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#023c8f', mb: 1 }}>
                  Add-ons
                </Typography>
                {selectedAddons.map((addonId) => {
                  const addon = addonsData.find(a => a.id === addonId)
                  if (addon) {
                    return (
                      <Box key={addon.id} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {addon.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Add-on service
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={600}>
                            ${formatPrice(addon.base_price)}
                          </Typography>
                        </Box>
                      </Box>
                    )
                  }
                  return null
                })}
              </Box>
            )}

            {/* {surchargeAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Trip Surcharge</Typography>
                <Typography variant="body2">${formatPrice(surchargeAmount)}</Typography>
              </Box>
            )} */}

            <Divider sx={{ my: 2 }} />

            {/* {!isBidInPerson&& */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Typography variant="h6" fontWeight={700} color="success.main">
                  ${finalTotal}
                </Typography>
              </Box>
            {/* } */}

            {/* Signature Section */}
            {!isBidInPerson&&
              <Box sx={{ mb: 3, maxWidth: { xs: '100%', sm: '400px' } }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#023c8f', fontWeight: 600 }}>
                  Signature
                </Typography>
                <Box
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: 'white',
                    width: '100%',
                    height: { xs: 160, sm: 120 },
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'crosshair',
                    '&:hover': {
                      borderColor: '#023c8f',
                    },
                  }}
                >
                  <Box sx={{ width: "100%", height: "100%" }}>
                    <SignatureCanvas
                      ref={sigCanvasRef}
                      penColor="black"
                      canvasProps={{
                        className: "w-full h-full",
                      }}
                      onEnd={()=>{handleSignatureEnd(sigCanvasRef)}}
                    />
                  </Box>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      color: '#023c8f',
                      borderColor: '#023c8f',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                        borderColor: '#023c8f',
                      },
                    }}
                    onClick={() => {
                      sigCanvasRef.current.clear();
                      setSignature('');
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </Box>
            }

            <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={2} alignItems={{ sm: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked)
                      onUpdate({ additionalNotes, termsAccepted: e.target.checked })
                    }}
                    sx={{ 
                      color: '#e1e1e1', 
                      '&.Mui-checked': { color: '#023c8f' } 
                    }}
                  />
                }
                label={<Typography variant="body2">I agree to the Terms & Conditions</Typography>}
                sx={{ flex: 1 }}
              />

              <Box display="flex" gap={2} sx={{ minWidth: { xs: "100%", sm: "auto" } }}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={handleDeclineClick}
                  sx={{
                    color: "#d32f2f",
                    borderColor: "#d32f2f",
                    "&:hover": {
                      bgcolor: "#ffeaea",
                      borderColor: "#d32f2f",
                    },
                    fontWeight: 600,
                    minWidth: { xs: "48%", sm: "120px" },
                  }}
                >
                  Decline
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  disabled={!isStepComplete(3)}
                  sx={{
                    bgcolor: "#42bd3f",
                    "&:hover": { bgcolor: "#369932" },
                    "&:disabled": { bgcolor: "#e0e0e0" },
                    fontWeight: 600,
                    minWidth: { xs: "48%", sm: "120px" },
                  }}
                  onClick={handleNext}
                >
                  Accept Quote
                </Button>
              </Box>
            </Box>

            {isBidInPerson &&
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
                Final price confirmed after service completion
              </Typography>
            }
          </CardContent>
        </Card>
      </Container>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onClose={handleDeclineCancel} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#023c8f", fontWeight: 600 }}>Decline Quote</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to decline this quote? This action cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You will be redirected to the quote details page after declining.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={handleDeclineCancel}
            variant="outlined"
            sx={{
              color: "#023c8f",
              borderColor: "#023c8f",
              "&:hover": {
                backgroundColor: "#f5f5f5",
                borderColor: "#023c8f",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeclineConfirm}
            variant="contained"
            disabled={isDeclineLoading}
            sx={{
              bgcolor: "#d32f2f",
              "&:hover": { bgcolor: "#b71c1c" },
              "&:disabled": { bgcolor: "#e0e0e0" },
            }}
          >
            {isDeclineLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: "white" }} />
                Declining...
              </>
            ) : (
              "Decline Quote"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default CheckoutSummary