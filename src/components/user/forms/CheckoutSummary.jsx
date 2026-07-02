"use client"

import { useEffect, useState, useMemo, useRef } from "react"
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
  Stack,
} from "@mui/material"
import { Check, Close, ExpandMore, ExpandLess, Add, Remove } from "@mui/icons-material"
import { useGetQuoteDetailsQuery, useGetAddonsQuery, useAddAddonsMutation, useDeleteAddonsMutation, useDeclineQuoteMutation, useApplyCouponMutation, useRemoveCouponMutation, useGetGlobalCouponsQuery, useSyncAvailableBundlesMutation, useApplyBundleMutation, useRemoveBundleMutation } from "../../../store/api/user/quoteApi"
import SignatureCanvas from "react-signature-canvas"
import { useNavigate } from "react-router-dom"
import DisclaimerBox from "../DisclaimerBox"
import { Swiper, SwiperSlide } from 'swiper/react';
import { FreeMode, Navigation, Pagination, Virtual } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/free-mode';
import 'swiper/css/pagination';

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
  setIsBidInPerson,
  admin,
  signature,
}) => {
  const [selectedPackages, setSelectedPackages] = useState({})
  const [expandedServices, setExpandedServices] = useState({})
  const [selectedAddons, setSelectedAddons] = useState([])
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [isDeclineLoading, setIsDeclineLoading] = useState(false)

  const [addonQuantities, setAddonQuantities] = useState({})
  const [addonError, setAddonError] = useState('')

  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [appliedCouponId, setAppliedCouponId] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false)
  const [isRemovingCoupon, setIsRemovingCoupon] = useState(false)

  const [bundleError, setBundleError] = useState('')
  const [isApplyingBundle, setIsApplyingBundle] = useState(false)
  const [isRemovingBundle, setIsRemovingBundle] = useState(false)
  const [applyingBundleId, setApplyingBundleId] = useState(null)
  const [bundlePreview, setBundlePreview] = useState(null)
  const [isLoadingBundles, setIsLoadingBundles] = useState(false)
  const bundlesSyncKeyRef = useRef('')

  const navigate = useNavigate();

  const [applyCoupon] = useApplyCouponMutation()
  const [removeCoupon] = useRemoveCouponMutation()
  const [syncAvailableBundles] = useSyncAvailableBundlesMutation()
  const [applyBundle] = useApplyBundleMutation()
  const [removeBundle] = useRemoveBundleMutation()

  const {
    data: response,
    isLoading,
    isError,
    refetch: refetchQuoteDetails,
  } = useGetQuoteDetailsQuery(data.submission_id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  })

  const { data: globalCoupons, isLoading: isLoadingCoupons } = useGetGlobalCouponsQuery();

  useEffect(() => {
    if (response?.addons) {
      const addonIds = response.addons.map((addon) => addon.addon);
      setSelectedAddons(addonIds);
      const quantities = {};
      response.addons.forEach((addon) => {
        quantities[addon.addon] = addon.quantity || 1;
      });
      setAddonQuantities(quantities);
    }

  }, [response]);

  const quoteData = useMemo(() => response, [response])

  const isQuoteApproved = quoteData?.status === 'approved'

  const buildSelectedPackagesPayload = useMemo(() => {
    if (!quoteData?.service_selections?.length) return null
    const entries = quoteData.service_selections
      .map((s) => {
        const packageQuoteId = selectedPackages[s.id]
        if (!packageQuoteId) return null
        const pkg = s.package_quotes?.find((p) => p.id === packageQuoteId)
        if (!pkg) return null
        return {
          service_selection_id: s.id,
          package_id: pkg.package,
        }
      })
      .filter(Boolean)
    if (entries.length !== quoteData.service_selections.length) return null
    return entries
  }, [quoteData?.service_selections, selectedPackages])

  const allPackagesSelectedLocally = buildSelectedPackagesPayload !== null

  const syncBundlesPreview = async (payload) => {
    const result = await syncAvailableBundles({
      submissionId: data.submission_id,
      selected_packages: payload,
    }).unwrap()
    setBundlePreview(result)
    await refetchQuoteDetails()
    return result
  }

  // Review step: POST available-bundles once all packages are picked (saves packages + returns previews)
  useEffect(() => {
    if (!data.submission_id || !quoteData || isQuoteApproved) return

    if (!buildSelectedPackagesPayload) {
      setBundlePreview(null)
      bundlesSyncKeyRef.current = ''
      return
    }

    const syncKey = JSON.stringify(buildSelectedPackagesPayload)
    if (syncKey === bundlesSyncKeyRef.current) return

    let cancelled = false
    const runSync = async () => {
      setIsLoadingBundles(true)
      try {
        await syncBundlesPreview(buildSelectedPackagesPayload)
        if (!cancelled) bundlesSyncKeyRef.current = syncKey
      } catch (error) {
        console.error('Failed to sync bundles preview:', error)
        if (!cancelled) {
          setBundlePreview(null)
          bundlesSyncKeyRef.current = ''
        }
      } finally {
        if (!cancelled) setIsLoadingBundles(false)
      }
    }

    runSync()
    return () => {
      cancelled = true
    }
  }, [buildSelectedPackagesPayload, data.submission_id, quoteData, isQuoteApproved])

  const serviceIdsKey = useMemo(
    () => quoteData?.service_selections
      ?.map((s) => s.service_details?.id)
      .filter(Boolean)
      .sort()
      .join(',') ?? '',
    [quoteData?.service_selections]
  )

  const {
    data: addonsResponse,
    isLoading: addonsLoading,
    isError: addonsError,
    refetch: refetchAddons,
  } = useGetAddonsQuery(
    { submission_id: data.submission_id },
    {
      skip: !data.submission_id,
      refetchOnMountOrArgChange: true,
    }
  )

  useEffect(() => {
    if (data.submission_id && serviceIdsKey) {
      refetchAddons()
    }
  }, [data.submission_id, serviceIdsKey, refetchAddons])

  const [addAddonsToSubmission] = useAddAddonsMutation()
  const [removeAddonFromSubmission] = useDeleteAddonsMutation()
  const [declineQuote] = useDeclineQuoteMutation()

  const sigCanvasRef = useRef(null);

  const addonsData = useMemo(() => addonsResponse || [], [addonsResponse])

  const getAddonErrorMessage = (error) =>
    error?.data?.error || 'Failed to update add-on. Please try again.'

  const getAddonInfo = (addonId) => {
    const catalogAddon = addonsData.find((a) => a.id === addonId)
    if (catalogAddon) return catalogAddon

    const submissionAddon = response?.addons?.find((a) => a.addon === addonId)
    if (submissionAddon) {
      return {
        id: addonId,
        name: submissionAddon.addon_name,
        base_price: submissionAddon.addon_price,
      }
    }
    return null
  }

  // Expand all services by default
  useEffect(() => {
    if (quoteData?.service_selections) {
      const allExpanded = {};
      quoteData.service_selections.forEach((s) => {
        allExpanded[s.id] = true;
      });
      setExpandedServices(allExpanded);
    }
  }, [quoteData]);

  // Hydrate package selections from server
  useEffect(() => {
    if (!quoteData?.service_selections) return
    const fromServer = {}
    quoteData.service_selections.forEach((s) => {
      const selected = s.package_quotes?.find((p) => p.is_selected)
      if (selected) {
        fromServer[s.id] = selected.id
      }
    })
    if (Object.keys(fromServer).length === 0) return

    setSelectedPackages((prev) => {
      const same = Object.keys(fromServer).every((k) => prev[k] === fromServer[k])
        && Object.keys(prev).length === Object.keys(fromServer).length
      if (same) return prev
      return { ...fromServer, ...prev }
    })
  }, [quoteData?.service_selections])

  useEffect(() => {
      setIsBidInPerson(quoteData?.is_bid_in_person)
      if (quoteData?.is_coupon_applied && quoteData?.applied_coupon) {
        setAppliedCoupon({
          code: quoteData.applied_coupon.code,
          discount: quoteData.discounted_amount,
        })
        if (quoteData.applied_coupon.id) {
          setAppliedCouponId(quoteData.applied_coupon.id)
        }
      } else if (quoteData && !quoteData.is_coupon_applied) {
        setAppliedCoupon(null)
        setAppliedCouponId(null)
      }
  }, [quoteData])

  useEffect(() => {
    const couponId =
      (quoteData?.is_coupon_applied && quoteData?.applied_coupon?.id) ||
      appliedCouponId ||
      null
    onUpdate({ coupon_id: couponId })
  }, [quoteData?.is_coupon_applied, quoteData?.applied_coupon?.id, appliedCouponId, onUpdate])

  useEffect(() => {
    if (quoteData && !isLoading) {
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
  }, [quoteData, isLoading, onUpdate])

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
            effective_total_price: packageDetails.effective_total_price,
          }
        }
        return null
      })
      .filter(Boolean)

    onUpdate({
      selectedPackages: selectedPackagesArray,
    })
  }

  const handleAddonQuantityChange = async (addonId, newQuantity) => {
    try {
      setAddonError('')
      setAddonQuantities(prev => ({
        ...prev,
        [addonId]: newQuantity
      }));
      await addAddonsToSubmission({
        submissionId: data.submission_id,
        addons: [
          {
            addon_id: addonId,
            quantity: newQuantity
          }
        ]
      }).unwrap()
    } catch (error) {
      console.error('Error updating addon quantity:', error)
      setAddonError(getAddonErrorMessage(error))
      setAddonQuantities(prev => ({
      ...prev,
      [addonId]: addonQuantities[addonId] || 1
    }));
    }
  }

  const handleAddonToggle = async (addonId, isSelected) => {
    try {
      setAddonError('')
      if (isSelected) {
        await removeAddonFromSubmission({
          submissionId: data.submission_id,
          addon_ids: [addonId]
        }).unwrap()
        setSelectedAddons(prev => prev.filter(id => id !== addonId))
        setAddonQuantities(prev => {
          const newQuantities = { ...prev };
          delete newQuantities[addonId];
          return newQuantities;
        });
      } else {
        await addAddonsToSubmission({
          submissionId: data.submission_id,
          addons: [
            {
              addon_id: addonId,
              quantity: 1
            }
          ]
        }).unwrap()
        setSelectedAddons(prev => [...prev, addonId])
        setAddonQuantities(prev => ({
          ...prev,
          [addonId]: 1
        }));
      }
    } catch (error) {
      console.error('Error toggling addon:', error)
      setAddonError(getAddonErrorMessage(error))
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

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    setCouponError('')
    setIsApplyingCoupon(true)
    
    try {
      const result = await applyCoupon({
        submission_id: data.submission_id,
        code: couponCode.trim(),
      }).unwrap()
      
      if (result) {
        const discount = parseFloat(result?.discounted_amount || 0)
        const couponId =
          result?.coupon?.id ||
          result?.applied_coupon?.id ||
          result?.coupon_id ||
          null
        setAppliedCoupon({
          code: couponCode.trim().toUpperCase(),
          discount: discount || 0,
        })
        const refreshed = await refetchQuoteDetails()
        const idFromQuote = refreshed?.data?.applied_coupon?.id
        const resolvedCouponId = couponId || idFromQuote || null
        setAppliedCouponId(resolvedCouponId)
        onUpdate({ coupon_id: resolvedCouponId })
        setCouponCode('')
      } else {
        setCouponError(result.message || 'Invalid coupon code')
      }
    } catch (error) {
      setCouponError(error?.data?.error || error?.data?.code?.[0] || 'Failed to apply coupon. Please try again.')
      console.error('Error applying coupon:', error)
    } finally {
      setIsApplyingCoupon(false)
    }
  }

  const handleRemoveCoupon = async () => {
    setCouponError('')
    setIsRemovingCoupon(true)

    try {
      await removeCoupon({
        submission_id: data.submission_id,
      }).unwrap()

      await refetchQuoteDetails()

      setAppliedCoupon(null)
      setCouponCode('')
      setAppliedCouponId(null)
      onUpdate({ coupon_id: null })
    } catch (error) {
      setCouponError(error?.data?.error || error?.data?.detail || 'Failed to remove coupon. Please try again.')
      console.error('Error removing coupon:', error)
    } finally {
      setIsRemovingCoupon(false)
    }
  }

  const formatBundleDiscountBadge = (bundle) => {
    if (bundle.discount_percentage) {
      return `Save ${Number.parseFloat(bundle.discount_percentage)}%`
    }
    if (bundle.discount_type === 'percent' && bundle.discount_percentage) {
      return `${Number.parseFloat(bundle.discount_percentage)}% off`
    }
    if (bundle.discount_fixed) {
      return `$${formatPrice(bundle.discount_fixed)} off`
    }
    return 'Save'
  }

  const getBundleId = (bundle) => bundle.bundle_id || bundle.id

  const handleApplyBundle = async (bundle) => {
    if (isQuoteApproved) return
    const bundleId = getBundleId(bundle)
    setBundleError('')
    setIsApplyingBundle(true)
    setApplyingBundleId(bundleId)
    try {
      await applyBundle({
        submissionId: data.submission_id,
        bundle_id: bundleId,
      }).unwrap()
      await refetchQuoteDetails()
      if (buildSelectedPackagesPayload) {
        bundlesSyncKeyRef.current = ''
        await syncBundlesPreview(buildSelectedPackagesPayload)
        bundlesSyncKeyRef.current = JSON.stringify(buildSelectedPackagesPayload)
      }
    } catch (error) {
      setBundleError(error?.data?.error || error?.data?.detail || 'Failed to apply bundle. Please try again.')
      console.error('Error applying bundle:', error)
    } finally {
      setIsApplyingBundle(false)
      setApplyingBundleId(null)
    }
  }

  const handleRemoveBundle = async () => {
    if (isQuoteApproved) return
    setBundleError('')
    setIsRemovingBundle(true)
    try {
      await removeBundle(data.submission_id).unwrap()
      await refetchQuoteDetails()
      bundlesSyncKeyRef.current = ''
      if (buildSelectedPackagesPayload) {
        await syncBundlesPreview(buildSelectedPackagesPayload)
        bundlesSyncKeyRef.current = JSON.stringify(buildSelectedPackagesPayload)
      }
    } catch (error) {
      setBundleError(error?.data?.error || error?.data?.detail || 'Failed to remove bundle. Please try again.')
      console.error('Error removing bundle:', error)
    } finally {
      setIsRemovingBundle(false)
    }
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
      case "multiple_yes_no": {
        const subs = response.sub_question_responses
        if (!subs?.length) return "N/A"
        return (
          <Box sx={{ mt: 0.5 }}>
            {subs.map((sub, idx) => (
              <Box
                key={sub.id ?? idx}
                sx={{
                  mb: idx < subs.length - 1 ? 0.75 : 0,
                  pl: 1,
                  borderLeft: "3px solid #023c8f",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "#023c8f",
                    fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" },
                  }}
                >
                  {sub.sub_question_text}
                  <Box component="span" sx={{ fontWeight: 700, ml: 0.75 }}>
                    {sub.answer ? "Yes" : "No"}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Box>
        )
      }
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ")
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ")
      case "measurement":
      return (
        <Box sx={{ mt: 0.5 }}>
          {response.measurement_responses.map((measurement, idx) => (
            <Box 
              key={measurement.id} 
              sx={{ 
                mb: idx < response.measurement_responses.length - 1 ? 1 : 0,
                pl: 1,
                borderLeft: "3px solid #023c8f"
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#023c8f", fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.95rem" } }}>
                {measurement.option_text}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mt: 0.5 }}>
                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                  Length: <strong>{measurement.length}</strong>
                </Typography>
                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                  Width: <strong>{measurement.width}</strong>
                </Typography>
                <Typography variant="caption" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem", md: "0.85rem" } }}>
                  Quantity: <strong>{measurement.quantity}</strong>
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      )
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
        total += Number.parseFloat(packageDetails.effective_total_price || 0)
      }
    })
    return total
  }

  const calculateAddonsTotal = () => {
    return selectedAddons.reduce((total, addonId) => {
      const addon = getAddonInfo(addonId)
      const quantity = addonQuantities[addonId] || 1
      return total + (addon ? Number.parseFloat(addon.base_price || 0) * quantity : 0)
    }, 0)
  }

  const calculateCouponDiscount = (subtotal, appliedCoupon) => {
    if (!appliedCoupon) return 0;
    
    const discountValue = Number.parseFloat(appliedCoupon.discount || 0);
    
    if (appliedCoupon.type === "percent") {
      return (subtotal * discountValue) / 100;
    }
    
    // flat discount
    return discountValue;
  };


  const totalSelectedPrice = Number.parseFloat(calculateTotalSelectedPrice()) || 0
  const addonsTotal = Number.parseFloat(calculateAddonsTotal()) || 0
  const surchargeAmount = quoteData.quote_surcharge_applicable
    ? Number.parseFloat(quoteData.location_details?.trip_surcharge || 0)
    : 0
  const couponDiscount = quoteData?.is_coupon_applied
    ? Number.parseFloat(quoteData.discounted_amount || 0)
    : Number.parseFloat(appliedCoupon?.discount || 0)
  const subtotal = totalSelectedPrice + addonsTotal
  const couponAmount = quoteData?.is_coupon_applied
    ? couponDiscount
    : calculateCouponDiscount(subtotal, appliedCoupon)
  const bundleDiscountAmount = Number.parseFloat(quoteData?.bundle_discount_amount || 0)
  const displayBundles = bundlePreview?.available_bundles || []
  const appliedBundleId =
    bundlePreview?.applied_bundle_id ||
    quoteData?.applied_bundle?.id ||
    displayBundles.find((b) => b.is_applied)?.bundle_id ||
    null
  const isBundleApplied = Boolean(
    bundlePreview?.is_bundle_applied || quoteData?.is_bundle_applied
  )
  const finalTotal = formatPrice(quoteData?.final_total ?? Math.max(0, subtotal - couponAmount))

  const showBundleLoading =
    allPackagesSelectedLocally &&
    !isQuoteApproved &&
    isLoadingBundles
  const showBundleList =
    bundlePreview?.pricing_ready &&
    displayBundles.length > 0 &&
    !isQuoteApproved
  const showBundlesSection =
    !isQuoteApproved &&
    (isBundleApplied ||
      displayBundles.length > 0 ||
      showBundleLoading)

  return (
    <Box>
      <Container maxWidth="lg" sx={{p:"0rem"}}>
        {/* Quote Header */}
        <Box mb={4}>
          <Typography variant="h4" gutterBottom fontWeight={300} sx={{ color: '#023c8f', textAlign: 'center', fontSize:{ xs: "1.8rem", sm: "1.9rem", md: "2.2rem"} }}>
            Quote Summary
          </Typography>
          {!admin&&
            <Box display="flex" gap={2} flexWrap="wrap" alignItems="center" justifyContent="center">
              <Typography variant="body1" color="text.secondary" sx={{fontSize:{ xs: "0.8rem", sm: "0.9rem", md: "1rem"}}}>
                Quote #{quoteData.id}
              </Typography>
              <Chip
                label={quoteData.status.replace("_", " ").toUpperCase()}
                size="small"
                sx={{ bgcolor: "#d9edf7", color: "#023c8f", fontWeight: 600, fontSize:{ xs: "0.7rem", sm: "0.8rem", md: "0.8rem"} }}
              />
              <Typography variant="body2" color="text.secondary">
                {new Date(quoteData.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          }
        </Box>

        {response?.bid_notes_public && (
          <Card sx={{ mb: 2, borderRadius:1}}>
            <Box sx={{ p: 3, py: 2, bgcolor: '#fffbf0' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#d97706",
                      fontSize: { xs: "1rem", sm: "1.2rem", md: "1.5rem" },
                    }}
                  >
                    Important Instructions
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#92400e",
                      fontSize: { xs: "0.7rem", sm: "0.75rem" },
                      fontWeight: 500,
                    }}
                  >
                    Please review these notes carefully
                  </Typography>
                </Box>
              </Stack>
            </Box>
            <CardContent sx={{ p: 3, bgcolor: '#ffffff' }}>
              <Box>
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: "pre-wrap",
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    color: "text.primary",
                    lineHeight: 1.7,
                  }}
                >
                  {response?.bid_notes_public}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Customer Info */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ px: {xs:2, md:3}, py: 0.5 }}>
            <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f', fontSize:{ xs: "1rem", sm: "1.2rem", md: "1.5rem"} }}>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.first_name} {quoteData.last_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.customer_email}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.customer_phone}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  House sq ft
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData?.size_range?.min_sqft} {quoteData?.size_range?.max_sqft===null? " sq ft And Up" : `- ${quoteData?.size_range?.max_sqft} sq ft`}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Property Type
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.property_type?.charAt(0).toUpperCase() + quoteData.property_type?.slice(1)}</Typography>
              </Grid>
              {quoteData.company_name && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.company_name}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Floors
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.num_floors}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.street_address}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Postal Code
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.postal_code}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  How did you hear about us?
                </Typography>
                <Typography variant="body1" sx={{fontSize:{ xs: ".8rem", sm: "1rem"}}}>{quoteData.heard_about_us?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</Typography>
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
                <Box display="flex" alignItems="center" justifyContent="space-between"
                  sx={{
                    minHeight: { xs: 44, sm: 36 },
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: 'white', fontSize:{ xs: "1rem", sm: "1.2rem", md: "1.5rem"},flex: 1,
                        whiteSpace: "normal",
                        wordBreak: "break-word"
                      }}
                    >
                      {selection.service_details.name}
                    </Typography>
                  </Box>
                  <IconButton sx={{ color: 'white', padding:0 }}>
                    {expandedServices[selection.id] ? <ExpandLess sx={{fontSize: { xs: "1.125rem", sm: "1.5rem", lg: "1.625rem" }}}/> : <ExpandMore sx={{fontSize: { xs: "1.125rem", sm: "1.5rem", lg: "1.625rem" }}}/>}
                  </IconButton>
                </Box>
              </Box>

              {/* Collapsible Content */}
              <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                <Box sx={{ px: {xs:1.5, md:3}, py: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: { xs: "0.75rem", sm: "0.875rem", md:'1rem' } }}>
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
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f', fontSize:{ xs: "1.2rem", sm: "1.5rem", md: "1.6rem"} }}>
                      Select Package
                    </Typography>
                    <FormControl component="fieldset" fullWidth>
                      <Box
                        value={selectedPackages[selection.id] || ""}
                        onChange={(e) => {
                          const packageQuote = selection.package_quotes.find((p) => p.id === e.target.value);
                          if (packageQuote) {
                            handlePackageSelect(selection.id, packageQuote);
                          }
                        }}
                      >
                        <Swiper 
                          modules={[FreeMode, Pagination]} 
                          spaceBetween={10} 
                          slidesPerView={"auto"}
                          pagination={{
                            clickable: true,
                          }} 
                          freeMode={true}
                          style={{ margin:0 }}
                          breakpoints={{
                            768: {
                              spaceBetween: 20,
                            },
                          }}
                        >
                          {selection.package_quotes.map((packageQuote) => (
                            <SwiperSlide key={packageQuote.id} style={{ width: "auto" }}>
                              <Card
                                variant="outlined"
                                sx={{
                                  cursor: "pointer",
                                  border:
                                    selectedPackages[selection.id] === packageQuote.id
                                      ? "2px solid #42bd3f"
                                      : "1px solid #e0e0e0",
                                  // bgcolor: selectedPackages[selection.id] === packageQuote.id ? "#f8fff8" : "white",
                                  "&:hover": { borderColor: "#42bd3f" },
                                  borderRadius: 3,
                                  height:"100%",
                                  width: "fit-content", // responsive height
                                  flexShrink: 0,    
                                  maxWidth: 280,
                                  minWidth: 310,
                                  minHeight: { xs: 180, sm: 200, md: 220 }, // responsive height
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CardContent sx={{ p: { xs: 2, sm: 3, md: 3 },textAlign: "center", }}>
                                    <Typography
                                      variant="h6"
                                      fontWeight={700}
                                      sx={{ fontSize: { xs: "1.6rem", sm: "1.8rem", md: "2rem" }, justifySelf: "start" }}
                                    >
                                      {packageQuote.package_name}
                                    </Typography>
                                    {/* <FormControlLabel
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
                                    /> */}

                                  <Typography 
                                    variant="h4"
                                    sx={{
                                      justifySelf: "start",
                                      color: "#42bd3f",
                                      fontWeight: 700,
                                      fontSize: { xs: "1.6rem", sm: "1.8rem", md: "2rem" },
                                      mb:2
                                    }}
                                  >
                                    ${formatPrice(packageQuote.effective_total_price)}
                                  </Typography>

                                  <Typography 
                                    variant="body2"
                                    sx={{
                                      justifySelf: "start",
                                      color: "text.secondary",  // or a specific gray color like "#666"
                                      fontSize: { xs: "0.875rem", sm: "0.9rem", md: "1rem" },
                                      mb: 2
                                    }}
                                  >
                                    Plus tax
                                  </Typography>

                                  {/* ✅ Professional Features List */}
                                  <Box textAlign="left" 
                                    sx={{ 
                                      // maxHeight: 300, 
                                      overflowY: "auto", 
                                      pb:2,
                                      // "&::-webkit-scrollbar": {
                                      //   width: 4
                                      // },
                                      // "&::-webkit-scrollbar-track": {
                                      //   background: "#f1f1f1",
                                      //   borderRadius: 3
                                      // },
                                      // "&::-webkit-scrollbar-thumb": {
                                      //   background: "#c1c1c1",
                                      //   borderRadius: 3,
                                      //   "&:hover": {
                                      //     background: "#a8a8a8"
                                      //   }
                                      // }
                                    }}
                                  >
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
                                          <Check sx={{ fontSize: { xs: 16, sm: 18 }, color: "#42bd3f", mr: 1 }} />
                                        ) : (
                                          <Close sx={{ fontSize: { xs: 16, sm: 18 }, color: "#9e9e9e", mr: 1 }} />
                                        )}
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontSize: { xs: "0.75rem", sm: "0.85rem", md: "0.9rem" },
                                            color: feature.included ? "text.primary" : "text.disabled",
                                            fontWeight:500,
                                            overflowWrap: "break-word",
                                            wordWrap: "break-word",
                                            flexShrink: 1,           // allow shrinking inside flex
                                            minWidth: 0, 
                                          }}
                                        >
                                          {feature.name}
                                        </Typography>
                                      </Box>
                                    ))}
                                  </Box>
                                  <Button
                                    fullWidth
                                    variant={selectedPackages[selection.id] === packageQuote.id ? "contained" : "outlined"}
                                    sx={{
                                      mt: "auto",
                                      py: 1,
                                      fontSize: { xs: "0.9rem", sm: "1rem" },
                                      fontWeight: 600,
                                      borderRadius: 1.5,
                                      boxShadow: "0 4px 12px rgba(66, 189, 63, 0.1)",
                                      bgcolor: selectedPackages[selection.id] === packageQuote.id ? "#369932" : "transparent",
                                      borderColor: "#42bd3f",
                                      color: selectedPackages[selection.id] === packageQuote.id ? "white" : "#42bd3f",
                                      "&:hover": {
                                        bgcolor: selectedPackages[selection.id] === packageQuote.id ? "none" : "rgba(66, 189, 63, 0.08)",
                                        borderColor: "#369932",
                                        color: selectedPackages[selection.id] === packageQuote.id ? "white" : "#369932"
                                      },
                                      transition: "all 0.2s ease-in-out",
                                      textTransform: "none"
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePackageSelect(selection.id, packageQuote);
                                    }}
                                  >
                                    {selectedPackages[selection.id] === packageQuote.id 
                                      ? `Selected • ${packageQuote.package_name}`
                                      : `Choose ${packageQuote.package_name}`
                                    }
                                  </Button>
                                </CardContent>
                              </Card>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </Box>
                    </FormControl>
                  </>
                  }
                  {/* Question Responses */}
                  {selection.question_responses?.length > 0 && (
                    <Box mt={2}>
                      <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#023c8f", fontSize:{ xs: "1rem", sm: "1.2rem", md: "1.3rem"} }}>
                        Job Specs
                      </Typography>
                      <Box sx={{ bgcolor: "#f8f9fa", borderRadius: 1, p: 1 }}>
                        {selection.question_responses.map((response, index) => (
                          <Box key={response.id} sx={{ display: 'flex', mb: 0.5, alignItems: "flex-start"}}>
                              <Typography variant="body1" sx={{ color: "#023c8f", fontWeight: 600, mr: 1, minWidth: '25px', fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" }}}>
                                Q{index + 1}:
                              </Typography>
                            <Box >
                              <Typography variant="body1" sx={{ color: "#023c8f", flex: 1, mr: 1, fontSize: { xs: "0.9rem", sm: "1rem", md: "1.1rem" }}}>
                                {response.question_text}
                              </Typography>
                              <Box sx={{color: "#023c8f", fontWeight: 600, pl: response.question_type === "measurement" ? 0 : 1, fontSize: { xs: "0.75rem", sm: "0.85rem", md: "1rem" }}}>
                                {renderQuestionResponse(response)}
                              </Box>
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
              {addonError && (
                <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                  {addonError}
                </Typography>
              )}
              <Grid container spacing={2}>
                {addonsData.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.id)
                  const currentQuantity = addonQuantities[addon.id] || 1
                  return (
                    <Grid item xs={12} sm={6} md={4} key={addon.id} width={"100%"} sx={{flex: "1 1 500px"}}>
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
                              onClick={() => handleAddonToggle(addon.id, isSelected)}
                            >
                              {isSelected ? <Remove /> : <Add />}
                            </IconButton>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {addon.description}
                          </Typography>
                          {isSelected && (
                            <Box display="flex" alignItems="center" gap={1} mb={2}>
                              <Typography variant="body2" fontWeight={600}>
                                Quantity:
                              </Typography>
                              <TextField
                                type="number"
                                size="small"
                                value={addonQuantities[addon.id] ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  // Allow empty input temporarily
                                  if (value === "") {
                                    setAddonQuantities(prev => ({
                                      ...prev,
                                      [addon.id]: ""
                                    }))
                                    return
                                  }

                                  const numericValue = parseInt(value, 10)
                                  if (!isNaN(numericValue) && numericValue >= 1) {
                                    setAddonQuantities(prev => ({
                                      ...prev,
                                      [addon.id]: numericValue
                                    }))
                                  }
                                }}
                                onBlur={(e) => {
                                  // On blur, ensure it’s at least 1 and trigger the API update
                                  let value = parseInt(e.target.value, 10)
                                  if (isNaN(value) || value < 1) value = 1

                                  setAddonQuantities(prev => ({
                                    ...prev,
                                    [addon.id]: value
                                  }))

                                  handleAddonQuantityChange(addon.id, value)
                                }}
                                inputProps={{
                                  min: 1,
                                  style: { textAlign: 'center' }
                                }}
                                sx={{
                                  width: '80px',
                                  '& .MuiOutlinedInput-root': {
                                    '&:hover fieldset': { borderColor: '#42bd3f' },
                                    '&.Mui-focused fieldset': { borderColor: '#42bd3f' },
                                  },
                                }}
                              />
                            </Box>
                          )}
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

        {/* Coupons & Bundles */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 3,
            mb: 3,
            width: '100%',
          }}
        >
          <Box
            sx={{
              flex: { xs: '1 1 100%', md: showBundlesSection ? '1 1 0' : '1 1 100%' },
              minWidth: 0,
              width: { xs: '100%', md: showBundlesSection ? '50%' : '100%' },
            }}
          >
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                {!appliedCoupon &&
                  <>
                    <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                      Apply Coupon
                    </Typography>
                    <Box display="flex" gap={2} alignItems="flex-start" flexDirection={{ xs: 'column', sm: 'row' }}>
                      <TextField
                        size="small"
                        placeholder="Enter coupon code"
                        fullWidth
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        disabled={Object.keys(selectedPackages).length === 0 && !isBidInPerson}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#023c8f' },
                            '&.Mui-focused fieldset': { borderColor: '#023c8f' },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        onClick={handleApplyCoupon}
                        disabled={!couponCode.trim() || isApplyingCoupon || (Object.keys(selectedPackages).length === 0 && !isBidInPerson)}
                        sx={{
                          bgcolor: '#023c8f',
                          '&:hover': { bgcolor: '#012a6b' },
                          '&:disabled': { bgcolor: '#e0e0e0' },
                          fontWeight: 600,
                          minWidth: { xs: '100%', sm: '120px' },
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isApplyingCoupon ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                            Applying...
                          </>
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    </Box>
                  </>
                }

                <Box sx={{ mt: appliedCoupon ? 0 : 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                    Available Coupons
                  </Typography>

                  {isLoadingCoupons && (
                    <Typography variant="body2" color="text.secondary">Loading coupons...</Typography>
                  )}

                  {!isLoadingCoupons && globalCoupons?.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                      No coupons available.
                    </Typography>
                  )}

                  {!isLoadingCoupons && globalCoupons?.length > 0 && (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {globalCoupons.map((coupon) => (
                        <Box
                          key={coupon.id}
                          sx={{
                            p: 2,
                            bgcolor: '#f9fbff',
                            border: '1px solid #d0e3ff',
                            borderRadius: 1,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            justifyContent: 'space-between',
                            alignItems: { xs: 'stretch', sm: 'center' },
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={600} sx={{ color: "#023c8f" }}>
                              {coupon.code}
                            </Typography>
                            {coupon.percentage_discount && (
                              <Typography variant="body2" color="text.primary">
                                • {coupon.percentage_discount}% off
                              </Typography>
                            )}
                            {coupon.fixed_discount && (
                              <Typography variant="body2" color="text.primary">
                                • ${coupon.fixed_discount} off
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setCouponCode(coupon.code.toUpperCase())}
                            sx={{
                              borderColor: '#023c8f',
                              color: '#023c8f',
                              width: { xs: '100%', sm: 'auto' },
                              flexShrink: 0,
                            }}
                          >
                            Use
                          </Button>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>

                {couponError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {couponError}
                  </Typography>
                )}

                {appliedCoupon && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#f0f7ff',
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600} sx={{ color: '#023c8f' }}>
                        Coupon Applied: {appliedCoupon.code}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Discount: ${formatPrice(appliedCoupon.discount)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleRemoveCoupon}
                      disabled={isRemovingCoupon}
                      sx={{ color: '#d32f2f' }}
                    >
                      {isRemovingCoupon ? (
                        <CircularProgress size={16} sx={{ color: '#d32f2f' }} />
                      ) : (
                        <Close fontSize="small" />
                      )}
                    </IconButton>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {showBundlesSection && (
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 0' }, minWidth: 0, width: { xs: '100%', md: '50%' } }}>
            <Card sx={{ height: '100%', border: '1px solid #c8e6c9' }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                  Bundle these services
                </Typography>

                {showBundleLoading && !showBundleList && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <CircularProgress size={20} sx={{ color: '#023c8f' }} />
                    <Typography variant="body2" color="text.secondary">
                      Checking bundle offers...
                    </Typography>
                  </Box>
                )}

                {showBundleList ? (
                  <Stack spacing={1.5}>
                    {displayBundles.map((bundle) => {
                      const bundleId = getBundleId(bundle)
                      const isThisApplied =
                        isBundleApplied &&
                        (bundle.is_applied ||
                          bundleId === appliedBundleId ||
                          bundleId === quoteData?.applied_bundle?.id)

                      return (
                      <Box
                        key={bundleId}
                        sx={{
                          p: 2,
                          bgcolor: isThisApplied ? '#f0fff0' : '#f9fff9',
                          border: isThisApplied ? '2px solid #42bd3f' : '1px solid #e0e0e0',
                          borderRadius: 1,
                          display: 'flex',
                          flexDirection: { xs: 'column', sm: 'row' },
                          justifyContent: 'space-between',
                          alignItems: { xs: 'stretch', sm: 'center' },
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body1"
                            fontWeight={600}
                            sx={{
                              color: isThisApplied ? '#2e7d32' : '#023c8f',
                              display: 'flex',
                              flexWrap: 'wrap',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {bundle.name}
                            <Chip
                              label={formatBundleDiscountBadge(bundle)}
                              size="small"
                              color="success"
                            />
                            {isThisApplied && (
                              <Chip
                                label="Applied"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            <Box
                              component="span"
                              sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 1 }}
                            >
                              ${formatPrice(bundle.original_services_total)}
                            </Box>
                            <Box component="span" fontWeight={700} color="success.main">
                              ${formatPrice(bundle.bundled_services_total)}
                            </Box>
                          </Typography>
                        </Box>
                        {isThisApplied ? (
                          !isQuoteApproved && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={handleRemoveBundle}
                              disabled={isRemovingBundle}
                              fullWidth={false}
                              sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}
                              startIcon={isRemovingBundle ? <CircularProgress size={16} /> : <Close />}
                            >
                              {isRemovingBundle ? 'Removing...' : 'Remove'}
                            </Button>
                          )
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleApplyBundle(bundle)}
                            disabled={isApplyingBundle || isQuoteApproved}
                            sx={{
                              bgcolor: '#42bd3f',
                              '&:hover': { bgcolor: '#369932' },
                              whiteSpace: 'nowrap',
                              width: { xs: '100%', sm: 'auto' },
                              flexShrink: 0,
                            }}
                          >
                            {isApplyingBundle && applyingBundleId === bundleId ? (
                              <>
                                <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
                                Applying...
                              </>
                            ) : isBundleApplied ? (
                              'Switch to this bundle'
                            ) : (
                              'Apply bundle'
                            )}
                          </Button>
                        )}
                      </Box>
                    )})}
                  </Stack>
                ) : null}

                {bundleError && (
                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                    {bundleError}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
          )}
        </Box>

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
                            ${formatPrice(pkg.effective_total_price)}
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
                  const addon = getAddonInfo(addonId)
                  const quantity = addonQuantities[addonId] || 1
                  if (addon) {
                    return (
                      <Box key={addon.id} mb={1}>
                        <Box display="flex" justifyContent="space-between">
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {addon.name} {quantity > 1 && `(x${quantity})`}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Add-on service {quantity > 1 && `• $${formatPrice(addon.base_price)} each`}
                            </Typography>
                          </Box>
                          <Typography variant="body1" fontWeight={600}>
                            ${formatPrice(Number.parseFloat(addon.base_price) * quantity)}
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
            
            {quoteData?.is_bundle_applied && bundleDiscountAmount > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#023c8f', mb: 1 }}>
                  Bundle Discount
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body1" fontWeight={500}>
                    {quoteData?.applied_bundle?.name || 'Bundle'}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">
                    - ${formatPrice(bundleDiscountAmount)}
                  </Typography>
                </Box>
              </Box>
            )}

            {appliedCoupon &&
              <Box mb={2}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#023c8f', mb: 1 }}>
                  Coupon
                </Typography>
                  <Box>
                    <Box display="flex" justifyContent="space-between">
                      <Box>
                        <Typography variant="body1" fontWeight={500}>
                          {appliedCoupon?.code}
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        - ${formatPrice(couponDiscount)}
                      </Typography>
                    </Box>
                  </Box>
              </Box>
            }

            <Divider sx={{ my: 2 }} />

            {/* {!isBidInPerson&& */}
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={700}>
                  Total
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    ${finalTotal}
                  </Typography>
                  <Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1 }}>
                    Plus Tax
                  </Typography>
                </Box>
              </Box>
            {/* } */}

            {/* Signature Section */}
            {!admin && !isBidInPerson&&
              <Box sx={{ mb: 3, maxWidth: { xs: '100%', sm: '400px' } }}>
                <Typography variant="subtitle2" gutterBottom sx={{ color: '#023c8f', fontWeight: 600 }}>
                  Signature
                </Typography>
                {/* <Box
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
                </Box> */}
                <TextField
                  placeholder="Type your full name as signature"
                  fullWidth
                  value={signature}
                  size="small"
                  onChange={(e) => {
                    setSignature(e.target.value)
                  }}
                  sx={{
                    mt: 1,
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
                      // sigCanvasRef.current.clear();
                      setSignature('');
                    }}
                  >
                    Clear
                  </Button>
                </Box>
              </Box>
            }

            {!admin &&
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
                  {/* <Button
                    variant="outlined"
                    size="small"
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
                  </Button> */}

                  <Button
                    variant="contained"
                    size="small"
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
            }

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