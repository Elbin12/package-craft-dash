import React, { useEffect } from 'react';
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
  CircularProgress,
} from '@mui/material';
import { useGetServiceQuestionsQuery } from '../../../store/api/user/userServicesApi';

export const QuestionsForm = ({ data, onUpdate }) => {
  if (!data.selectedService || !data.selectedPackage) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Answer Questions
        </Typography>
        <Typography color="text.secondary">Please select a service and package first.</Typography>
      </Box>
    );
  }

  const {
    data: questionsRaw = [],
    isLoading,
    isError,
    error,
  } = useGetServiceQuestionsQuery({
      serviceId: data.selectedService?.id,
      packageId: data.selectedPackage?.id,
    }, {
      skip: !data.selectedService?.id,
  });

  useEffect(() => {
    if (!isLoading && !isError && questionsRaw) {
      const normalized = [...questionsRaw]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((q) => ({
          id: q.id,
          text: q.question_text,
          type: q.question_type === 'yes_no' ? 'yes_no' : 'options',
          options:
            q.question_type === 'options'
              ? [...(q.options || [])]
                  .sort((o, p) => (o.order || 0) - (p.order || 0))
                  .map((opt) => ({
                    id: opt.id,
                    text: opt.option_text,
                  }))
              : [],
        }));

      const existing = data.selectedService.questions || [];
      const same =
        JSON.stringify(existing.map((q) => ({ id: q.id, text: q.text, type: q.type }))) ===
        JSON.stringify(normalized.map((q) => ({ id: q.id, text: q.text, type: q.type })));

      if (!same) {
        onUpdate({
          selectedService: {
            ...data.selectedService,
            questions: normalized,
          },
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionsRaw, isLoading, isError]);

  const questions = data.selectedService.questions || [];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box>
        <Typography color="error">Failed to load questions: {error?.message || 'Unknown error'}</Typography>
      </Box>
    );
  }

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

  const handleAnswerChange = (questionId, answer) => {
    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [questionId]: answer,
      },
    });
  };

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
          <Card key={question.id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
              sx={{
                background: 'linear-gradient(90deg,#9333ea,#c084fc)',
                color: 'white',
                px: 2,
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {index + 1}. {question.text}
              </Typography>
            </Box>
            <CardContent>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={data.questionAnswers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                >
                  {question.type === 'yes_no' ? (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                      <FormControlLabel value="no" control={<Radio />} label="No" />
                    </Box>
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
