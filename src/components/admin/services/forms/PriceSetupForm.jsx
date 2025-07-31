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
  Button,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useCreateQuestionPricingMutation } from '../../../../store/api/questionsApi';
import { useCreateOptionPricingMutation } from '../../../../store/api/optionPricing';
import { servicesApi } from '../../../../store/api/servicesApi';
import { setEditingService } from '../../../../store/slices/servicesSlice';
import { useDispatch } from 'react-redux';

const mapFromApiPricingType = (apiType) => {
  switch (apiType) {
    case 'upcharge_percent':
      return 'upcharge';
    case 'discount_percent':
      return 'discount';
    case 'fixed_price':
      return 'bid_in_person';
    case 'ignore':
    default:
      return 'ignore';
  }
};

const PriceSetupForm = ({ data, onUpdate }) => {
  const [priceRules, setPriceRules] = useState(() => {
    const allRules = [];

    data.questions?.forEach((question) => {
      question.pricing_rules?.forEach((rule) => {
        if (question.question_type === 'yes_no') {
          allRules.push({
            questionId: question.id,
            packageId: rule.package,
            answer: 'yes',
            priceType: mapFromApiPricingType(rule.yes_pricing_type),
            value: parseFloat(rule.yes_value) || 0,
          });
        } else if (question.question_type === 'options' && question.options?.length) {
          const matchedOption = question.options.find((opt) => opt.id === rule.option);
          if (matchedOption) {
            allRules.push({
              questionId: question.id,
              packageId: rule.package,
              optionId: matchedOption.id,
              priceType: mapFromApiPricingType(rule.pricing_type),
              value: parseFloat(rule.value) || 0,
            });
          }
        }
      });
    });

    return allRules;
  });

  const [changedQuestions, setChangedQuestions] = useState({});
  const [popoverAnchor, setPopoverAnchor] = useState({
    element: null,
    questionId: '',
    packageId: '',
    answer: undefined,
    optionId: undefined,
  });

  const packages = data.packages || [];
  const questions = data.questions || [];

  const [createQuestionPricing, { isLoading }] = useCreateQuestionPricingMutation();
  const [createOptionPricing] = useCreateOptionPricingMutation();

  const dispatch = useDispatch();
  useEffect(() => {
    const rules = [];

    questions.forEach((question) => {
      packages.forEach((pkg) => {
        if (question.question_type === 'yes_no') {
          ['yes'].forEach((answer) => {
            const existingRule = priceRules.find(
              (r) =>
                r.questionId === question.id &&
                r.packageId === pkg.id &&
                r.answer === answer
            );
            rules.push(
              existingRule || {
                questionId: question.id,
                packageId: pkg.id,
                answer,
                priceType: 'ignore',
                value: 0,
              }
            );
          });
        } else if (
          question.question_type === 'options' &&
          question.options
        ) {
          question.options.forEach((option) => {
            const existingRule = priceRules.find(
              (r) =>
                r.questionId === question.id &&
                r.packageId === pkg.id &&
                r.optionId === option.id
            );
            rules.push(
              existingRule || {
                questionId: question.id,
                packageId: pkg.id,
                optionId: option.id,
                priceType: 'ignore',
                value: 0,
              }
            );
          });
        }
      });
    });

    setPriceRules(rules);
  }, [questions, packages]);

  const isValueEditable = (priceType) => !['ignore', 'bid_in_person'].includes(priceType);

  const updatePriceRule = (
    questionId,
    packageId,
    field,
    value,
    answer,
    optionId
  ) => {
    setPriceRules((prevRules) =>
      prevRules.map((rule) => {
        const matches =
          rule.questionId === questionId &&
          rule.packageId === packageId &&
          rule.answer === answer &&
          rule.optionId === optionId;

        if (matches) {
          return { ...rule, [field]: value };
        }
        return rule;
      })
    );

    setChangedQuestions((prev) => ({
      ...prev,
      [questionId]: true,
    }));
  };

  const getPriceRule = (questionId, packageId, answer, optionId) => {
    return priceRules.find(
      (r) =>
        r.questionId === questionId &&
        r.packageId === packageId &&
        r.answer === answer &&
        r.optionId === optionId
    );
  };

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
      optionId,
    });
  };

  const handlePopoverClose = () => {
    setPopoverAnchor({
      element: null,
      questionId: '',
      packageId: '',
      answer: undefined,
      optionId: undefined,
    });
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
      case 'upcharge':
        return '+';
      case 'discount':
        return '-';
      case 'bid_in_person':
        return '?';
      default:
        return '○';
    }
  };

  const getPriceTypeColor = (priceType) => {
    switch (priceType) {
      case 'upcharge':
        return 'success.main';
      case 'discount':
        return 'warning.main';
      case 'bid_in_person':
        return 'info.main';
      default:
        return 'grey.400';
    }
  };

  const mapToApiPricingType = (type) => {
    switch (type) {
      case 'upcharge':
        return 'upcharge_percent';
      case 'discount':
        return 'discount_percent';
      case 'fixed':
        return 'fixed_price';
      case 'bid_in_person':
        return 'fixed_price';
      case 'ignore':
      default:
        return 'ignore';
    }
  };

  const formatRuleForPayload = (rule) => {
    // if ignore or bid_in_person => force value zero
    const isZeroed = ['ignore', 'bid_in_person'].includes(rule.priceType);
    const rawValue = isZeroed ? 0 : rule.value || 0;
    return {
      package_id: rule.packageId,
      pricing_type: mapToApiPricingType(rule.priceType),
      value: rawValue.toFixed(2),
    };
  };

  const handleSave = async (questionId) => {
    const question = questions.find((q) => q.id === questionId);
    const rulesToSave = priceRules.filter((r) => r.questionId === questionId);

    try {
      if (question.question_type === 'yes_no') {
        const pricing_rules = rulesToSave.map(formatRuleForPayload);

        const payload = {
          question_id: questionId,
          pricing_rules,
        };

        await createQuestionPricing(payload).unwrap();
      } else if (question.question_type === 'options') {
        const options = question.options || [];

        for (const opt of options) {
          const optionRules = rulesToSave.filter((r) => r.optionId === opt.id);

          const pricing_rules = optionRules.map(formatRuleForPayload);

          const payload = {
            option_id: opt.id,
            pricing_rules,
          };

          await createOptionPricing(payload).unwrap();
        }
      }

      const fullServiceData = await dispatch(
          servicesApi.endpoints.getServiceById.initiate(data.id, { forceRefetch: true })
        ).unwrap();
      // dispatch(setEditingService(fullServiceData));
      onUpdate(fullServiceData)

      setChangedQuestions((prev) => ({ ...prev, [questionId]: false }));
      alert('Pricing saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save pricing. Please try again.');
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Price Setup
      </Typography>

      {questions.map((question) => (
        <Box key={question.id} mb={4}>
          <Typography variant="subtitle1" fontWeight="bold" mb={2}>
            {question.question_text}
          </Typography>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Options</TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={pkg.id} align="center">
                      {pkg.name}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {question.question_type === 'yes_no' ? (
                  ['yes'].map((answer) => (
                    <TableRow key={answer}>
                      <TableCell>If {answer}</TableCell>
                      {packages.map((pkg) => {
                        const rule = getPriceRule(
                          question.id,
                          pkg.id,
                          answer,
                          undefined
                        );
                        return (
                          <TableCell key={pkg.id} align="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              <TextField
                                size="small"
                                type="number"
                                value={
                                  isValueEditable(rule?.priceType)
                                    ? rule?.value ?? 0
                                    : '' // hide value when not editable
                                }
                                onChange={(e) => {
                                  if (!isValueEditable(rule?.priceType)) return;
                                  updatePriceRule(
                                    question.id,
                                    pkg.id,
                                    'value',
                                    Number(e.target.value),
                                    answer, // or undefined / option.id in options branch
                                    undefined
                                  );
                                }}
                                disabled={!isValueEditable(rule?.priceType)}
                                placeholder={!isValueEditable(rule?.priceType) ? '' : undefined}
                                sx={{ width: 80 }}
                              />

                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handlePopoverOpen(
                                    e,
                                    question.id,
                                    pkg.id,
                                    answer
                                  )
                                }
                                sx={{
                                  bgcolor: getPriceTypeColor(
                                    rule?.priceType || 'ignore'
                                  ),
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                }}
                              >
                                <Typography fontSize="small">
                                  {getPriceTypeIcon(rule?.priceType)}
                                </Typography>
                              </IconButton>
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : question.question_type === 'options' &&
                  question.options ? (
                  question.options.map((option) => (
                    <TableRow key={option.id}>
                      <TableCell>{option.option_text}</TableCell>
                      {packages.map((pkg) => {
                        const rule = getPriceRule(
                          question.id,
                          pkg.id,
                          undefined,
                          option.id
                        );
                        return (
                          <TableCell key={pkg.id} align="center">
                            <Box display="flex" alignItems="center" gap={1}>
                              <TextField
                                size="small"
                                type="number"
                                value={
                                  isValueEditable(rule?.priceType)
                                    ? rule?.value ?? 0
                                    : '' // hide value when not editable
                                }
                                onChange={(e) => {
                                  if (!isValueEditable(rule?.priceType)) return;
                                  updatePriceRule(
                                    question.id,
                                    pkg.id,
                                    'value',
                                    Number(e.target.value),
                                    undefined,
                                    option ? option.id : undefined
                                  );
                                }}
                                disabled={!isValueEditable(rule?.priceType)}
                                placeholder={!isValueEditable(rule?.priceType) ? '' : undefined}
                                sx={{ width: 80 }}
                              />

                              <IconButton
                                size="small"
                                onClick={(e) =>
                                  handlePopoverOpen(
                                    e,
                                    question.id,
                                    pkg.id,
                                    undefined,
                                    option.id
                                  )
                                }
                                sx={{
                                  bgcolor: getPriceTypeColor(
                                    rule?.priceType || 'ignore'
                                  ),
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                }}
                              >
                                <Typography fontSize="small">
                                  {getPriceTypeIcon(rule?.priceType)}
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

          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button
              variant="contained"
              color="primary"
              disabled={!changedQuestions[question.id] || isLoading}
              onClick={() => handleSave(question.id)}
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      ))}

      <Popover
        open={Boolean(popoverAnchor.element)}
        anchorEl={popoverAnchor.element}
        onClose={handlePopoverClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Box p={2}>
          <Typography variant="subtitle2" gutterBottom>
            Select Price Type
          </Typography>
          <RadioGroup
            value={
              getPriceRule(
                popoverAnchor.questionId,
                popoverAnchor.packageId,
                popoverAnchor.answer,
                popoverAnchor.optionId
              )?.priceType || 'ignore'
            }
            onChange={(e) => handlePriceTypeSelect(e.target.value)}
          >
            {['upcharge', 'discount', 'ignore', 'bid_in_person'].map(
              (type) => (
                <FormControlLabel
                  key={type}
                  value={type}
                  control={<Radio size="small" />}
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {type.replace(/_/g, ' ')}
                      </Typography>
                      <Tooltip title={`Type: ${type}`}>
                        <Info fontSize="small" />
                      </Tooltip>
                    </Box>
                  }
                />
              )
            )}
          </RadioGroup>
        </Box>
      </Popover>
    </Box>
  );
};

export default PriceSetupForm;
