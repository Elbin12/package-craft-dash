export const transformSubmissionData = (submissionData) => ({
  submission_id: submissionData.id,
  userInfo: {
    firstName: submissionData.first_name || "",
    lastName: submissionData.last_name || "",
    phone: submissionData.customer_phone || "",
    email: submissionData.customer_email || "",
    address: submissionData.street_address || "",
    latitude: submissionData.latitude || "",
    longitude: submissionData.longitude || "",
    googlePlaceId: submissionData.google_place_id || "",
    contactId: null,
    selectedLocation: submissionData.location || null,
    selectedHouseSize: submissionData.size_range || null,
    projectType: submissionData?.property_type,
    propertyName: submissionData?.property_name,
    postalCode: submissionData?.property_name,
    floors: submissionData?.num_floors,
    customerStatus: submissionData?.is_previous_customer,
    heardAboutUs: submissionData?.heard_about_us,
    companyName: submissionData?.company_name,
    smsConsent: submissionData?.allow_sms,
    emailConsent: submissionData?.allow_email,
  },
  selectedServices: submissionData.service_selections.map((s) => ({
    id: s.service_details.id,
    name: s.service_details.name,
  })),
  selectedService: null,
  selectedPackage: null,
  selectedPackages: submissionData.service_selections
    .flatMap((s) =>
      s.package_quotes.filter((p) => p.is_selected).map((pkg) => ({
        service_selection_id: pkg.id,
        package_id: pkg.package,
        package_name: pkg.package_name,
        total_price: pkg.total_price,
      }))
    ),
  questionAnswers: submissionData.service_selections.reduce((acc, service) => {
    service.question_responses.forEach((response) => {
      const serviceId = service.service_details.id;
      const questionId = response.question;

      switch (response.question_type) {
        case "yes_no":
        case "conditional":
          acc[`${serviceId}_${questionId}`] = response.yes_no_answer ? "yes" : "no";
          break;

        case "describe":
        case "options":
          if (response.option_responses?.length > 0) {
            acc[`${serviceId}_${questionId}`] = response.option_responses[0].option;
          }
          break;

        case "quantity":
          response.option_responses.forEach((optResponse) => {
            acc[`${serviceId}_${questionId}_${optResponse.option}`] = "selected";
            acc[`${serviceId}_${questionId}_${optResponse.option}_quantity`] = optResponse.quantity;
          });
          break;

        case "multiple_yes_no":
          response.sub_question_responses.forEach((subResponse) => {
            acc[
              `${serviceId}_${questionId}_${subResponse.sub_question_id || subResponse.sub_question}`
            ] = subResponse.answer ? "yes" : "no";
          });
          break;
        
        case "measurement":
          response.measurement_responses.forEach((measureResponse, index) => {
            const optionKey = `${serviceId}_${questionId}_measurement_${index}_option`;
            const lengthKey = `${serviceId}_${questionId}_measurement_${index}_length`;
            const widthKey = `${serviceId}_${questionId}_measurement_${index}_width`;
            const quantityKey = `${serviceId}_${questionId}_measurement_${index}_quantity`;
            acc[optionKey] = measureResponse.option;
            acc[lengthKey] = measureResponse.length;
            acc[widthKey] = measureResponse.width;
            acc[quantityKey] = measureResponse.quantity;
            acc[optionKey] = measureResponse.option;
          });
          break;

        default:
          console.warn(`Unknown question type: ${response.question_type}`);
      }
    });
    return acc;
  }, {}),
  pricing: {
    basePrice: submissionData.total_base_price || 0,
    tripSurcharge: submissionData.total_surcharges || 0,
    questionAdjustments: submissionData.total_adjustments || 0,
    totalPrice: submissionData.final_total || 0,
  },
  quoteDetails: submissionData,
});