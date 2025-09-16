import jsPDF from "jspdf";

export const handleDownloadPDF = async (setIsGeneratingPDF, quote) => {
  setIsGeneratingPDF(true);
  
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Professional color scheme matching the example
    const primaryBlue = [41, 128, 185]; // Professional blue
    const darkGray = [52, 73, 94]; // Dark gray for text
    const mediumGray = [127, 140, 141]; // Medium gray for labels
    const lightGray = [236, 240, 241]; // Light gray for backgrounds
    const accentGreen = [46, 204, 113]; // Green for highlights

    // Extract quote data
    const {
      id,
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
      final_total,
      created_at,
      service_selections,
      additional_data,
      addons,
      total_addons_price,
    } = quote;

    // Format price helper
    const formatPrice = (price) => {
      const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
      return isNaN(numPrice) ? "$0.00" : `$${numPrice.toFixed(2)}`;
    };

    // Check if bid in person
    const isBidInPerson = service_selections?.some(service => 
      service.package_quotes?.length === 0
    ) || false;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredHeight = 15) => {
      if (yPosition + requiredHeight > pageHeight - margin - 30) {
        addFooter();
        pdf.addPage();
        yPosition = margin + 10;
        return true;
      }
      return false;
    };

    // Helper function for wrapped text
    const addWrappedText = (text, x, y, maxWidth, options = {}) => {
      if (!text) return 7;
      const lines = pdf.splitTextToSize(String(text), maxWidth);
      pdf.text(lines, x, y, options);
      return lines.length * 5;
    };

    // Helper function to create section headers
    const addSectionHeader = (title, color = primaryBlue) => {
      checkPageBreak(25);
      
      // Background bar
      pdf.setFillColor(...lightGray);
      pdf.rect(margin - 5, yPosition - 2, contentWidth + 10, 12, 'F');
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...color);
      pdf.text(title.toUpperCase(), margin, yPosition + 6);
      yPosition += 20;
    };

    // Helper function to add info rows with better formatting
    const addInfoRow = (label, value, x = margin, maxWidth = contentWidth) => {
      checkPageBreak(10);
      
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...mediumGray);
      pdf.text(`${label}:`, x, yPosition);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...darkGray);
      const labelWidth = pdf.getTextWidth(`${label}: `);
      const valueHeight = addWrappedText(value || 'N/A', x + labelWidth + 2, yPosition, maxWidth - labelWidth - 2);
      yPosition += Math.max(7, valueHeight + 2);
      
      return yPosition;
    };

    // Add footer function
    const addFooter = () => {
      const footerY = pageHeight - 15;
      pdf.setDrawColor(...lightGray);
      pdf.setLineWidth(0.3);
      pdf.line(margin, footerY - 5, margin + contentWidth, footerY - 5);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mediumGray);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, footerY);
      
      const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
      const pageText = `Page ${pageNum}`;
      const pageTextWidth = pdf.getTextWidth(pageText);
      pdf.text(pageText, margin + contentWidth - pageTextWidth, footerY);
    };

    // Helper function for question responses
    const renderQuestionResponse = (response) => {
      switch (response.question_type) {
        case "yes_no":
        case "conditional":
          return response.yes_no_answer ? "Yes" : "No";
        case "multiple_yes_no":
          return response.sub_question_responses
            ?.filter((sub) => sub.answer)
            .map((sub) => sub.sub_question_text)
            .join(", ") || "None selected";
        case "quantity":
          return response.option_responses?.map((opt) => `${opt.option_text}: ${opt.quantity}`).join(", ") || "N/A";
        case "describe":
          return response.option_responses?.map((opt) => opt.option_text).join(", ") || "N/A";
        default:
          return "N/A";
      }
    };

    // ===== HEADER SECTION =====
    // Company header with blue accent
    pdf.setFillColor(...primaryBlue);
    pdf.rect(0, 0, pageWidth, 25, 'F');
    
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('SERVICE QUOTATION', margin, 17);
    
    yPosition = 40;

    // Quote information box
    pdf.setFillColor(...lightGray);
    pdf.setDrawColor(...mediumGray);
    pdf.setLineWidth(0.5);
    pdf.rect(margin + contentWidth - 80, yPosition - 5, 75, 35, 'FD');
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkGray);
    const infoX = margin + contentWidth - 75;
    pdf.text('Quote Number:', infoX, yPosition + 2);
    pdf.text('Date:', infoX, yPosition + 9);
    pdf.text('Status:', infoX, yPosition + 16);
    pdf.text('Valid Until:', infoX, yPosition + 23);
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(`#${id.slice(0, 8)}`, infoX + 35, yPosition + 2);
    pdf.text(new Date(created_at).toLocaleDateString(), infoX + 15, yPosition + 9);
    
    // Status with color coding
    const statusText = status?.charAt(0).toUpperCase() + status?.slice(1);
    const statusColor = status === 'approved' ? accentGreen : status === 'declined' ? [231, 76, 60] : mediumGray;
    pdf.setTextColor(...statusColor);
    pdf.text(statusText, infoX + 18, yPosition + 16);
    
    pdf.setTextColor(...darkGray);
    const validUntil = new Date(created_at);
    validUntil.setDate(validUntil.getDate() + 30);
    pdf.text(validUntil.toLocaleDateString(), infoX + 30, yPosition + 23);
    
    yPosition += 50;

    // ===== CUSTOMER INFORMATION SECTION =====
    addSectionHeader('Customer Information');
    
    // Customer info in structured layout
    const leftCol = margin;
    const rightCol = margin + contentWidth / 2;
    let leftY = yPosition;
    let rightY = yPosition;

    // Left column info
    pdf.setFontSize(9);
    leftY = yPosition;
    addInfoRow('Full Name', `${first_name} ${last_name}`, leftCol, contentWidth / 2 - 10);
    addInfoRow('Email Address', customer_email, leftCol, contentWidth / 2 - 10);
    addInfoRow('Phone Number', customer_phone, leftCol, contentWidth / 2 - 10);
    if (company_name) {
      addInfoRow('Company', company_name, leftCol, contentWidth / 2 - 10);
    }
    leftY = yPosition;

    // Right column info
    yPosition = rightY;
    addInfoRow('Property Type', property_type?.charAt(0).toUpperCase() + property_type?.slice(1), rightCol, contentWidth / 2 - 10);
    addInfoRow('Number of Floors', num_floors, rightCol, contentWidth / 2 - 10);
    const sizeText = size_range ? `${size_range.min_sqft}${size_range.max_sqft === null ? ' sq ft+' : ` - ${size_range.max_sqft} sq ft`}` : 'N/A';
    addInfoRow('Property Size', sizeText, rightCol, contentWidth / 2 - 10);
    addInfoRow('Postal Code', postal_code, rightCol, contentWidth / 2 - 10);
    
    yPosition = Math.max(leftY, yPosition) + 5;

    // Address section with better formatting
    if (street_address || customer_address || location_details?.address) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 25, 'F');
      
      yPosition += 3;
      if (street_address || customer_address) {
        addInfoRow('Service Address', street_address || customer_address);
      }
      if (location_details?.address && location_details.address !== (street_address || customer_address)) {
        addInfoRow('Additional Location Details', location_details.address);
      }
      yPosition += 8;
    }

    if (heard_about_us) {
      addInfoRow('How did you hear about us', heard_about_us.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()));
    }

    yPosition += 15;

    // ===== SERVICES SECTION =====
    if (service_selections?.length > 0) {
      service_selections.forEach((selection, index) => {
        addSectionHeader(`Service ${index + 1}: ${selection.service_details?.name}`);

        // Service description box
        if (selection.service_details?.description) {
          pdf.setFillColor(249, 251, 253);
          pdf.setDrawColor(...lightGray);
          const descHeight = Math.max(15, selection.service_details.description.length / 100 * 6);
          pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, descHeight, 'FD');
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...darkGray);
          yPosition += addWrappedText(selection.service_details.description, margin + 3, yPosition + 3, contentWidth - 6) + 10;
        }

        // Disclaimers with warning styling
        const generalDisclaimer = selection.service_details?.service_settings?.general_disclaimer;
        const bidDisclaimer = selection.service_details?.service_settings?.bid_in_person_disclaimer;

        if (!isBidInPerson && generalDisclaimer) {
          checkPageBreak(30);
          pdf.setFillColor(255, 249, 196);
          pdf.setDrawColor(255, 193, 7);
          const disclaimerHeight = Math.max(20, generalDisclaimer.length / 90 * 6);
          pdf.rect(margin - 2, yPosition, contentWidth + 4, disclaimerHeight, 'FD');
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(138, 109, 59);
          pdf.text('⚠ IMPORTANT DISCLAIMER', margin + 3, yPosition + 8);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(114, 94, 48);
          yPosition += addWrappedText(generalDisclaimer, margin + 3, yPosition + 15, contentWidth - 6) + 25;
        }

        if (isBidInPerson && bidDisclaimer) {
          checkPageBreak(30);
          pdf.setFillColor(217, 237, 247);
          pdf.setDrawColor(52, 144, 220);
          const disclaimerHeight = Math.max(20, bidDisclaimer.length / 90 * 6);
          pdf.rect(margin - 2, yPosition, contentWidth + 4, disclaimerHeight, 'FD');
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...primaryBlue);
          pdf.text('ℹ NOTICE - IN-PERSON ASSESSMENT REQUIRED', margin + 3, yPosition + 8);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(31, 97, 141);
          yPosition += addWrappedText(bidDisclaimer, margin + 3, yPosition + 15, contentWidth - 6) + 25;
        }

        // Selected Package with professional styling
        if (status !== "declined" && selection.package_quotes?.[0]) {
          const packageInfo = selection.package_quotes[0];
          
          checkPageBreak(50);
          
          // Package header with colored background
          pdf.setFillColor(...accentGreen);
          pdf.rect(margin - 5, yPosition - 2, contentWidth + 10, 15, 'F');
          
          pdf.setFontSize(11);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 255, 255);
          pdf.text('SELECTED PACKAGE', margin, yPosition + 7);
          
          const priceText = formatPrice(packageInfo.total_price);
          const priceWidth = pdf.getTextWidth(priceText);
          pdf.text(priceText, margin + contentWidth - priceWidth, yPosition + 7);
          
          yPosition += 20;

          // Package name
          pdf.setFontSize(12);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...darkGray);
          pdf.text(packageInfo.package_name, margin, yPosition);
          yPosition += 15;

          // Features in professional two-column layout
          if (packageInfo.included_features_details?.length > 0 || packageInfo.excluded_features_details?.length > 0) {
            const featureLeftCol = margin;
            const featureRightCol = margin + (contentWidth / 2) + 5;
            let featureLeftY = yPosition;
            let featureRightY = yPosition;

            // Included features
            if (packageInfo.included_features_details?.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...accentGreen);
              pdf.text('✓ INCLUDED FEATURES', featureLeftCol, featureLeftY);
              featureLeftY += 10;

              packageInfo.included_features_details.forEach(feature => {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...darkGray);
                pdf.text(`• ${feature.name}`, featureLeftCol, featureLeftY);
                featureLeftY += 6;
              });
            }

            // Excluded features
            if (packageInfo.excluded_features_details?.length > 0) {
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.setTextColor(...mediumGray);
              pdf.text('✗ NOT INCLUDED', featureRightCol, featureRightY);
              featureRightY += 10;

              packageInfo.excluded_features_details.forEach(feature => {
                pdf.setFontSize(9);
                pdf.setFont('helvetica', 'normal');
                pdf.setTextColor(...mediumGray);
                pdf.text(`• ${feature.name}`, featureRightCol, featureRightY);
                featureRightY += 6;
              });
            }

            yPosition = Math.max(featureLeftY, featureRightY) + 15;
          }
        }

        // Question responses with better formatting
        if (selection.question_responses?.length > 0) {
          checkPageBreak(40);
          
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...primaryBlue);
          pdf.text('CUSTOMER RESPONSES', margin, yPosition);
          yPosition += 15;

          selection.question_responses.forEach((response, qIndex) => {
            checkPageBreak(20);
            
            // Question background
            pdf.setFillColor(248, 249, 250);
            pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 12, 'F');
            
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(...darkGray);
            pdf.text(`${qIndex + 1}. ${response.question_text}`, margin + 2, yPosition + 6);
            yPosition += 15;

            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...mediumGray);
            const responseText = renderQuestionResponse(response);
            yPosition += addWrappedText(`Answer: ${responseText}`, margin + 5, yPosition, contentWidth - 10) + 10;
          });
        }

        yPosition += 20;
      });
    }

    // ===== ADD-ONS SECTION =====
    if (addons?.length > 0) {
      addSectionHeader('Additional Services');

      addons.forEach((addon, index) => {
        checkPageBreak(20);
        
        // Addon item styling
        pdf.setFillColor(252, 252, 252);
        pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, 18, 'F');
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...darkGray);
        pdf.text(`${addon.name}`, margin + 2, yPosition + 6);
        
        const addonPrice = formatPrice(addon.base_price);
        const priceWidth = pdf.getTextWidth(addonPrice);
        pdf.setTextColor(...accentGreen);
        pdf.text(addonPrice, margin + contentWidth - priceWidth - 2, yPosition + 6);
        yPosition += 12;

        if (addon.description) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...mediumGray);
          yPosition += addWrappedText(addon.description, margin + 5, yPosition, contentWidth - 10) + 8;
        }
        yPosition += 5;
      });

      yPosition += 15;
    }

    // ===== PRICING SUMMARY =====
    if (status !== "declined") {
      checkPageBreak(80);
      
      addSectionHeader('Investment Summary', accentGreen);

      // Professional pricing table
      pdf.setFillColor(...lightGray);
      pdf.rect(margin + contentWidth - 120, yPosition - 5, 115, 50, 'F');
      pdf.setDrawColor(...mediumGray);
      pdf.setLineWidth(0.5);
      pdf.rect(margin + contentWidth - 120, yPosition - 5, 115, 50, 'D');

      const priceTableX = margin + contentWidth - 115;
      let priceTableY = yPosition + 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...darkGray);

      // Service price
      pdf.text('Base Service:', priceTableX, priceTableY);
      pdf.text(formatPrice(final_total - (total_addons_price || 0)), priceTableX + 80, priceTableY);
      priceTableY += 8;

      // Add-ons if any
      if (total_addons_price && parseFloat(total_addons_price) > 0) {
        pdf.text('Additional Services:', priceTableX, priceTableY);
        pdf.text(formatPrice(total_addons_price), priceTableX + 80, priceTableY);
        priceTableY += 8;
      }

      // Separator line
      pdf.setDrawColor(...darkGray);
      pdf.line(priceTableX, priceTableY + 2, priceTableX + 100, priceTableY + 2);
      priceTableY += 10;

      // Total
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...accentGreen);
      pdf.text('TOTAL INVESTMENT:', priceTableX, priceTableY);
      
      const finalTotalText = formatPrice(final_total || 0);
      const finalWidth = pdf.getTextWidth(finalTotalText);
      pdf.text(finalTotalText, priceTableX + 100 - finalWidth, priceTableY);

      yPosition += 60;
    }

    // ===== ADDITIONAL INFORMATION =====
    if (additional_data && (additional_data.signature || additional_data.additional_notes)) {
      addSectionHeader('Additional Information');

      if (additional_data.additional_notes) {
        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(...lightGray);
        
        const notesHeight = Math.max(25, (additional_data.additional_notes.length / 80) * 6 + 15);
        pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, notesHeight, 'FD');
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...mediumGray);
        pdf.text('NOTES:', margin + 3, yPosition + 8);
        yPosition += 12;

        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...darkGray);
        yPosition += addWrappedText(additional_data.additional_notes, margin + 3, yPosition, contentWidth - 6) + 20;
      }

      if (!isBidInPerson && additional_data.signature) {
        checkPageBreak(50);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryBlue);
        pdf.text('CUSTOMER APPROVAL', margin, yPosition);
        yPosition += 15;

        try {
          pdf.addImage(`data:image/png;base64,${additional_data.signature}`, 'PNG', margin, yPosition, 80, 25);
          yPosition += 30;
        } catch (error) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...mediumGray);
          pdf.text('Digital signature on file', margin, yPosition);
          yPosition += 20;
        }

        pdf.setFontSize(8);
        pdf.setTextColor(...mediumGray);
        pdf.text(`Digitally approved on: ${new Date(created_at).toLocaleDateString()}`, margin, yPosition);
        yPosition += 10;
      }
    }

    // Add footer to last page
    addFooter();

    // Generate professional filename
    const customerName = `${first_name}_${last_name}`.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Quote_${id.slice(0, 8)}_${customerName}_${dateStr}.pdf`;
    
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  } finally {
    setIsGeneratingPDF(false);
  }
};