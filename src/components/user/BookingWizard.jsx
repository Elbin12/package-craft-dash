"use client"
import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, Loader2 } from "lucide-react"
import { useCreateQuoteMutation } from "../../store/api/user/quotesApi"
import { useNavigate } from "react-router-dom"
import UserInfoForm from "./forms/UserInfoForm"
import ServiceSelectionForm from "./forms/ServiceSelectionForm"
import PackageSelectionForm from "./forms/PackageSelectionForm"
import QuestionsForm from "./forms/QuestionsForm"
import CheckoutSummary from "./forms/CheckoutSummary"
import MultiServiceSelectionForm from "./forms/MultiServiceSelectionForm"
import { useCreateQuestionResponsesMutation, useCreateServiceToSubmissionMutation, useCreateSubmissionMutation, useSubmitQuoteMutation, useUpdateSubmissionMutation } from "../../store/api/user/quoteApi"

const steps = [
  "Your Information",
  "Select Services",
  "Answer Questions",
  "Review & Submit"
];

export const BookingWizard = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [bookingData, setBookingData] = useState({
    submission_id: null,
    userInfo: {
      firstName: "",
      phone: "",
      email: "",
      address: "",
      latitude: "",
      longitude: "",
      googlePlaceId: "",
      contactId: null,
      selectedLocation: null,
      selectedHouseSize: null
    },
    selectedServices: [],
    selectedService: null,
    selectedPackage: null,
    questionAnswers: {},
    pricing: {
      basePrice: 0,
      tripSurcharge: 0,
      questionAdjustments: 0,
      totalPrice: 0,
    },
    quoteDetails: null, // Add this to store quote details
    selectedPackages: [], // Add this to store selected packages for each service
  })

  const [createSubmission, { isLoading: creating }] = useCreateSubmissionMutation()
  const [updateSubmission, { isLoading: updating }] = useUpdateSubmissionMutation()
  const [createQuote, { isLoading: creatingQuote }] = useCreateQuoteMutation()
  const [createQuestionResponses, { isLoading: submittingResponses }] = useCreateQuestionResponsesMutation()
  const [addServiceToSubmission] = useCreateServiceToSubmissionMutation();
  
  const isSavingContact = creating || updating
  const navigate = useNavigate()

  // Use useCallback to prevent infinite loops
  const updateBookingData = useCallback((stepData) => {
    setBookingData((prev) => ({ ...prev, ...stepData }))
  }, [])

  const [submitQuote, { isLoading: submittingQuote }] = useSubmitQuoteMutation();

  // Helper function to transform question answers to API format
  const transformQuestionAnswersToAPIFormat = (questionAnswers, selectedServices) => {
    const serviceResponses = {};

    // Initialize service responses for each selected service
    selectedServices.forEach(service => {
      serviceResponses[service.id] = [];
    });

    // Group answers by service and question
    Object.entries(questionAnswers).forEach(([key, value]) => {
      const parts = key.split('_');
      if (parts.length < 2) return;

      const serviceId = parts[0];
      const questionId = parts[1];

      if (!serviceResponses[serviceId]) return;

      // Find existing response for this question
      let existingResponse = serviceResponses[serviceId].find(r => r.question_id === questionId);

      if (parts.length === 2) {
        // Simple question answer (yes_no, describe, options)
        if (!existingResponse) {
          // Determine question type based on the answer format
          if (value === 'yes' || value === 'no') {
            existingResponse = {
              question_id: questionId,
              question_type: "yes_no",
              yes_no_answer: value === 'yes'
            };
          } else {
            existingResponse = {
              question_id: questionId,
              question_type: "describe", // or "options"
              selected_options: [{
                option_id: value,
                quantity: 1
              }]
            };
          }
          serviceResponses[serviceId].push(existingResponse);
        }
      } else if (parts.length === 3) {
        // Sub-question or option-based answer
        const thirdPart = parts[2];

        // Check if this is a sub-question (multiple_yes_no)
        if (value === 'yes' || value === 'no') {
          if (!existingResponse) {
            existingResponse = {
              question_id: questionId,
              question_type: "multiple_yes_no",
              sub_question_answers: []
            };
            serviceResponses[serviceId].push(existingResponse);
          }

          const subQuestionAnswer = {
            sub_question_id: thirdPart,
            answer: value === 'yes'
          };

          // Update or add sub-question answer
          const existingSubAnswer = existingResponse.sub_question_answers.find(
            sa => sa.sub_question_id === thirdPart
          );
          if (existingSubAnswer) {
            existingSubAnswer.answer = value === 'yes';
          } else {
            existingResponse.sub_question_answers.push(subQuestionAnswer);
          }
        } else if (value === 'selected') {
          // Quantity question option selection
          if (!existingResponse) {
            existingResponse = {
              question_id: questionId,
              question_type: "quantity",
              selected_options: []
            };
            serviceResponses[serviceId].push(existingResponse);
          }

          // Check if option already exists
          const existingOption = existingResponse.selected_options.find(
            opt => opt.option_id === thirdPart
          );
          if (!existingOption) {
            existingResponse.selected_options.push({
              option_id: thirdPart,
              quantity: 1
            });
          }
        }
      } else if (parts.length === 4 && parts[3] === 'quantity') {
        // Quantity value for an option
        if (!existingResponse) {
          existingResponse = {
            question_id: questionId,
            question_type: "quantity",
            selected_options: []
          };
          serviceResponses[serviceId].push(existingResponse);
        }

        const optionId = parts[2];
        const existingOption = existingResponse.selected_options.find(
          opt => opt.option_id === optionId
        );
        if (existingOption) {
          existingOption.quantity = parseInt(value) || 1;
        }
      }
    });

    return serviceResponses;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const {submission_id} = bookingData
      const { firstName, phone, email, address, contactId } = bookingData.userInfo
      if ([firstName, phone, email, address].some((v) => !v || v.trim() === "")) {
        return
      }

      const payload = {
        customer_name: firstName,
        customer_phone: phone,
        customer_email: email,
        customer_address: address,
        latitude: bookingData.userInfo.latitude || undefined,
        longitude: bookingData.userInfo.longitude || undefined,
        google_place_id: bookingData.userInfo.googlePlaceId || undefined,
        location: bookingData.userInfo.selectedLocation,
        house_sqft: bookingData.userInfo?.selectedHouseSize
      }

      try {
        let submissionResponse
        if (submission_id) {
          submissionResponse = await updateSubmission({ id: submission_id, ...payload }).unwrap()
        } else {
          submissionResponse = await createSubmission(payload).unwrap()
        }
        updateBookingData({
          submission_id: submissionResponse.submission_id,
        })
        setActiveStep((prev) => prev + 1)
      } catch (err) {
        console.error("Failed to save contact", err)
        alert("Could not save contact. Please try again.")
      }
    } else if(activeStep === 1){
      try{
        const payload = {service_ids:bookingData.selectedServices.map(service => service.id)}
        await addServiceToSubmission({submissionId:bookingData.submission_id, payload})
        setActiveStep((prevActiveStep) => prevActiveStep + 1)
      }catch(error){
        console.log(error, 'error')
      }
    }
    else if (activeStep === 2) {
      // Handle question responses submission
      try {
        const { submission_id, selectedServices, questionAnswers } = bookingData;
        
        if (!submission_id) {
          alert("Missing submission ID. Please go back and complete your information.");
          return;
        }

        if (!selectedServices || selectedServices.length === 0) {
          alert("No services selected. Please go back and select services.");
          return;
        }

        console.log(bookingData, 'dataaaa')

        // Transform question answers to API format
        const serviceResponses = transformQuestionAnswersToAPIFormat(questionAnswers, selectedServices);

        // Submit responses for each service
        const responsePromises = selectedServices.map(async (service) => {
          const responses = serviceResponses[service.id] || [];
          
          if (responses.length === 0) {
            console.log(`No responses for service ${service.id}, skipping...`);
            return;
          }

          const payload = { responses };

          console.log(payload, 'payload')
          
          try {
            const result = await createQuestionResponses({
              submissionId: submission_id,
              serviceId: service.id,
              payload
            }).unwrap();
            console.log(`Responses submitted for service ${service.id}:`, result);
            return result;
          } catch (error) {
            console.error(`Failed to submit responses for service ${service.id}:`, error);
            throw new Error(`Failed to submit responses for ${service.name}`);
          }
        });

        // Wait for all service responses to be submitted
        await Promise.all(responsePromises);
        
        console.log('All question responses submitted successfully');
        setActiveStep((prev) => prev + 1);
        
      } catch (err) {
        console.error("Failed to submit question responses", err);
        alert(`Could not submit question responses: ${err.message || 'Please try again.'}`);
      }
    } else if (activeStep === steps.length - 1) {
      await handleSubmit()
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSubmit = async () => {
    try {
      const { submission_id, selectedPackages, quoteDetails } = bookingData;
      
      if (!submission_id) {
        alert("Missing submission ID.");
        return;
      }

      if (!selectedPackages || selectedPackages.length === 0) {
        alert("Please select at least one package before submitting.");
        return;
      }

      // Prepare the payload for quote submission
      const payload = {
        customer_confirmation: true,
        selected_packages: selectedPackages.map(pkg => ({
          service_selection_id: pkg.service_selection_id,
          package_id: pkg.package_id,
          package_name: pkg.package_name,
          total_price: pkg.total_price
        })),
        additional_notes: "",
        preferred_contact_method: "email",
        preferred_start_date: new Date().toISOString().split('T')[0],
        terms_accepted: true,
        marketing_consent: false
      };

      console.log('Submitting quote with payload:', payload);
      
      await submitQuote({ submissionId: submission_id, payload }).unwrap();
      
      // Navigate to success page or quote details
      navigate(`/quote/details/${submission_id}`);
      
    } catch (err) {
      console.error("Failed to submit quote", err);
      alert("Could not submit booking. Please try again.");
    }
  }

  const handleReset = () => {
    setActiveStep(0)
    setBookingData({
      submission_id: null,
      userInfo: {
        firstName: "",
        phone: "",
        email: "",
        address: "",
        latitude: "",
        longitude: "",
        googlePlaceId: "",
        contactId: null,
        selectedLocation: null,
        selectedHouseSize: null
      },
      selectedServices: [],
      selectedService: null,
      selectedPackage: null,
      questionAnswers: {},
      pricing: {
        basePrice: 0,
        tripSurcharge: 0,
        questionAdjustments: 0,
        totalPrice: 0,
      },
      quoteDetails: null,
      selectedPackages: [],
    });
  }

  const isStepComplete = (step) => {
    switch (step) {
      case 0: {
        const { firstName = "", phone = "", email = "", address = "" } = bookingData.userInfo
        return [firstName, phone, email, address].every((v) => typeof v === "string" && v.trim() !== "")
      }
      case 1:
        return Array.isArray(bookingData.selectedServices) && bookingData.selectedServices.length > 0;
      case 2:
        return true; // Questions are optional, so always allow proceeding
      case 3:
        return bookingData.selectedPackages && bookingData.selectedPackages.length > 0;
      default:
        return false
    }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <UserInfoForm data={bookingData} onUpdate={updateBookingData} />;
      case 1:
        return <MultiServiceSelectionForm data={bookingData} onUpdate={updateBookingData} />;
      case 2:
        return <QuestionsForm data={bookingData} onUpdate={updateBookingData} />;
      case 3:
        return <CheckoutSummary data={bookingData} onUpdate={updateBookingData} />;
      default:
        return "Unknown step";
    }
  };

  const progressPercentage = ((activeStep + 1) / steps.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Service</h1>
            <p className="text-gray-600">Complete the steps below to book your service</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Step {activeStep + 1} of {steps.length}
                </span>
                <span className="text-sm font-medium text-gray-700">{Math.round(progressPercentage)}% Complete</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between items-center">
              {steps.map((label, index) => (
                <div key={label} className="flex flex-col items-center space-y-2">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                      index < activeStep
                        ? "bg-green-500 border-green-500 text-white"
                        : index === activeStep
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    {index < activeStep ? <CheckCircle className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <span
                    className={`text-xs font-medium text-center max-w-20 ${
                      index <= activeStep ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="min-h-[500px]">{getStepContent(activeStep)}</div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-8 mt-8 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={activeStep === 0}
                className="px-6 bg-transparent"
              >
                Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!isStepComplete(activeStep) || isSavingContact || submittingResponses || creatingQuote || submittingQuote}
                className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {(isSavingContact || submittingResponses || creatingQuote) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {activeStep === 0 ? "Saving..." : 
                     activeStep === 1 ? "Adding Services..." :
                     activeStep === 2 ? "Submitting Responses..." :
                     "Submitting Quote..."}
                  </>
                ) : activeStep === steps.length - 1 ? (
                  "Submit Booking"
                ) : (
                  "Next"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default BookingWizard