import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useCreateQuestionMutation } from '../../../../store/api/questionsApi';
import { useCreateQuestionOptionMutation } from '../../../../store/api/questionOptionsApi';

const QuestionBuilderForm = ({
  data,
  onUpdate,
}) => {
  const [questions, setQuestions] = useState(data.questions || []);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'yes_no',
    order: 1,
    options: [],
    showOptionInput: false,
  });
  const [errors, setErrors] = useState({});
  const [newOption, setNewOption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [optionInputs, setOptionInputs] = useState({});

  const [createQuestion] = useCreateQuestionMutation();
  const [createQuestionOption] = useCreateQuestionOptionMutation();

  const validateQuestion = () => {
    const newErrors = {};
    
    if (!newQuestion.question_text || newQuestion.question_text.trim().length < 5) {
      newErrors.question_text = 'Question text must be at least 5 characters';
    }
    
    if (newQuestion.question_type === 'options' && (!newQuestion.options || newQuestion.options.length < 2)) {
      newErrors.options = 'Multiple choice questions must have at least 2 options';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddQuestion = async () => {
    if (!validateQuestion()) return;
    
    setIsLoading(true);
    try {
      const questionPayload = {
        service: data.id,
        question_text: newQuestion.question_text.trim(),
        question_type: newQuestion.question_type,
        order: questions.length + 1,
      };
      
      const questionResult = await createQuestion(questionPayload).unwrap();
      
      const updatedQuestions = [...questions, {...questionResult, options: []}];
      setQuestions(updatedQuestions);
      onUpdate({ questions: updatedQuestions });
      setQuestionDialogOpen(false);
      setNewQuestion({
        question_text: '',
        question_type: 'yes_no',
        order: 1,
        options: [],
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to create question:', error);
      setErrors({ 
        general: error?.data?.message || error?.data?.detail || 'Failed to create question. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOptionToQuestion = async (questionId, optionText) => {
    if (!optionText.trim()) return;

    try {
      const payload = {
        question: questionId,
        question_id: questionId,
        option_text: optionText.trim(),
        order: 1, // or calculate based on length of existing options
      };
      const optionResult = await createQuestionOption(payload).unwrap();

      const updatedQuestions = questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [...(q.options || []), optionResult],
            }
          : q
      );

      setQuestions(updatedQuestions);
      onUpdate({ questions: updatedQuestions });
    } catch (err) {
      console.error('Failed to add option', err);
    }
  };


  const handleDeleteQuestion = (id) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
    onUpdate({ questions: updatedQuestions });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const option = {
        option_text: newOption.trim(),
        order: (newQuestion.options || []).length + 1,
      };
      setNewQuestion({
        ...newQuestion,
        options: [...(newQuestion.options || []), option],
      });
      setNewOption('');
      if (errors.options) {
        setErrors(prev => ({ ...prev, options: '' }));
      }
    }
  };

  const handleDeleteOption = (optionIndex) => {
    const updatedOptions = (newQuestion.options || []).filter((_, index) => index !== optionIndex);
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Question Builder
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Create questions that will be used for dynamic pricing calculations.
      </Typography>

      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Questions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setQuestionDialogOpen(true)}
          disabled={!data.id}
        >
          Add Question
        </Button>
      </Box>

      {!data.id && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please save the service details first before adding questions.
        </Alert>
      )}

      {questions.length === 0 ? (
        <Typography color="text.secondary">No questions created yet.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {question.question_text}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip 
                        label={question.question_type === 'yes_no' ? 'Yes/No' : 'Multiple Options'} 
                        size="small"
                        color={question.question_type === 'yes_no' ? 'primary' : 'secondary'}
                      />
                      <Chip 
                        label={`Order: ${question.order}`} 
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                    {question.question_type === 'options' && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Options:
                        </Typography>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                          {(question.options || []).map((option, index) => (
                            <Chip key={index} label={option.option_text} variant="outlined" size="small" />
                          ))}
                        </Box>

                        {/* Add Option Inline Input UI */}
                        {question.showOptionInput ? (
                          <Box display="flex" gap={1} alignItems="center" mb={2}>
                            <TextField
                              size="small"
                              label="New Option"
                              value={optionInputs[question.id] || ''}
                              onChange={(e) =>
                                setOptionInputs((prev) => ({
                                  ...prev,
                                  [question.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddOptionToQuestion(question.id, optionInputs[question.id]);
                                  setOptionInputs((prev) => ({ ...prev, [question.id]: '' }));
                                }
                              }}
                            />
                            <Button
                              onClick={() => {
                                handleAddOptionToQuestion(question.id, optionInputs[question.id]);
                                setOptionInputs((prev) => ({ ...prev, [question.id]: '' }));
                              }}
                              disabled={!optionInputs[question.id]?.trim()}
                              variant="outlined"
                            >
                              Add
                            </Button>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const updated = questions.map((q) =>
                                  q.id === question.id ? { ...q, showOptionInput: false } : q
                                );
                                setQuestions(updated);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<Add />}
                            onClick={() => {
                              const updated = questions.map((q) =>
                                q.id === question.id ? { ...q, showOptionInput: true } : q
                              );
                              setQuestions(updated);
                            }}
                          >
                            Add Option
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                  <IconButton onClick={() => handleDeleteQuestion(question.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add Question Dialog */}
      <Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Question Text"
              fullWidth
              multiline
              rows={2}
              value={newQuestion.question_text}
              onChange={(e) => {
                setNewQuestion({ ...newQuestion, question_text: e.target.value });
                if (errors.question_text) {
                  setErrors(prev => ({ ...prev, question_text: '' }));
                }
              }}
              placeholder="e.g., Do you need additional cleaning supplies?"
              error={!!errors.question_text}
              helperText={errors.question_text}
              required
            />
            
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={newQuestion.question_type}
                label="Question Type"
                onChange={(e) => setNewQuestion({ 
                  ...newQuestion, 
                  question_type: e.target.value,
                  options: e.target.value === 'yes_no' ? [] : newQuestion.options 
                })}
              >
                <MenuItem value="yes_no">Yes/No</MenuItem>
                <MenuItem value="options">Multiple Options</MenuItem>
              </Select>
            </FormControl>

            {errors.options && (
              <Typography color="error" variant="body2">
                {errors.options}
              </Typography>
            )}

            {newQuestion.question_type === 'options' && (
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Options
                </Typography>
                <Box display="flex" gap={1} mb={2}>
                  <TextField
                    label="Add Option"
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddOption}
                    disabled={!newOption.trim()}
                  >
                    Add
                  </Button>
                </Box>
                
                <List>
                  {(newQuestion.options || []).map((option, index) => (
                    <ListItem key={index} divider>
                      <ListItemText 
                        primary={option.option_text} 
                        secondary={`Order: ${option.order}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleDeleteOption(index)}>
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setQuestionDialogOpen(false);
            setErrors({});
            setNewQuestion({
              question_text: '',
              question_type: 'yes_no',
              order: 1,
              options: [],
            });
          }}>Cancel</Button>
          <Button 
            onClick={handleAddQuestion} 
            variant="contained"
            disabled={!newQuestion.question_text.trim() || isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Add Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionBuilderForm;