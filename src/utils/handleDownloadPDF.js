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
      is_bid_in_person
    } = quote;

    // Format price helper
    const formatPrice = (price) => {
      const numPrice = typeof price === "string" ? Number.parseFloat(price) : price;
      return isNaN(numPrice) ? "$0.00" : `$${numPrice.toFixed(2)}`;
    };

    // Helper function to add new page if needed
    function checkPageBreak(spaceNeeded = 20) {
      const pageHeight = pdf.internal.pageSize.height;
      const footerHeight = 30; // Adjust based on your footer height
      const bottomMargin = 20;
      const maxContentY = pageHeight - footerHeight - bottomMargin;
      
      if (yPosition + spaceNeeded > maxContentY) {
        pdf.addPage();
        yPosition = margin; // Reset to top margin of new page
        
        // Re-add any headers or recurring elements for new page if needed
        // addHeader(); // Uncomment if you have a header function
      }
    }

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

    const isBase64Signature = (sig) => {
      if (!sig) return false;
      return (
        sig.startsWith("data:image") ||
        (sig.length > 200 && /^[A-Za-z0-9+/=]+$/.test(sig))
      );
    };


    // ===== HEADER SECTION =====
    // Company header with blue accent
   

  
    
    yPosition = -4;
    
    const imgData = "data:image/png;base64,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"; // paste your full base64 string here

const imgWidth = 70;
const imgHeight = 70;
const x = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;


pdf.addImage("https://storage.googleapis.com/msgsndr/wpToBiFJKYFBp5hk2bMt/media/67e1b8bd9643c1802a5e2e61.png", 'PNG', x, yPosition, imgWidth, imgHeight);
  pdf.setFontSize(14);
    pdf.text('PROPOSAL FROM', pageWidth / 2, 17, { align: "center" });
    
    yPosition += 70;
    const leftImg = "https://storage.googleapis.com/msgsndr/wpToBiFJKYFBp5hk2bMt/media/66d4e6cdcccab2915548a6e4.png";

// Set image dimensions


// Left column X position (logo)
const imgX = 0; // 20mm from left
const imgY = 50; // current top

// Draw logo on left
pdf.addImage(leftImg, 'PNG', imgX, imgY, 50, 50);

// Right column X position (text)
const textX = imgX + 60 ; // 10mm space after logo
const textWidth = pageWidth - textX - 20; // 20mm right padding

// Heading
pdf.setFontSize(14);
pdf.text('OUR PROMISE', textX, yPosition);

// Move a little below for paragraph
yPosition += 10;

// Paragraph text
pdf.setFontSize(10);
const text = `Thanks for taking the time to fill out our instant online bid. We know your time is valuable and our instant online bid feature is just one way we help to accommodate your schedule. Whether it is getting the bid done for you quickly or getting your cleaning job done right the first time, we have built our business in a way to prove to you that we are serious about your satisfaction in every way possible!
- The Clean on the Go Team!`;

// Bottom margin
const bottomMargin = 30; // 20mm from bottom

// Y position for bottom text
const bottomY = pageHeight - bottomMargin;

// Set font size
pdf.setFontSize(12);

// Text to display
const bottomText = "PREPARED FOR:";
const clientName = `${first_name} ${last_name}`;

// Calculate centered x for first line
const bottomTextWidth = pdf.getTextWidth(bottomText);
const startX = (pageWidth - bottomTextWidth) / 2;

// Draw first line centered
pdf.text(bottomText, pageWidth / 2, bottomY, { align: "center" });

// Draw second line starting from the start of first line
pdf.text(`${clientName}, ${street_address}`.toUpperCase(), startX, bottomY + 6);
// Split text to fit right column
const lines = pdf.splitTextToSize(text, textWidth);

// Draw text starting at right column
pdf.text(lines, textX, yPosition);

// Update yPosition to move below the taller of the two columns
const columnHeight = Math.max(imgHeight, lines.length * 6); // 6mm approx per line
yPosition += columnHeight + 10;
pdf.addPage();  // <-- start new page
yPosition = 20;

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
        // Disclaimers - only when needed, with subtle styling
        const generalDisclaimer = selection.service_details?.service_settings?.general_disclaimer;
        const bidDisclaimer = selection.service_details?.service_settings?.bid_in_person_disclaimer;

        if (!is_bid_in_person && generalDisclaimer) {
          // Calculate the space needed for the disclaimer
          const disclaimerLines = pdf.splitTextToSize(generalDisclaimer, contentWidth);
          const disclaimerHeight = (disclaimerLines.length * 4) + 20; // Approximate height needed
          
          checkPageBreak(disclaimerHeight);
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text('IMPORTANT DISCLAIMER:', margin, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          yPosition += addWrappedText(generalDisclaimer, margin, yPosition, contentWidth) + 15;
          
          // Additional check after adding the disclaimer text
          checkPageBreak(20);
        }

        if (is_bid_in_person && bidDisclaimer) {
          // Calculate the space needed for the bid disclaimer
          const bidDisclaimerLines = pdf.splitTextToSize(bidDisclaimer, contentWidth);
          const bidDisclaimerHeight = (bidDisclaimerLines.length * 4) + 20; // Approximate height needed
          
          checkPageBreak(bidDisclaimerHeight);
          
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...primaryBlue);
          pdf.text('NOTICE - IN-PERSON ASSESSMENT REQUIRED:', margin, yPosition);
          yPosition += 8;
          
          pdf.setFont('helvetica', 'normal');
          yPosition += addWrappedText(bidDisclaimer, margin, yPosition, contentWidth) + 15;
          
          // Additional check after adding the disclaimer text
          checkPageBreak(20);
        }

        yPosition += 20;

        // Selected Package with professional styling
        if (!is_bid_in_person && status !== "declined" && selection.package_quotes?.[0]) {
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

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...mediumGray);
      pdf.text(`${addons.length} additional service${addons.length > 1 ? 's' : ''} selected`, margin, yPosition);
      yPosition += 15;

      addons.forEach((addon, index) => {
        // Calculate height needed for this addon
        const descriptionHeight = addon.description 
          ? pdf.splitTextToSize(addon.description, contentWidth - 10).length * 4 + 8
          : 0;
        const addonHeight = 30 + descriptionHeight;
        
        checkPageBreak(addonHeight);
        
        // Addon item styling with hover effect simulation
        pdf.setFillColor(252, 252, 252);
        const boxHeight = 25 + descriptionHeight;
        pdf.rect(margin - 2, yPosition - 2, contentWidth + 4, boxHeight, 'F');
        
        // Add bottom border if not last item
        if (index < addons.length - 1) {
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.3);
          pdf.line(margin - 2, yPosition + boxHeight - 2, margin + contentWidth + 2, yPosition + boxHeight - 2);
        }
        
        // Addon name with quantity
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryBlue);
        let addonTitle = addon.addon_name;
        if (addon.quantity && addon.quantity > 1) {
          addonTitle += ` × ${addon.quantity}`;
        }
        pdf.text(addonTitle, margin + 2, yPosition + 6);
        yPosition += 10;

        // Description if exists
        if (addon.description) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...mediumGray);
          yPosition += addWrappedText(addon.description, margin + 5, yPosition, contentWidth - 10);
          yPosition += 5;
        }

        // Price per unit
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...mediumGray);
        pdf.text(`${formatPrice(addon.addon_price)} each`, margin + 5, yPosition);
        yPosition += 8;

        // Total price (quantity × unit price) - aligned to right
        const totalAddonPrice = parseFloat(addon.addon_price) * (addon.quantity || 1);
        const totalPriceText = `${formatPrice(totalAddonPrice)}`;
        const priceWidth = pdf.getTextWidth(totalPriceText);
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...accentGreen);
        pdf.text(totalPriceText, margin + contentWidth - priceWidth - 2, yPosition - 15);
        
        yPosition += 5;
      });


      yPosition += 15;
    }

    // ===== PRICING SUMMARY =====
    if (!is_bid_in_person && status !== "declined") {
      checkPageBreak(100);
      
      addSectionHeader('Pricing Summary', accentGreen);

      // Professional pricing table
      pdf.setFillColor(...lightGray);
      const tableHeight = 60 + (service_selections?.length * 8) + 
        (total_addons_price && parseFloat(total_addons_price) > 0 ? 8 : 0) +
        (quote?.applied_coupon ? 8 : 0);
      
      pdf.rect(margin + contentWidth - 120, yPosition - 5, 115, tableHeight, 'F');
      pdf.setDrawColor(...mediumGray);
      pdf.setLineWidth(0.5);
      pdf.rect(margin + contentWidth - 120, yPosition - 5, 115, tableHeight, 'D');

      const priceTableX = margin + contentWidth - 115;
      let priceTableY = yPosition + 5;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...darkGray);

      // Service prices
      service_selections?.forEach((selection) => {
        pdf.text(selection?.service_details?.name || 'Service', priceTableX, priceTableY);
        pdf.text(formatPrice(selection?.final_total_price || 0), priceTableX + 80, priceTableY);
        priceTableY += 8;
      });

      // Add-ons if any
      if (total_addons_price && parseFloat(total_addons_price) > 0) {
        pdf.text('Add-ons:', priceTableX, priceTableY);
        pdf.text(formatPrice(total_addons_price), priceTableX + 80, priceTableY);
        priceTableY += 8;
      }

      // Applied coupon if any
      if (quote?.applied_coupon) {
        pdf.setTextColor(...accentGreen);
        pdf.text(`Discount (${quote.applied_coupon.code}):`, priceTableX, priceTableY);
        pdf.text(`-${formatPrice(quote.discounted_amount)}`, priceTableX + 80, priceTableY);
        pdf.setTextColor(...darkGray);
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
      pdf.text('FINAL TOTAL:', priceTableX, priceTableY);
      
      const finalTotalText = formatPrice(final_total || 0);
      const finalWidth = pdf.getTextWidth(finalTotalText);
      pdf.text(finalTotalText, priceTableX + 100 - finalWidth, priceTableY);
      priceTableY += 8;

      yPosition += tableHeight + 10;
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

      if (!is_bid_in_person && additional_data.signature) {
        checkPageBreak(50);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryBlue);
        pdf.text('CUSTOMER APPROVAL', margin, yPosition);
        yPosition += 15;

        const sig = additional_data.signature;
        const isImage = isBase64Signature(sig);

        try {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(...darkGray);
          pdf.text('Signature:', margin, yPosition);
          yPosition += 5;

          if (isImage) {
            // image signature
            const imgSrc = sig.startsWith("data:image")
              ? sig
              : `data:image/png;base64,${sig}`;

            pdf.addImage(imgSrc, "PNG", margin, yPosition, 80, 25);
            yPosition += 30;

          } else {
            // text signature
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(...mediumGray);
            pdf.text(sig, margin, yPosition);
            yPosition += 10;
          }

        } catch (error) {
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...mediumGray);
          pdf.text('Digital signature on file', margin, yPosition);
          yPosition += 20;
        }

        pdf.setFontSize(8);
        pdf.setTextColor(...mediumGray);
        pdf.text(
          `Digitally approved on: ${new Date(created_at).toLocaleDateString()}`,
          margin,
          yPosition
        );
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