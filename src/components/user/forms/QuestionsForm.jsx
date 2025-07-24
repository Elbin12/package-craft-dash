import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

// QuestionsFormProps: { data, onUpdate }

export const QuestionsForm = ({
  data,
  onUpdate,
}) => {
  if (!data.selectedService || !data.selectedPackage) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Answer Questions
        </Typography>
        <Typography color="text.secondary">
          Please select a service and package first.
        </Typography>
      </Box>
    );
  }

  const handleAnswerChange = (questionId, answer) => {
    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [questionId]: answer,
      },
    });
  };

  const questions = data.selectedService.questions || [];

  if (questions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Answer Questions
        </Typography>
        <Typography color="text.secondary">
          No additional questions for this service. You can proceed to the next step.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Answer Questions
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Service: <strong>{data.selectedService.nickname}</strong>
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Package: <strong>{data.selectedPackage.name}</strong> (${data.selectedPackage.basePrice})
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent>
              <FormControl component="fieldset" fullWidth>
                <FormLabel component="legend" sx={{ mb: 2 }}>
                  <Typography variant="h6">
                    {index + 1}. {question.text}
                  </Typography>
                </FormLabel>
                
                <RadioGroup
                  value={data.questionAnswers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                >
                  {question.type === 'yes_no' ? (
                    <>
                      <FormControlLabel 
                        value="yes" 
                        control={<Radio />} 
                        label="Yes" 
                      />
                      <FormControlLabel 
                        value="no" 
                        control={<Radio />} 
                        label="No" 
                      />
                    </>
                  ) : (
                    question.options?.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.text}
                      />
                    ))
                  )}
                </RadioGroup>
              </FormControl>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default QuestionsForm;