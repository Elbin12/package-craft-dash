import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
  IconButton,
  Popover,
} from '@mui/material';
import { Info, MoreVert } from '@mui/icons-material';
import { Popover as PopoverUI, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

// PriceRule structure: { questionId, packageId, optionId, answer, priceType, value }
// PriceSetupFormProps: { data, onUpdate }

const PriceSetupForm = ({
  data,
  onUpdate,
}) => {
  const [priceRules, setPriceRules] = useState(data.pricing?.rules || []);
  const [popoverAnchor, setPopoverAnchor] = useState({ 
    element: null, 
    questionId: '', 
    packageId: '' 
  });
  const packages = data.packages || [];
  const questions = data.questions || [];

  console.log(packages, questions, priceRules);
  

  useEffect(() => {
    const rules = [];
    
    questions.forEach((question) => {
      packages.forEach((pkg) => {
        if (question.question_type === 'yes_no') {
          ['yes', 'no'].forEach((answer) => {
            const existingRule = priceRules.find(
              r => r.questionId === question.id && 
                   r.packageId === pkg.id && 
                   r.answer === answer
            );
            
            rules.push(existingRule || {
              questionId: question.id,
              packageId: pkg.id,
              answer: answer,
              priceType: 'ignore',
              value: 0,
            });
          });
        } else if (question.question_type === 'options' && question.options) {
          question.options.forEach((option) => {
            const existingRule = priceRules.find(
              r => r.questionId === question.id && 
                   r.packageId === pkg.id && 
                   r.optionId === option.id
            );
            
            rules.push(existingRule || {
              questionId: question.id,
              packageId: pkg.id,
              optionId: option.id,
              priceType: 'ignore',
              value: 0,
            });
          });
        }
      });
    });
    
    setPriceRules(rules);
  }, [questions, packages]);

  useEffect(() => {
    onUpdate({ pricing: { rules: priceRules } });
  }, [priceRules, onUpdate]);

  const updatePriceRule = (
    questionId,
    packageId,
    field,
    value,
    answer,
    optionId
  ) => {
    setPriceRules(prevRules =>
      prevRules.map(rule => {
        const matches = rule.questionId === questionId &&
                       rule.packageId === packageId &&
                       rule.answer === answer &&
                       rule.optionId === optionId;
        
        if (matches) {
          return { ...rule, [field]: value };
        }
        return rule;
      })
    );
  };

  const getPriceRule = (questionId, packageId, answer, optionId) => {
    return priceRules.find(
      r => r.questionId === questionId && 
           r.packageId === packageId &&
           r.answer === answer &&
           r.optionId === optionId
    );
  };

  if (packages.length === 0 || questions.length === 0) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Price Setup
        </Typography>
        <Typography color="text.secondary">
          Please create at least one package and one question before setting up pricing.
        </Typography>
      </Box>
    );
  }

  const handlePopoverOpen = (
    event,
    questionId,
    packageId,
    answer,
    optionId
  ) => {
    setPopoverAnchor({ 
      element: event.currentTarget, 
      questionId, 
      packageId, 
      answer, 
      optionId 
    });
  };

  const handlePopoverClose = () => {
    setPopoverAnchor({ element: null, questionId: '', packageId: '' });
  };

  const handlePriceTypeSelect = (priceType) => {
    updatePriceRule(
      popoverAnchor.questionId,
      popoverAnchor.packageId,
      'priceType',
      priceType,
      popoverAnchor.answer,
      popoverAnchor.optionId
    );
    handlePopoverClose();
  };

  const getPriceTypeIcon = (priceType) => {
    switch (priceType) {
      case 'upcharge': return '+';
      case 'discount': return '-';
      case 'bid_in_person': return '?';
      default: return '○';
    }
  };

  const getPriceTypeColor = (priceType) => {
    switch (priceType) {
      case 'upcharge': return 'success.main';
      case 'discount': return 'warning.main';
      case 'bid_in_person': return 'info.main';
      default: return 'grey.400';
    }
  };

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          fontWeight: 'bold',
          bgcolor: 'primary.main',
          color: 'white',
          p: 2,
          borderRadius: 1,
          mb: 3
        }}
      >
        Price Setup
      </Typography>
      
      {questions.map((question) => (
        <Box key={question.id} mb={4}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 2
            }}
          >
            {question.question_text}
          </Typography>
          
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', minWidth: 200 }}>
                    Options
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={pkg.id} align="center" sx={{ bgcolor: 'grey.50', minWidth: 200 }}>
                      <Typography variant="subtitle1" fontWeight="bold" color="primary">
                        {pkg.name}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {question.question_type === 'yes_no' ? (
                  ['yes', 'no'].map((answer) => (
                    <TableRow key={answer}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          If {answer}
                        </Typography>
                      </TableCell>
                      {packages.map((pkg) => {
                        const rule = getPriceRule(question.id, pkg.id, answer);
                        
                        return (
                          <TableCell key={pkg.id} align="center">
                            <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                              <Typography variant="body2">$</Typography>
                              <TextField
                                size="small"
                                type="number"
                                value={rule?.value || 0}
                                onChange={(e) => updatePriceRule(
                                  question.id, 
                                  pkg.id, 
                                  'value', 
                                  Number(e.target.value),
                                   answer
                                )}
                                sx={{ width: 80 }}
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => handlePopoverOpen(e, question.id, pkg.id, answer)}
                                sx={{ 
                                  bgcolor: getPriceTypeColor(rule?.priceType || 'ignore'),
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: getPriceTypeColor(rule?.priceType || 'ignore'),
                                    opacity: 0.8
                                  }
                                }}
                              >
                                <Typography variant="caption" fontWeight="bold">
                                  {getPriceTypeIcon(rule?.priceType || 'ignore')}
                                </Typography>
                              </IconButton>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : question.question_type === 'options' && question.options ? (
                  question.options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {option.question_text}
                        </Typography>
                      </TableCell>
                      {packages.map((pkg) => {
                        const rule = getPriceRule(question.id, pkg.id, undefined, option.id);
                        
                        return (
                          <TableCell key={pkg.id} align="center">
                            <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                              <Typography variant="body2">$</Typography>
                              <TextField
                                size="small"
                                type="number"
                                value={rule?.value || 0}
                                onChange={(e) => updatePriceRule(
                                  question.id, 
                                  pkg.id, 
                                  'value', 
                                  Number(e.target.value),
                                  undefined,
                                  option.id
                                )}
                                sx={{ width: 80 }}
                              />
                              <IconButton
                                size="small"
                                onClick={(e) => handlePopoverOpen(e, question.id, pkg.id, undefined, option.id)}
                                sx={{ 
                                  bgcolor: getPriceTypeColor(rule?.priceType || 'ignore'),
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                  '&:hover': {
                                    bgcolor: getPriceTypeColor(rule?.priceType || 'ignore'),
                                    opacity: 0.8
                                  }
                                }}
                              >
                                <Typography variant="caption" fontWeight="bold">
                                  {getPriceTypeIcon(rule?.priceType || 'ignore')}
                                </Typography>
                              </IconButton>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Popover
        open={Boolean(popoverAnchor.element)}
        anchorEl={popoverAnchor.element}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box p={2}>
          <Typography variant="subtitle2" gutterBottom>
            Select Price Type
          </Typography>
          <RadioGroup
            value={getPriceRule(
              popoverAnchor.questionId,
              popoverAnchor.packageId,
              popoverAnchor.answer,
              popoverAnchor.optionId
            )?.priceType || 'ignore'}
            onChange={(e) => handlePriceTypeSelect(e.target.value)}
          >
            <FormControlLabel
              value="upcharge"
              control={<Radio size="small" />}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2">Upcharge</Typography>
                  <Tooltip title="Add upcharge to base price">
                    <Info fontSize="small" />
                  </Tooltip>
                </Box>
              }
            />
            <FormControlLabel
              value="discount"
              control={<Radio size="small" />}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2">Discount</Typography>
                  <Tooltip title="Apply discount to base price">
                    <Info fontSize="small" />
                  </Tooltip>
                </Box>
              }
            />
            <FormControlLabel
              value="ignore"
              control={<Radio size="small" />}
              label={<Typography variant="body2">Ignore</Typography>}
            />
            <FormControlLabel
              value="bid_in_person"
              control={<Radio size="small" />}
              label={
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2">Bid In Person</Typography>
                  <Tooltip title="Requires custom pricing">
                    <Info fontSize="small" />
                  </Tooltip>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      </Popover>
    </Box>
  );
};

export default PriceSetupForm;