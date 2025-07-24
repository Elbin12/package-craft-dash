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
} from '@mui/material';
import { Info } from '@mui/icons-material';

interface PriceRule {
  questionId: string;
  packageId: string;
  optionId?: string;
  answer?: 'yes' | 'no';
  priceType: 'upcharge' | 'discount' | 'ignore' | 'bid_in_person';
  value: number;
}

interface PriceSetupFormProps {
  data: any;
  onUpdate: (data: any) => void;
}

const PriceSetupForm: React.FC<PriceSetupFormProps> = ({
  data,
  onUpdate,
}) => {
  const [priceRules, setPriceRules] = useState<PriceRule[]>(data.pricing?.rules || []);
  const packages = data.packages || [];
  const questions = data.questions || [];

  useEffect(() => {
    const rules: PriceRule[] = [];
    
    questions.forEach((question: any) => {
      packages.forEach((pkg: any) => {
        if (question.type === 'yes_no') {
          ['yes', 'no'].forEach((answer) => {
            const existingRule = priceRules.find(
              r => r.questionId === question.id && 
                   r.packageId === pkg.id && 
                   r.answer === answer
            );
            
            rules.push(existingRule || {
              questionId: question.id,
              packageId: pkg.id,
              answer: answer as 'yes' | 'no',
              priceType: 'ignore',
              value: 0,
            });
          });
        } else if (question.type === 'options' && question.options) {
          question.options.forEach((option: any) => {
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
    questionId: string,
    packageId: string,
    field: 'priceType' | 'value',
    value: any,
    answer?: 'yes' | 'no',
    optionId?: string
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

  const getPriceRule = (questionId: string, packageId: string, answer?: 'yes' | 'no', optionId?: string) => {
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

  // Group questions by type for better display
  const groupedQuestions: Array<{question: any, options: Array<{id: string, text: string, answer?: string}>}> = [];
  
  questions.forEach((question: any) => {
    if (question.type === 'yes_no') {
      groupedQuestions.push({
        question,
        options: [
          { id: 'yes', text: 'Yes', answer: 'yes' },
          { id: 'no', text: 'No', answer: 'no' }
        ]
      });
    } else if (question.type === 'options' && question.options) {
      groupedQuestions.push({
        question,
        options: question.options.map((opt: any) => ({ id: opt.id, text: opt.text }))
      });
    }
  });

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
        What type of property do you have?
      </Typography>
      
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'grey.50', fontWeight: 'bold', minWidth: 200 }}>
                {/* Empty cell for question labels */}
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
            {groupedQuestions.map(({ question, options }) => (
              options.map((option, optionIndex) => (
                <TableRow key={`${question.id}-${option.id}`}>
                  <TableCell>
                    <Typography fontWeight="medium">
                      For: "{option.text}":
                    </Typography>
                  </TableCell>
                  {packages.map((pkg) => {
                    const rule = getPriceRule(
                      question.id, 
                      pkg.id, 
                      option.answer as 'yes' | 'no', 
                      option.answer ? undefined : option.id
                    );
                    
                    return (
                      <TableCell key={pkg.id} align="center">
                        <Box display="flex" alignItems="center" gap={1} justifyContent="center">
                          <Box display="flex" alignItems="center" gap={1}>
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
                                option.answer as 'yes' | 'no',
                                option.answer ? undefined : option.id
                              )}
                              sx={{ width: 80 }}
                            />
                            <Box 
                              sx={{ 
                                bgcolor: rule?.priceType === 'ignore' ? 'grey.200' : 'success.main',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Typography variant="caption" color="white" fontWeight="bold">
                                ○
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        
                        <Box mt={1}>
                          <RadioGroup
                            value={rule?.priceType || 'ignore'}
                            onChange={(e) => updatePriceRule(
                              question.id, 
                              pkg.id, 
                              'priceType', 
                              e.target.value,
                              option.answer as 'yes' | 'no',
                              option.answer ? undefined : option.id
                            )}
                            row
                          >
                            <Tooltip title="Add upcharge to base price">
                              <FormControlLabel
                                value="upcharge"
                                control={<Radio size="small" />}
                                label={
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Info fontSize="small" />
                                    <Typography variant="caption">Upcharge</Typography>
                                  </Box>
                                }
                              />
                            </Tooltip>
                            <Tooltip title="Apply discount to base price">
                              <FormControlLabel
                                value="discount"
                                control={<Radio size="small" />}
                                label={
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Info fontSize="small" />
                                    <Typography variant="caption">Discount</Typography>
                                  </Box>
                                }
                              />
                            </Tooltip>
                            <FormControlLabel
                              value="ignore"
                              control={<Radio size="small" />}
                              label={<Typography variant="caption">Ignore</Typography>}
                            />
                            <Tooltip title="Requires custom pricing">
                              <FormControlLabel
                                value="bid_in_person"
                                control={<Radio size="small" />}
                                label={
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <Info fontSize="small" />
                                    <Typography variant="caption">Bid In Person</Typography>
                                  </Box>
                                }
                              />
                            </Tooltip>
                          </RadioGroup>
                        </Box>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default PriceSetupForm;