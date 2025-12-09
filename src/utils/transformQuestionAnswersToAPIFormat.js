export const transformQuestionAnswersToAPIFormat = (questionAnswers, selectedServices) => {
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

      if (parts.length === 5 && parts[2] === "measurement") {
        const measurementIndex = parts[3];           // 0, 1, 2...
        const field = parts[4];                      // option | length | width | quantity

        if (!existingResponse) {
          existingResponse = {
            question_id: questionId,
            question_type: "measurement",
            measurements: []
          };
          serviceResponses[serviceId].push(existingResponse);
        }

        // Ensure measurement exists for this index
        let measurement = existingResponse.measurements.find(
          m => m.index === measurementIndex
        );

        if (!measurement) {
          measurement = {
            index: measurementIndex,
            option_id: "",
            length: 0,
            width: 0,
            quantity: 1
          };
          existingResponse.measurements.push(measurement);
        }

        // Handle each field
        if (field === "option") {
          measurement.option_id = value;
        } else if (field === "length") {
          measurement.length = parseFloat(value) || 0;
        } else if (field === "width") {
          measurement.width = parseFloat(value) || 0;
        } else if (field === "quantity") {
          measurement.quantity = parseInt(value) || 1;
        }

        return; // Stop further processing for this entry
      }

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
        // Check if this is actually a measurement question
          if (existingResponse.question_type === "measurement") {
            let existingMeasurement = existingResponse.measurements.find(
              m => m.option_id === optionId
            );
            if (!existingMeasurement) {
              existingMeasurement = {
                option_id: optionId,
                length: 0,
                width: 0,
                quantity: 1
              };
              existingResponse.measurements.push(existingMeasurement);
            }
            existingMeasurement.quantity = parseInt(value) || 1;
          } else {
            // Regular quantity question
            const existingOption = existingResponse.selected_options.find(
              opt => opt.option_id === optionId
            );
            if (existingOption) {
              existingOption.quantity = parseInt(value) || 1;
        }
        }
      }else if (parts.length === 4 && (parts[3] === 'length' || parts[3] === 'width')) {
        // Measurement question - length or width value
        const optionId = parts[2];
        const measurementType = parts[3]; // 'length' or 'width'
        
        if (!existingResponse) {
          existingResponse = {
            question_id: questionId,
            question_type: "measurement",
            measurements: []
          };
          serviceResponses[serviceId].push(existingResponse);
        }

        // Initialize measurements array if it doesn't exist
        if (!existingResponse.measurements) {
          existingResponse.measurements = [];
        }

        let existingMeasurement = existingResponse.measurements.find(
          m => m.option_id === optionId
        );
        
        if (!existingMeasurement) {
          existingMeasurement = {
            option_id: optionId,
            length: 0,
            width: 0
          };
          existingResponse.measurements.push(existingMeasurement);
        }
        
        // Update the specific measurement value
        if (measurementType === 'length') {
          existingMeasurement.length = parseFloat(value) || 0;
        } else if (measurementType === 'width') {
          existingMeasurement.width = parseFloat(value) || 0;
        }
      }
    });

    // Clean up measurement responses - remove entries with 0 length and width
    Object.keys(serviceResponses).forEach(serviceId => {
      serviceResponses[serviceId] = serviceResponses[serviceId].map(response => {
        if (response.question_type === "measurement" && response.measurements) {
          response.measurements = response.measurements.filter(
            m => m.length > 0 || m.width > 0
          );
        }
        return response;
      }).filter(response => {
        // Remove empty measurement responses
        if (response.question_type === "measurement") {
          return response.measurements && response.measurements.length > 0;
        }
        return true;
      });
    });

    return serviceResponses;
  };