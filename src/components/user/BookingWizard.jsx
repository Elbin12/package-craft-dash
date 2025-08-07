"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, Loader2 } from "lucide-react"
import { useCreateContactMutation, useUpdateContactMutation } from "../../store/api/user/contactsApi"
import { useCreateQuoteMutation } from "../../store/api/user/quotesApi"
import { useNavigate } from "react-router-dom"
import UserInfoForm from "./forms/UserInfoForm"
import ServiceSelectionForm from "./forms/ServiceSelectionForm"
import PackageSelectionForm from "./forms/PackageSelectionForm"
import QuestionsForm from "./forms/QuestionsForm"
import CheckoutSummary from "./forms/CheckoutSummary"
import MultiServiceSelectionForm from "./forms/MultiServiceSelectionForm"

const steps = [
  "Select Services",
  "Your Information",
  "Answer Questions",
  "Review & Submit"
];

export const BookingWizard = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [bookingData, setBookingData] = useState({
    userInfo: {
      firstName: "",
      phone: "",
      email: "",
      address: "",
      latitude: "",
      longitude: "",
      googlePlaceId: "",
      contactId: null,
      selectedLocation:null,
      selectedHouseSize:null
    },
    selectedServices:[],
    selectedService: null,
    selectedPackage: null,
    questionAnswers: {},
    pricing: {
      basePrice: 0,
      tripSurcharge: 0,
      questionAdjustments: 0,
      totalPrice: 0,
    },
  })

  const [createContact, { isLoading: creating }] = useCreateContactMutation()
  const [updateContact, { isLoading: updating }] = useUpdateContactMutation()
  const [createQuote, { isLoading: creatingQuote }] = useCreateQuoteMutation()
  const isSavingContact = creating || updating
  const navigate = useNavigate()

  const handleNext = async () => {
    if (activeStep === 1) {
      const { firstName, phone, email, address, contactId } = bookingData.userInfo
      if ([firstName, phone, email, address].some((v) => !v || v.trim() === "")) {
        return
      }

      const payload = {
        first_name: firstName,
        phone_number: phone,
        email,
        address,
        latitude: bookingData.userInfo.latitude || undefined,
        longitude: bookingData.userInfo.longitude || undefined,
        google_place_id: bookingData.userInfo.googlePlaceId || undefined,
        location: bookingData.userInfo.selectedLocation,
        house_sqft: bookingData.userInfo.selectedHouseSize
      }

      try {
        let contactResponse
        if (contactId) {
          contactResponse = await updateContact({ id: contactId, ...payload }).unwrap()
        } else {
          contactResponse = await createContact(payload).unwrap()
        }
        updateBookingData({
          userInfo: {
            ...bookingData.userInfo,
            contactId: contactResponse.id,
          },
        })
        setActiveStep((prev) => prev + 1)
      } catch (err) {
        console.error("Failed to save contact", err)
        alert("Could not save contact. Please try again.")
      }
    } else if (activeStep === steps.length - 1) {
      handleSubmit()
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const handleSubmit = async () => {
    const contactId = bookingData.userInfo?.contactId
    const serviceId = bookingData.selectedService?.id
    const packageId = bookingData.selectedPackage?.id
    if (!contactId || !serviceId || !packageId) {
      alert("Missing required booking info.")
      return
    }

    const questions = bookingData.selectedService?.questions || []
    const answersPayload = questions.map((q) => {
      const ans = bookingData.questionAnswers[q.id]
      if (q.type === "yes_no") {
        return {
          question_id: q.id,
          yes_no_answer: ans === "yes",
        }
      } else {
        return {
          question_id: q.id,
          selected_option_id: ans,
        }
      }
    })

    const payload = {
      contact_id: contactId,
      service_id: serviceId,
      package_id: packageId,
      answers: answersPayload,
    }

    try {
      const quoteResponse = await createQuote(payload).unwrap()
      if (quoteResponse?.id) {
        navigate(`/quote/details/${quoteResponse.id}`)
      }
    } catch (err) {
      console.error("Failed to create quote", err)
      alert("Could not submit booking. Please try again.")
    }
    handleReset()
  }

  const handleReset = () => {
    setActiveStep(0)
    setBookingData({
      userInfo: {
        firstName: "",
        phone: "",
        email: "",
        address: "",
        latitude: "",
        longitude: "",
        googlePlaceId: "",
        contactId: null,
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
      availableLocations: [],
      availableSizes: [],
    });

  }

  const updateBookingData = (stepData) => {
    setBookingData((prev) => ({ ...prev, ...stepData }))
  }

  const isStepComplete = (step) => {
    switch (step) {
      case 0:
        return Array.isArray(bookingData.selectedServices) && bookingData.selectedServices.length > 0;
      case 1: {
        const { firstName = "", phone = "", email = "", address = "" } = bookingData.userInfo
        return [firstName, phone, email, address].every((v) => typeof v === "string" && v.trim() !== "")
      }
      case 2:
        return bookingData.selectedService !== null
      // case 3:
      //   return bookingData.selectedPackage !== null
      case 3:
        return (
          bookingData.selectedService?.questions?.every((q) => bookingData.questionAnswers[q.id] !== undefined) ?? true
        )
      case 4:
        return (
          Boolean(bookingData.selectedService && bookingData.selectedPackage) &&
          (bookingData.selectedService?.questions?.every((q) => bookingData.questionAnswers[q.id] !== undefined) ??
            true)
        )
      default:
        return false
    }
  }

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return <MultiServiceSelectionForm data={bookingData} onUpdate={updateBookingData} />;
      case 1:
        return <UserInfoForm data={bookingData} onUpdate={updateBookingData} />;
      // case 2:
      //   return <PackageSelectionForm data={bookingData} onUpdate={updateBookingData} />;
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
                disabled={!isStepComplete(activeStep) || (activeStep === 0 && isSavingContact)}
                className="px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {(activeStep === 0 && isSavingContact) || creatingQuote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {activeStep === 0 ? "Saving..." : "Submitting..."}
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
