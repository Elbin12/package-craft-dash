import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Stack,
  Avatar,
  Container,
  Grid,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Person,
  BusinessCenter,
  LocalOffer,
  QuestionAnswer,
  Receipt,
  LocationOn,
  ArrowBack,
  Mail,
  Phone,
  Home,
  ExpandMore,
  ExpandLess,
  Check,
  Close,
  Add,
  Download,
} from '@mui/icons-material';
import { useGetQuoteDetailsQuery } from '../../store/api/user/quoteApi';
import { Info } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

// PDF generation import
import jsPDF from 'jspdf';

const statusStyles = {
  pending: { bgcolor: 'warning.light', color: 'warning.dark' },
  approved: { bgcolor: 'success.light', color: 'success.dark' },
  rejected: { bgcolor: 'error.light', color: 'error.dark' },
  submitted: { bgcolor: 'info.light', color: 'info.dark' },
  draft: { bgcolor: 'grey.100', color: 'grey.800' },
  responses_completed: { bgcolor: 'success.light', color: 'success.dark' },
};

const formatYesNo = (val) => {
  if (val === true) return 'Yes';
  if (val === false) return 'No';
  return 'N/A';
};

const QuoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expandedServices, setExpandedServices] = useState({});
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isBidInPerson, setIsBidInPerson] = useState(false)
  
  const {
    data: quote,
    isLoading,
    isError,
    error,
  } = useGetQuoteDetailsQuery(id, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const sigCanvas = useRef();

  // Expand all services by default
  useEffect(() => {
    if (quote?.service_selections) {
      const initialExpanded = {};
      let bidInPerson = false

      quote.service_selections.forEach((service) => {
        initialExpanded[service.id] = true;
        if (service.package_quotes.length === 0) {
          bidInPerson = true
        }
      });
      setExpandedServices(initialExpanded);
      setIsBidInPerson(bidInPerson)
    }
  }, [quote]);

  const toggleServiceExpansion = (serviceId) => {
    setExpandedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }));
  };

  // PDF Download Handler
  const handleDownloadPDF = async () => {
    if (!quote) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight = 10) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(2, 60, 143); // #023c8f
      pdf.text('QUOTE DETAILS', margin, yPosition);
      yPosition += 15;

      // Quote ID and Status
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Quote ID: ${quote.id}`, margin, yPosition);
      // pdf.text(`Status: ${status?.toUpperCase()}`, margin + 80, yPosition);
      pdf.text(`Created: ${new Date(created_at).toLocaleDateString()}`, margin + 140, yPosition);
      yPosition += 20;

      // Customer Information Section
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(2, 60, 143);
      pdf.text('CUSTOMER INFORMATION', margin, yPosition);
      yPosition += 10;

      // Draw separator line
      pdf.setDrawColor(2, 60, 143);
      pdf.line(margin, yPosition, margin + contentWidth, yPosition);
      yPosition += 10;

      // Customer details in two columns
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      
      const leftCol = margin;
      const rightCol = margin + contentWidth / 2;
      let leftY = yPosition;
      let rightY = yPosition;

      // Left column
      pdf.setFont('helvetica', 'bold');
      pdf.text('Name:', leftCol, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${first_name} ${last_name}`, leftCol + 25, leftY);
      leftY += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Email:', leftCol, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(customer_email, leftCol + 25, leftY);
      leftY += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Phone:', leftCol, leftY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(customer_phone, leftCol + 25, leftY);
      leftY += 8;

      if (company_name) {
        pdf.setFont('helvetica', 'bold');
        pdf.text('Company:', leftCol, leftY);
        pdf.setFont('helvetica', 'normal');
        pdf.text(company_name, leftCol + 25, leftY);
        leftY += 8;
      }

      // Right column
      pdf.setFont('helvetica', 'bold');
      pdf.text('Property Type:', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(property_type?.charAt(0).toUpperCase() + property_type?.slice(1), rightCol + 30, rightY);
      rightY += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Floors:', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(num_floors, rightCol + 30, rightY);
      rightY += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('House Size:', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      const sizeText = `${size_range?.min_sqft}${size_range?.max_sqft === null ? ' sq ft And Up' : `- ${size_range?.max_sqft} sq ft`}`;
      pdf.text(sizeText, rightCol + 30, rightY);
      rightY += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Postal Code:', rightCol, rightY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(postal_code, rightCol + 30, rightY);
      rightY += 8;

      yPosition = Math.max(leftY, rightY) + 5;

      // Address
      pdf.setFont('helvetica', 'bold');
      pdf.text('Address:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(street_address || customer_address, leftCol + 25, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'bold');
      pdf.text('Location:', leftCol, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(location_details?.address || '', leftCol + 25, yPosition);
      yPosition += 15;

      // Services Section
      if (service_selections?.length > 0) {
        service_selections.forEach((selection, index) => {
          checkPageBreak(30);
          
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(2, 60, 143);
          pdf.text(`SERVICE: ${selection.service_details?.name?.toUpperCase()}`, margin, yPosition);
          yPosition += 10;

          pdf.setDrawColor(2, 60, 143);
          pdf.line(margin, yPosition, margin + contentWidth, yPosition);
          yPosition += 10;

          // Service description
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(0, 0, 0);
          if (selection.service_details?.description) {
            const descLines = pdf.splitTextToSize(selection.service_details.description, contentWidth);
            pdf.text(descLines, margin, yPosition);
            yPosition += descLines.length * 5 + 5;
          }

          // ✅ Add Disclaimer (just like site logic)
          const generalDisclaimer = selection.service_details?.service_settings?.general_disclaimer;
          const bidDisclaimer = selection.service_details?.service_settings?.bid_in_person_disclaimer;

          if (!isBidInPerson && generalDisclaimer) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(2, 60, 143);
            pdf.text("General Disclaimer:", margin, yPosition);
            yPosition += 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            const disclaimerLines = pdf.splitTextToSize(generalDisclaimer, contentWidth);
            pdf.text(disclaimerLines, margin + 5, yPosition);
            yPosition += disclaimerLines.length * 5 + 8;
          }

          if (isBidInPerson && bidDisclaimer) {
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(2, 60, 143);
            pdf.text("Bid in Person Disclaimer:", margin, yPosition);
            yPosition += 6;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            const disclaimerLines = pdf.splitTextToSize(bidDisclaimer, contentWidth);
            pdf.text(disclaimerLines, margin + 5, yPosition);
            yPosition += disclaimerLines.length * 5 + 8;
          }

          // Selected Package
          if (selection.package_quotes?.[0]) {
            const packageInfo = selection.package_quotes[0];
            
            checkPageBreak(25);
            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(2, 60, 143);
            pdf.text('Selected Package:', margin, yPosition);
            yPosition += 8;

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(0, 0, 0);
            pdf.text(packageInfo.package_name, margin + 5, yPosition);
            
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(66, 189, 63); // Green color
            pdf.text(`${formatPrice(packageInfo.total_price)}`, margin + 120, yPosition);
            yPosition += 10;

            // Features
            if (packageInfo.included_features_details?.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(0, 0, 0);
              pdf.text('Included Features:', margin + 5, yPosition);
              yPosition += 6;

              packageInfo.included_features_details.forEach(feature => {
                checkPageBreak(6);
                pdf.setFont('helvetica', 'normal');
                pdf.text(`✓ ${feature.name}`, margin + 10, yPosition);
                yPosition += 5;
              });
            }

            if (packageInfo.excluded_features_details?.length > 0) {
              pdf.setFont('helvetica', 'bold');
              pdf.text('Not Included:', margin + 5, yPosition);
              yPosition += 6;

              packageInfo.excluded_features_details.forEach(feature => {
                checkPageBreak(6);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(150, 150, 150);
                pdf.text(`✗ ${feature.name}`, margin + 10, yPosition);
                yPosition += 5;
              });
            }
          }

          yPosition += 10;
        });
      }

      // Add-ons Section
      if (addons?.length > 0) {
        checkPageBreak(30);
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(2, 60, 143);
        pdf.text('ADDITIONAL SERVICES', margin, yPosition);
        yPosition += 10;

        pdf.setDrawColor(2, 60, 143);
        pdf.line(margin, yPosition, margin + contentWidth, yPosition);
        yPosition += 10;

        addons.forEach(addon => {
          checkPageBreak(15);
          
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(addon.name, margin, yPosition);
          
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(66, 189, 63);
          pdf.text(`${formatPrice(addon.base_price)}`, margin + 120, yPosition);
          yPosition += 8;

          if (addon.description) {
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100);
            const descLines = pdf.splitTextToSize(addon.description, contentWidth - 10);
            pdf.text(descLines, margin + 5, yPosition);
            yPosition += descLines.length * 4 + 5;
          }
        });

        yPosition += 10;
      }

      if (status!=="declined"){

        // Pricing Summary
        checkPageBreak(60);
        
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(2, 60, 143);
        pdf.text('PRICING SUMMARY', margin, yPosition);
        yPosition += 10;
  
        pdf.setDrawColor(2, 60, 143);
        pdf.line(margin, yPosition, margin + contentWidth, yPosition);
        yPosition += 15;
  
        // Pricing details
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
  
        pdf.text('Price:', margin, yPosition);
        pdf.text(`${formatPrice(final_total || 0)}`, margin + 120, yPosition);
        yPosition += 8;
  
        if (total_addons_price && parseFloat(total_addons_price) > 0) {
          pdf.text('Add-ons:', margin, yPosition);
          pdf.text(`${formatPrice(total_addons_price)}`, margin + 120, yPosition);
          yPosition += 8;
        }
  
        // pdf.text('Surcharges:', margin, yPosition);
        // pdf.text(`${formatPrice(total_surcharges || 0)}`, margin + 120, yPosition);
        // yPosition += 8;
  
        // pdf.text('Adjustments:', margin, yPosition);
        // pdf.text(`${formatPrice(total_adjustments || 0)}`, margin + 120, yPosition);
        // yPosition += 15;
  
        // Final total
        pdf.setDrawColor(0, 0, 0);
        pdf.line(margin, yPosition, margin + 140, yPosition);
        yPosition += 8;
  
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Final Total:', margin, yPosition);
        pdf.setTextColor(66, 189, 63);
        pdf.text(`${formatPrice(final_total || 0)}`, margin + 120, yPosition);
        yPosition += 15;
      }


      // Footer
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Quote generated on ${new Date(created_at).toLocaleString()}`, margin, pageHeight - 15);
      // pdf.text(`Valid until: ${new Date(expires_at).toLocaleDateString()}`, margin, pageHeight - 15);

      // Generate filename
      const customerName = `${first_name}_${last_name}`.replace(/\s+/g, '_');
      const filename = `Quote_${quote.id.slice(0, 8)}_${customerName}.pdf`;
      
      // Save the PDF
      pdf.save(filename);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading quote details...
        </Typography>
      </Box>
    );
  }

  if (isError || !quote) {
    return (
      <Box p={4}>
        <Button
          startIcon={<ArrowBack />}
          variant="text"
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h5" color="error" gutterBottom>
          Failed to load quote
        </Typography>
        <Typography variant="body2">
          {error?.message || 'Quote not found or something went wrong.'}
        </Typography>
      </Box>
    );
  }

  const {
    first_name,
    last_name,
    company_name,
    customer_email,
    customer_phone,
    customer_address,
    street_address,
    postal_code,
    property_type,
    num_floors,
    heard_about_us,
    size_range,
    location_details,
    status,
    total_base_price,
    total_adjustments,
    total_surcharges,
    final_total,
    created_at,
    expires_at,
    service_selections,
    quote_surcharge_applicable,
    additional_data,
    addons,
    total_addons_price,
  } = quote;

  const formatPrice = (price) => {
    const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
    return numPrice
  };

  const findFinalTotal = ()=> {
    return formatPrice(total_base_price) + formatPrice(total_adjustments) + formatPrice(total_surcharges); 
  }

  const renderQuestionResponse = (response) => {
    switch (response.question_type) {
      case "yes_no":
      case "conditional":
        return response.yes_no_answer ? "Yes" : "No";
      case "multiple_yes_no":
        return (
          response.sub_question_responses
            .filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected"
        );
      case "quantity":
        return response.option_responses.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ");
      case "describe":
        return response.option_responses.map((opt) => opt.option_text).join(", ");
      default:
        return "N/A";
    }
  };

  return (
    <Box className="min-h-screen" sx={{ background: 'linear-gradient(135deg,#f0f4f9 0%,#e2e8f0 70%)', pb: 6 }}>
      {/* Header - Keep existing navbar */}
      <Box
        sx={{
          bgcolor:'white',
          bg: 'white',
          borderBottom: 1,
          borderColor: 'divider',
          mb: 4,
          py: 2,
        }}
        className='fixed w-full z-20'
      >
        <Box maxWidth="1200px" mx="auto" px={{ xs: 2, md: 4 }} display="flex" flexDirection="column" gap={1} >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Box>
                <Typography variant="h4" color='#023c8f' fontWeight="600">
                  Quote Details
                </Typography>
                <Box display="flex" alignItems="center" gap={2} mt={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    ID: {quote.id}
                  </Typography>
                  <Chip
                    label={status?.charAt(0).toUpperCase() + status?.slice(1)}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 1,
                      ...statusStyles[status?.toLowerCase()] || statusStyles['draft'],
                    }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* PDF Download Button */}
            {status!=="declined"&&
              <Button
                variant="contained"
                startIcon={isGeneratingPDF ? <CircularProgress size={20} color="inherit" /> : <Download />}
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                sx={{
                  bgcolor: '#023c8f',
                  '&:hover': { bgcolor: '#012a6b' },
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            }
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <Box maxWidth="1400px" className='py-36' mx="auto" px={{ xs: 2, md: 4 }}>
        <Container maxWidth="lg">
          <Box display="grid"  gridTemplateColumns={
              status !== "declined"
                ? { xs: "1fr", lg: "2fr 1fr" }
                : "1fr"
            } gap={6}>
            {/* Left column */}
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Customer Info */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                    Customer Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Name
                      </Typography>
                      <Typography variant="body1">{first_name} {last_name}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1">{customer_email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1">{customer_phone}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        House sq ft
                      </Typography>
                      <Typography variant="body1">{size_range?.min_sqft} {size_range?.max_sqft===null? " sq ft And Up" : `- ${size_range?.max_sqft} sq ft`}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Property Type
                      </Typography>
                      <Typography variant="body1">{property_type?.charAt(0).toUpperCase() + property_type?.slice(1)}</Typography>
                    </Grid>
                    {company_name && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="caption" color="text.secondary">
                          Company
                        </Typography>
                        <Typography variant="body1">{company_name}</Typography>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Floors
                      </Typography>
                      <Typography variant="body1">{num_floors}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1">{street_address || customer_address}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Province, City
                      </Typography>
                      <Typography variant="body1">{location_details?.address}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        Postal Code
                      </Typography>
                      <Typography variant="body1">{postal_code}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">
                        How did you hear about us?
                      </Typography>
                      <Typography variant="body1">{heard_about_us?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              
              {status === "declined" && (
                <Card
                  sx={{
                    backgroundColor: "#fefefe",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
                    mb: 2,
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2.5} alignItems="flex-start">
                      <Avatar 
                        sx={{ 
                          bgcolor: "#ef4444", 
                          width: 40, 
                          height: 40,
                          fontSize: "1.1rem"
                        }}
                      >
                        ✕
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: "#dc2626",
                            fontWeight: 600,
                            fontSize: "1.1rem",
                            mb: 1
                          }}
                        >
                          Quote Declined
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: "#6b7280",
                            lineHeight: 1.5,
                            fontSize: "0.95rem"
                          }}
                        >
                          We’d be happy to work with you on adjustments or create a new proposal tailored to your needs.
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Service Selections */}
              {service_selections?.map((selection) => (
                <Card key={selection.id}>
                  {/* Service Header */}
                  <Box
                    sx={{
                      px: 3,
                      py: 0.5,
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
                          {selection.service_details?.name}
                        </Typography>
                      </Box>
                      <IconButton sx={{ color: 'white' }}>
                        {expandedServices[selection.id] ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Collapsible Content */}
                  <Collapse in={expandedServices[selection.id]} timeout="auto" unmountOnExit>
                    <Box sx={{ px: 3, py: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{mb:1}}>
                        {selection.service_details?.description}
                      </Typography>
                      
                      {/* Service Disclaimers */}
                      {(selection.service_details?.service_settings?.general_disclaimer || 
                        selection.service_details?.service_settings?.bid_in_person_disclaimer) && (
                        <Box sx={{ mb: 2 }}>
                          {!isBidInPerson?
                            selection.service_details?.service_settings?.general_disclaimer && (
                              <Box 
                                sx={{ 
                                  backgroundColor: '#d9edf7',
                                  padding: '12px 16px',
                                  borderRadius: '6px',
                                  mb: 1,
                                  border: '1px solid #023c8f'
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#023c8f',
                                    fontWeight: 500,
                                    fontSize: '13px'
                                  }}
                                >
                                  <strong>General:</strong> {selection.service_details.service_settings.general_disclaimer}
                                </Typography>
                              </Box>
                            ):
                            selection.service_details?.service_settings?.bid_in_person_disclaimer && (
                              <Box 
                                sx={{ 
                                  backgroundColor: '#d9edf7',
                                  padding: '12px 16px',
                                  borderRadius: '6px',
                                  mb: 1,
                                  border: '1px solid #023c8f'
                                }}
                              >
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    color: '#023c8f',
                                    fontWeight: 500,
                                    fontSize: '13px'
                                  }}
                                >
                                  <strong>Bid in Person:</strong> {selection.service_details.service_settings.bid_in_person_disclaimer}
                                </Typography>
                              </Box>
                            )
                          }
                        </Box>
                      )}

                      {/* Selected Package Display */}
                      {status!=="declined"&&
                        selection.package_quotes?.[0] && (
                            <Box sx={{ mb: 3 }}>
                              <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: '#023c8f' }}>
                                Selected Package
                              </Typography>
                              <Card
                                variant="outlined"
                                sx={{
                                  border: "2px solid #42bd3f",
                                  bgcolor: "#f8fff8",
                                  borderRadius: 3,
                                  minHeight: 220,
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                }}
                              >
                                <CardContent sx={{ p: 4 }}>
                                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                    <Typography variant="h6" fontWeight={700}>
                                      {selection.package_quotes[0].package_name}
                                    </Typography>
                                    <Chip
                                      label="Selected"
                                      sx={{
                                        bgcolor: "#42bd3f",
                                        color: "white",
                                        fontWeight: 600,
                                      }}
                                    />
                                  </Box>

                                  <Typography variant="h4" sx={{ color: "#42bd3f", fontWeight: 700, mb: 2 }}>
                                    ${formatPrice(selection.package_quotes[0].total_price)}
                                  </Typography>

                                  {/* Features List */}
                                  <Box>
                                    {[
                                      ...(selection.package_quotes[0].included_features_details || []).map((f) => ({
                                        ...f,
                                        included: true,
                                      })),
                                      ...(selection.package_quotes[0].excluded_features_details || []).map((f) => ({
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
                            </Box>
                          )
                      }

                      {/* Question Responses */}
                      {selection.question_responses?.length > 0 && (
                        <Box mt={4}>
                          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#023c8f' }} gutterBottom>
                            Question Responses
                          </Typography>
                          <Grid container spacing={2}>
                            {selection.question_responses.map((response) => (
                              <Grid item xs={12} sm={6} key={response.id}>
                                <Box p={2} sx={{ bgcolor: "#d9edf7", borderRadius: 1, border: "1px solid #023c8f" }}>
                                  <Typography variant="body2" fontWeight={600} gutterBottom sx={{ color: '#023c8f' }}>
                                    {response.question_text}
                                  </Typography>
                                  <Typography variant="body2" color="text.primary">
                                    {renderQuestionResponse(response)}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  </Collapse>
                </Card>
              ))}

              {/* Add-ons Section */}
              {addons && addons.length > 0 && (
                <Card>
                  <Box sx={{ p: 3, py: 2}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Add />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#023c8f' }}>
                          Additional Services
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {addons.length} additional service{addons.length > 1 ? 's' : ''} selected
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                  <Divider />
                  <Box sx={{ overflow: 'hidden' }}>
                    {addons.map((addon, index) => (
                      <Box
                        key={addon.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 3,
                          borderBottom: index < addons.length - 1 ? '1px solid #f0f0f0' : 'none',
                          '&:hover': {
                            bgcolor: '#f8f9fa',
                          },
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <Typography 
                            variant="subtitle1" 
                            fontWeight={600}
                            sx={{ color: '#023c8f', mb: 0.5 }}
                          >
                            {addon.name}
                          </Typography>
                          {addon.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ 
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {addon.description}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ color: '#42bd3f' }}
                          >
                            ${formatPrice(addon.base_price)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}

              {/* Additional Information */}
              {additional_data && (additional_data?.signature || additional_data?.additional_notes) && (
                <Card >
                  <Box sx={{ p: 3, py:2}}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: "#023c8f" }}>
                        <Info />
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 600, color:'#023c8f' }}>
                        Additional Information
                      </Typography>
                    </Stack>
                  </Box>
                  <Divider />
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      {!isBidInPerson && additional_data.signature && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Signature
                          </Typography>
                          <img
                            src={`data:image/png;base64,${additional_data.signature}`}
                            alt="Signature"
                            style={{ border: "1px solid #ccc", maxWidth: "200px" }}
                          />
                        </Box>
                      )}

                      {additional_data.additional_notes && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ color: "#64748b", mb: 1 }}>
                            Additional Notes
                          </Typography>
                          <Box
                            sx={{
                              border: "1px solid #334155",
                              borderRadius: 1,
                              p: 2,
                            }}
                          >
                            <Typography variant="body2">
                              {additional_data.additional_notes}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              )}
            </Box>

            {/* Right column - pricing */}
            {status!=="declined" &&
              <Box>
                <Paper
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    position: 'sticky',
                    top: 80,
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    sx={{
                      background: '#023c8f',
                      color: 'white',
                      px: 3,
                      py: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Receipt fontSize="small" />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Pricing Summary
                    </Typography>
                  </Box>
                  <CardContent>
                    <Box display="flex" flexDirection="column" gap={2}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2">Price</Typography>
                        <Typography variant="subtitle2">
                          ${formatPrice(findFinalTotal() || 0)}
                        </Typography>
                      </Box>
                      
                      {/* Add-ons Price */}
                      {total_addons_price && parseFloat(total_addons_price) > 0 && (
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Typography variant="body2">Add-ons</Typography>
                          <Typography variant="subtitle2">
                            ${formatPrice(total_addons_price)}
                          </Typography>
                        </Box>
                      )}
                      
                      {/* <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2">Surcharges</Typography>
                        <Typography variant="subtitle2">
                          ${formatPrice(total_surcharges || 0)}
                        </Typography>
                      </Box> */}
                      {/* <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Typography variant="body2">Adjustments</Typography>
                        <Typography variant="subtitle2">
                          ${formatPrice(total_adjustments || 0)}
                        </Typography>
                      </Box> */}
                      <Divider />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(243,244,246,0.5)',
                          p: 1,
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="600">
                          Final Total
                        </Typography>
                        <Typography variant="h5" fontWeight="500" color="#42bd3f">
                          ${formatPrice(final_total || 0)}
                        </Typography>
                      </Box>
                      
                      <Divider />
                      <Typography variant="caption" color="text.secondary" align="center">
                        Quote created on{' '}
                        {new Date(created_at).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </CardContent>
                </Paper>
              </Box>
            }
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default QuoteDetailsPage;