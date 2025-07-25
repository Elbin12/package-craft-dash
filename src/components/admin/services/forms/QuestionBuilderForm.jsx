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
  Tooltip,
} from '@mui/material';
import {
  Add,
  Block,
  Delete,
  Edit,
  Restore,
} from '@mui/icons-material';
import { useCreateQuestionMutation, useDeleteQuestionMutation, useUpdateQuestionMutation } from '../../../../store/api/questionsApi';
import { useCreateQuestionOptionMutation, useDeleteQuestionOptionMutation, useUpdateQuestionOptionMutation } from '../../../../store/api/questionOptionsApi';

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

  const [editingOptionId, setEditingOptionId] = useState(null);
  const [editingOptionText, setEditingOptionText] = useState('');

  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');

  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const [createQuestion] = useCreateQuestionMutation();
  const [createQuestionOption] = useCreateQuestionOptionMutation();
  const [updateQuestionOption] = useUpdateQuestionOptionMutation();
  const [deleteQuestionOption] = useDeleteQuestionOptionMutation();
  const [updateQuestion] = useUpdateQuestionMutation();
  const [deleteQuestion] = useDeleteQuestionMutation();

  const validateQuestion = () => {
    const newErrors = {};
    
    if (!newQuestion.question_text || newQuestion.question_text.trim().length < 5) {
      newErrors.question_text = 'Question text must be at least 5 characters';
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
    console.log(questionId, optionText, 'Adding option to question');
    
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

  const handleToggleQuestionActive = async (id, currentStatus) => {
    try {
      await deleteQuestion(id).unwrap();

      const updatedQuestions = questions.map((q) =>
        q.id === id ? { ...q, is_active: !currentStatus } : q
      );

      setQuestions(updatedQuestions);
      onUpdate({ questions: updatedQuestions });
    } catch (error) {
      console.error('Failed to toggle question active status:', error);
      setErrors({
        general:
          error?.data?.message ||
          error?.data?.detail ||
          'Failed to update question status. Please try again.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteQuestion(selectedQuestion?.id).unwrap();
      const updatedQuestions = questions.filter(q => q.id !== selectedQuestion?.id);
      setQuestions(updatedQuestions);
      onUpdate({ questions: updatedQuestions });
      setOpenConfirmModal(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Failed to permanently delete question:', error);
      setErrors({
        general:
          error?.data?.message ||
          error?.data?.detail ||
          'Failed to delete question permanently. Please try again.',
      });
      setOpenConfirmModal(false);
    }
  };

  const confirmHardDelete = (question) => {
    setSelectedQuestion(question);
    setOpenConfirmModal(true);
  };

  const handleDeleteOptionFromQuestion = async (questionId, optionId) => {
    try {
      await deleteQuestionOption(optionId).unwrap();

      const updatedQuestions = questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((opt) => opt.id !== optionId),
            }
          : q
      );

      setQuestions(updatedQuestions);
      onUpdate({ questions: updatedQuestions });
    } catch (err) {
      console.error('Failed to delete option:', err);
    }
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
                  <Box sx={{ flex: 1, alignItems: 'center' }}>
                    {editingQuestionId === question.id ? (
                      <TextField
                        size="small"  
                        variant="standard"
                        value={editingQuestionText}
                        onChange={(e) => setEditingQuestionText(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && editingQuestionText.trim()) {
                            try {
                              const updated = await updateQuestion({
                                id: question.id,
                                question_text: editingQuestionText.trim(),
                                question_type: question.question_type,
                                order: question.order,
                                service: data.id,
                              }).unwrap();

                              const updatedQuestions = questions.map((q) =>
                                q.id === question.id ? { ...q, ...updated } : q
                              );
                              setQuestions(updatedQuestions);
                              onUpdate({ questions: updatedQuestions });
                            } catch (err) {
                              console.error('Failed to update question text:', err);
                            } finally {
                              setEditingQuestionId(null);
                            }
                          } else if (e.key === 'Escape') {
                            setEditingQuestionId(null);
                          }
                        }}
                        onBlur={() => setEditingQuestionId(null)}
                        autoFocus
                        sx={{
                          pb: 1,
                          input: {
                            borderBottom: '2px solid #1976d2',
                            paddingBottom: '4px',
                          },
                          '& .MuiInput-underline:before': {
                            borderBottom: 'none',
                          },
                          '& .MuiInput-underline:after': {
                            borderBottom: '2px solid #1976d2',
                          },
                        }}
                      />
                    ) : (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6" fontSize={26} gutterBottom>{question.question_text}</Typography>
                        <Box
                          component="span"
                          sx={{
                            px: 1.2,
                            py: 0.5,
                            borderRadius: 2,
                            backgroundColor: question.is_active ? '#E8F5E9' : '#F5F5F5',
                            color: question.is_active ? '#388E3C' : '#9E9E9E',
                            fontSize: '12px',
                            display: 'inline-block',
                          }}
                        >
                          {question.is_active ? 'Active' : 'Disabled'}
                        </Box>

                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingQuestionId(question.id);
                            setEditingQuestionText(question.question_text);
                          }}
                        >
                          <Edit sx={{ fontSize: '16px', color: '#1976d2' }} />
                        </IconButton>
                      </Box>
                    )}
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
                            <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid #e0e0e0', padding: 0.5, borderRadius: 1 }}>
                              {editingOptionId === option.id ? (
                                <TextField
                                  size="small"
                                  value={editingOptionText}
                                  onChange={(e) => setEditingOptionText(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === 'Enter' && editingOptionText.trim()) {
                                      try {
                                        const result = await updateQuestionOption({
                                          id: option.id,
                                          option_text: editingOptionText.trim(),
                                          question: question.id,
                                        }).unwrap();

                                        const updatedQuestions = questions.map((q) =>
                                          q.id === question.id
                                            ? {
                                                ...q,
                                                options: q.options.map((opt) =>
                                                  opt.id === option.id ? result : opt
                                                ),
                                              }
                                            : q
                                        );

                                        setQuestions(updatedQuestions);
                                        setEditingOptionId(null);
                                      } catch (err) {
                                        console.error('Failed to update option:', err);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingOptionId(null);
                                    }
                                  }}
                                  onBlur={() => setEditingOptionId(null)}
                                  autoFocus
                                />
                              ) : (
                                <>
                                  <p className='text-sm'> {option.option_text}</p>
                                  <div className='flex justify-center'>
                                    <IconButton
                                    size="small"
                                    onClick={() => {
                                      setEditingOptionId(option.id);
                                      setEditingOptionText(option.option_text);
                                    }}
                                    sx={{ p: 0 }}
                                  >
                                    <Edit sx={{ fontSize: '14px', color:"#9CCA6D" }} />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleDeleteOptionFromQuestion(question.id, option.id)
                                    }
                                    sx={{ p: 0 }}
                                  >
                                    <Delete sx={{ fontSize: '14px', color:'#BE4B4B' }} />
                                  </IconButton>
                                  </div>
                                </>
                              )}
                            </Box>
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
                  <Tooltip title={question.is_active ? 'Disable question' : 'Enable question'}>
                    <IconButton onClick={() => handleToggleQuestionActive(question.id, question.is_active)}>
                      {question.is_active ? (
                        <Block sx={{ color: '#BE4B4B' }} />
                      ) : (
                        <Restore sx={{ color: '#4CAF50' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Permanently delete">
                  <IconButton
                    onClick={() => confirmHardDelete(question)}
                    
                  >
                    <Delete sx={{ color:'#D32F2F' }} />
                  </IconButton>
                </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Add Question Dialog */}
      <Dialog
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete <span className='text-2xl text-[#4E4FBB]'>{selectedQuestion?.question_text}</span> question?
            <br />
            This action <strong>cannot be undone</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>


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