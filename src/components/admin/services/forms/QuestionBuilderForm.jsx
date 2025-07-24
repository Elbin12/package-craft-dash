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
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
} from '@mui/icons-material';

// QuestionOption structure: { id, text }
// Question structure: { id, text, type, options }
// QuestionBuilderFormProps: { data, onUpdate }

const QuestionBuilderForm = ({
  data,
  onUpdate,
}) => {
  const [questions, setQuestions] = useState(data.questions || []);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    type: 'yes_no',
    options: [],
  });
  const [newOption, setNewOption] = useState('');

  const handleAddQuestion = () => {
    const questionToAdd = {
      ...newQuestion,
      id: Date.now().toString(),
    };
    const updatedQuestions = [...questions, questionToAdd];
    setQuestions(updatedQuestions);
    onUpdate({ questions: updatedQuestions });
    setQuestionDialogOpen(false);
    setNewQuestion({
      text: '',
      type: 'yes_no',
      options: [],
    });
  };

  const handleDeleteQuestion = (id) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
    onUpdate({ questions: updatedQuestions });
  };

  const handleAddOption = () => {
    if (newOption.trim()) {
      const option = {
        id: Date.now().toString(),
        text: newOption.trim(),
      };
      setNewQuestion({
        ...newQuestion,
        options: [...(newQuestion.options || []), option],
      });
      setNewOption('');
    }
  };

  const handleDeleteOption = (optionId) => {
    setNewQuestion({
      ...newQuestion,
      options: (newQuestion.options || []).filter(opt => opt.id !== optionId),
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

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Questions</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setQuestionDialogOpen(true)}
        >
          Add Question
        </Button>
      </Box>

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
                      {question.text}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip 
                        label={question.type === 'yes_no' ? 'Yes/No' : 'Multiple Options'} 
                        size="small"
                        color={question.type === 'yes_no' ? 'primary' : 'secondary'}
                      />
                    </Box>
                    {question.type === 'options' && question.options && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Options:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {question.options.map((option) => (
                            <Chip key={option.id} label={option.text} variant="outlined" size="small" />
                          ))}
                        </Box>
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
              value={newQuestion.text}
              onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
              placeholder="e.g., Do you need additional cleaning supplies?"
            />
            
            <FormControl fullWidth>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={newQuestion.type}
                label="Question Type"
                onChange={(e) => setNewQuestion({ 
                  ...newQuestion, 
                  type: e.target.value,
                  options: e.target.value === 'yes_no' ? [] : newQuestion.options 
                })}
              >
                <MenuItem value="yes_no">Yes/No</MenuItem>
                <MenuItem value="options">Multiple Options</MenuItem>
              </Select>
            </FormControl>

            {newQuestion.type === 'options' && (
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
                  {(newQuestion.options || []).map((option) => (
                    <ListItem key={option.id} divider>
                      <ListItemText primary={option.text} />
                      <ListItemSecondaryAction>
                        <IconButton onClick={() => handleDeleteOption(option.id)}>
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
          <Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddQuestion} 
            variant="contained"
            disabled={!newQuestion.text.trim()}
          >
            Add Question
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuestionBuilderForm;