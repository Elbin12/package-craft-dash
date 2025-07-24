import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

interface PriceRule {
  questionId: string;
  packageId: string;
  optionId?: string; // For option-type questions
  answer?: 'yes' | 'no'; // For yes/no questions
  priceType: 'upcharge_percent' | 'discount_percent' | 'fixed_price' | 'ignore';
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
    // Initialize price rules for all question/package combinations
    const rules: PriceRule[] = [];
    
    questions.forEach((question: any) => {
      packages.forEach((pkg: any) => {
        if (question.type === 'yes_no') {
          // Add rules for both yes and no answers
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
          // Add rules for each option
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Price Setup
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure pricing rules for each question and package combination.
      </Typography>

      {questions.map((question: any) => (
        <Card key={question.id} sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {question.text}
            </Typography>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Package</TableCell>
                    <TableCell>Base Price</TableCell>
                    {question.type === 'yes_no' ? (
                      <>
                        <TableCell>Yes - Price Type</TableCell>
                        <TableCell>Yes - Value</TableCell>
                        <TableCell>No - Price Type</TableCell>
                        <TableCell>No - Value</TableCell>
                      </>
                    ) : (
                      question.options?.map((option: any) => (
                        <React.Fragment key={option.id}>
                          <TableCell>{option.text} - Type</TableCell>
                          <TableCell>{option.text} - Value</TableCell>
                        </React.Fragment>
                      ))
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map((pkg: any) => (
                    <TableRow key={pkg.id}>
                      <TableCell>{pkg.name}</TableCell>
                      <TableCell>${pkg.basePrice}</TableCell>
                      
                      {question.type === 'yes_no' ? (
                        <>
                          {/* Yes answer */}
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={getPriceRule(question.id, pkg.id, 'yes')?.priceType || 'ignore'}
                                onChange={(e) => updatePriceRule(
                                  question.id, pkg.id, 'priceType', e.target.value, 'yes'
                                )}
                              >
                                <MenuItem value="ignore">Ignore</MenuItem>
                                <MenuItem value="upcharge_percent">Upcharge %</MenuItem>
                                <MenuItem value="discount_percent">Discount %</MenuItem>
                                <MenuItem value="fixed_price">Fixed Price</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={getPriceRule(question.id, pkg.id, 'yes')?.value || 0}
                              onChange={(e) => updatePriceRule(
                                question.id, pkg.id, 'value', Number(e.target.value), 'yes'
                              )}
                              disabled={getPriceRule(question.id, pkg.id, 'yes')?.priceType === 'ignore'}
                            />
                          </TableCell>
                          
                          {/* No answer */}
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={getPriceRule(question.id, pkg.id, 'no')?.priceType || 'ignore'}
                                onChange={(e) => updatePriceRule(
                                  question.id, pkg.id, 'priceType', e.target.value, 'no'
                                )}
                              >
                                <MenuItem value="ignore">Ignore</MenuItem>
                                <MenuItem value="upcharge_percent">Upcharge %</MenuItem>
                                <MenuItem value="discount_percent">Discount %</MenuItem>
                                <MenuItem value="fixed_price">Fixed Price</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              size="small"
                              value={getPriceRule(question.id, pkg.id, 'no')?.value || 0}
                              onChange={(e) => updatePriceRule(
                                question.id, pkg.id, 'value', Number(e.target.value), 'no'
                              )}
                              disabled={getPriceRule(question.id, pkg.id, 'no')?.priceType === 'ignore'}
                            />
                          </TableCell>
                        </>
                      ) : (
                        // Options type questions
                        question.options?.map((option: any) => (
                          <React.Fragment key={option.id}>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={getPriceRule(question.id, pkg.id, undefined, option.id)?.priceType || 'ignore'}
                                  onChange={(e) => updatePriceRule(
                                    question.id, pkg.id, 'priceType', e.target.value, undefined, option.id
                                  )}
                                >
                                  <MenuItem value="ignore">Ignore</MenuItem>
                                  <MenuItem value="upcharge_percent">Upcharge %</MenuItem>
                                  <MenuItem value="discount_percent">Discount %</MenuItem>
                                  <MenuItem value="fixed_price">Fixed Price</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={getPriceRule(question.id, pkg.id, undefined, option.id)?.value || 0}
                                onChange={(e) => updatePriceRule(
                                  question.id, pkg.id, 'value', Number(e.target.value), undefined, option.id
                                )}
                                disabled={getPriceRule(question.id, pkg.id, undefined, option.id)?.priceType === 'ignore'}
                              />
                            </TableCell>
                          </React.Fragment>
                        ))
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default PriceSetupForm;