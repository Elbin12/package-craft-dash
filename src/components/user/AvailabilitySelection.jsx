import { Button, Card, CardContent } from "@mui/material";
import { CheckCircle, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

export const AvailabilitySelection = ({ onConfirm, isLoading }) => {
  const [availabilities, setAvailabilities] = useState(null);
  const showAddButton = !availabilities || availabilities.length < 2;

  const addAvailabilitySlot = () => {
    setAvailabilities((prev) => {
         const current = prev || [];
      if (current.length >= 2) return current;
      return [...current, { date: "", time: "Afternoon" }];
   });
  };

  const removeAvailabilitySlot = (index) => {
    const updated = availabilities.filter((_, i) => i !== index);
    setAvailabilities(updated);
  };

  const updateAvailability = (index, field, value) => {
    const updated = [...availabilities];
    updated[index][field] = value;
    setAvailabilities(updated);
  };

  const isValid = availabilities?.every((a) => a.date && a.time);

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(availabilities);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>

            {/* Success Message */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Great!</h2>
              <p className="text-lg text-green-600 mb-4">
                We'll be in touch shortly.
              </p>
            </div>

            {/* Availability Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                What would be some good days for us to do this?
              </h3>

              {/* Availability Inputs */}
              <div className="space-y-4 mb-6">
                {availabilities?.map((availability, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <input
                      type="date"
                      value={availability.date}
                      onChange={(e) =>
                        updateAvailability(index, "date", e.target.value)
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-700"
                      min={new Date().toISOString().split("T")[0]}
                    />
                    <select
                      value={availability.time}
                      onChange={(e) =>
                        updateAvailability(index, "time", e.target.value)
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-gray-700 bg-white"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                    </select>
                    {availabilities?.length > 0 && (
                      <button
                        onClick={() => removeAvailabilitySlot(index)}
                        className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Avai lability Button */}
              {showAddButton  && (
                <div className="flex justify-center mb-6">
                  <button
                    onClick={addAvailabilitySlot}
                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Add availability option
                  </button>
                </div>
              )}

              {/* Confirm Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleConfirm}
                  disabled={!isValid || isLoading}
                  sx={{
                    px: 2,
                    py: 0.5,
                    bgcolor: "#16a34a",
                    "&:hover": { bgcolor: "#15803d" },
                    color: "white",
                    fontWeight: 600,
                    borderRadius: "8px",
                    textTransform: "none",
                    opacity: !isValid || isLoading ? 0.5 : 1,
                    cursor: !isValid || isLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Confirm"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
