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