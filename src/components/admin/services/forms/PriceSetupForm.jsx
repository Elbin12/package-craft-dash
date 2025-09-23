"use client"

import { useState, useEffect, useMemo } from "react"
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
  Menu,
  MenuItem,
} from "@mui/material"
import { Info, AttachMoney, Percent } from "@mui/icons-material"
import { useCreateQuestionPricingMutation } from "../../../../store/api/questionsApi"
import { useCreateOptionPricingMutation } from "../../../../store/api/optionPricing"
import { servicesApi, useGetBasePricesQuery,  } from "../../../../store/api/servicesApi"
import { useDispatch } from "react-redux"
import { useCreateSubQuestionPricingMutation, useUpdateServicePackageSizeMappingMutation } from "../../../../store/api/questionSubQuestionsApi"

const mapFromApiPricingType = (apiType) => {
  switch (apiType) {
    case "upcharge_percent":
      return "upcharge"
    case "discount_percent":
      return "discount"
    case "fixed_price":
      return "bid_in_person"
    case "ignore":
    default:
      return "ignore"
  }
}

// Helper to flatten nested questions for easier state management
const flattenQuestions = (questionsArray) => {
  let allQuestions = []
  questionsArray.forEach((q) => {
    allQuestions.push(q)
    if (q.sub_questions && q.sub_questions.length > 0) {
      allQuestions = allQuestions.concat(flattenQuestions(q.sub_questions))
    }
    if (q.child_questions && q.child_questions.length > 0) {
      allQuestions = allQuestions.concat(flattenQuestions(q.child_questions))
    }
  })
  return allQuestions
}

const PriceSetupForm = ({ data, onUpdate }) => {
  const { data: basePrices = [], isLoading: basePriceLoading, refetch: refetchBasePrices } = useGetBasePricesQuery(data.id,{
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,}
  )
  const [updateBasePrice] = useUpdateServicePackageSizeMappingMutation()

  const [editingPrices, setEditingPrices] = useState({})

  console.log(editingPrices, 'editingPrices')

  const packages = data.packages.filter((f)=>f.is_active) || []
  const topLevelQuestions = data.questions || []

  // Flatten all questions for easier state management
  const flattenedQuestions = useMemo(() => flattenQuestions(topLevelQuestions), [topLevelQuestions])

  const [priceRules, setPriceRules] = useState(() => {
    const allRules = []
    flattenedQuestions.forEach((question) => {
      if (question.question_type === "multiple_yes_no") {
        question.sub_questions?.forEach((subQ) => {
          subQ.pricing_rules?.forEach((rule) => {
            allRules.push({
              questionId: subQ.id, // Use sub_question ID for multiple_yes_no sub-questions
              packageId: rule.package,
              answer: "yes", // Assuming sub-questions are always yes/no
              priceType: mapFromApiPricingType(rule.yes_pricing_type),
              value: Number.parseFloat(rule.yes_value) || 0,
              valueType: rule.value_type || "amount", // Default to amount
            })
          })
        })
      } else {
        question.pricing_rules?.forEach((rule) => {
          if (question.question_type === "yes_no") {
            allRules.push({
              questionId: question.id,
              packageId: rule.package,
              answer: "yes",
              priceType: mapFromApiPricingType(rule.yes_pricing_type),
              value: Number.parseFloat(rule.yes_value) || 0,
              valueType: rule.value_type || "amount", // Default to amount
            })
          } else if (question.options && question.options.length > 0) {
            const matchedOption = question.options.find((opt) => opt.id === rule.option)
            if (matchedOption) {
              allRules.push({
                questionId: question.id,
                packageId: rule.package,
                optionId: matchedOption.id,
                priceType: mapFromApiPricingType(rule.pricing_type),
                value: Number.parseFloat(rule.value) || 0,
                valueType: rule.value_type || "amount", // Default to amount
              })
            }
          }
        })
      }
    })
    return allRules
  })

  const [changedQuestions, setChangedQuestions] = useState({})
  const [popoverAnchor, setPopoverAnchor] = useState({
    element: null,
    questionId: "",
    packageId: "",
    answer: undefined,
    optionId: undefined,
  })

  // State for managing value type dropdown menus
  const [valueTypeMenus, setValueTypeMenus] = useState({})

  const [createQuestionPricing, { isLoading }] = useCreateQuestionPricingMutation()
  const [createOptionPricing] = useCreateOptionPricingMutation()
  const [createSubQuestionPricing] = useCreateSubQuestionPricingMutation()
  const dispatch = useDispatch()

  useEffect(() => {
    const rules = []
    flattenedQuestions.forEach((question) => {
      packages.forEach((pkg) => {
        if (question.question_type === "yes_no") {
          // For simple yes_no, we create a rule for the 'yes' answer
          const existingRule = priceRules.find(
            (r) => r.questionId === question.id && r.packageId === pkg.id && r.answer === "yes",
          )
          rules.push(
            existingRule || {
              questionId: question.id,
              packageId: pkg.id,
              answer: "yes",
              priceType: "ignore",
              value: 0,
              valueType: "amount", // Default to amount
            },
          )
        } else if (question.question_type === "multiple_yes_no") {
          // For multiple_yes_no, rules are tied to sub_question.id
          question.sub_questions?.forEach((subQ) => {
            const existingRule = priceRules.find(
              (r) => r.questionId === subQ.id && r.packageId === pkg.id && r.answer === "yes",
            )
            rules.push(
              existingRule || {
                questionId: subQ.id, // Use sub_question ID here
                packageId: pkg.id,
                answer: "yes",
                priceType: "ignore",
                value: 0,
                valueType: "amount", // Default to amount
              },
            )
          })
        } else if (question.options && question.options.length > 0) {
          // For questions with options (describe, multiple_choice, conditional child questions with options)
          question.options.forEach((option) => {
            const existingRule = priceRules.find(
              (r) => r.questionId === question.id && r.packageId === pkg.id && r.optionId === option.id,
            )
            rules.push(
              existingRule || {
                questionId: question.id,
                packageId: pkg.id,
                optionId: option.id,
                priceType: "ignore",
                value: 0,
                valueType: "amount", // Default to amount
              },
            )
          })
        }
      })
    })
    if (JSON.stringify(rules) !== JSON.stringify(priceRules)) {
    setPriceRules(rules)
  }
  }, [flattenedQuestions, packages])

  const isValueEditable = (priceType) => !["ignore", "bid_in_person"].includes(priceType)

  const updatePriceRule = (questionId, packageId, field, value, answer, optionId) => {
    setPriceRules((prevRules) =>
      prevRules.map((rule) => {
        const matches =
          rule.questionId === questionId &&
          rule.packageId === packageId &&
          rule.answer === answer &&
          rule.optionId === optionId
        if (matches) {
          return { ...rule, [field]: value }
        }
        return rule
      }),
    )

    // Find the actual question object that was modified (could be a sub-question or child question)
    const modifiedQuestion = flattenedQuestions.find((q) => q.id === questionId)

    let topLevelQuestionIdToMarkChanged = questionId // Default to itself

    if (modifiedQuestion) {
      // Find the immediate parent in the flattened list that has this question as a child/sub-question
      const parentQuestion = flattenedQuestions.find(
        (q) =>
          (q.sub_questions && q.sub_questions.some((subQ) => subQ.id === modifiedQuestion.id)) ||
          (q.child_questions && q.child_questions.some((childQ) => childQ.id === modifiedQuestion.id)),
      )

      if (parentQuestion) {
        topLevelQuestionIdToMarkChanged = parentQuestion.id
      }
    }

    setChangedQuestions((prev) => ({
      ...prev,
      [topLevelQuestionIdToMarkChanged]: true,
    }))
  }

  const getPriceRule = (questionId, packageId, answer, optionId) => {
    return priceRules.find(
      (r) => r.questionId === questionId && r.packageId === packageId && r.answer === answer && r.optionId === optionId,
    )
  }

  const handlePopoverOpen = (event, questionId, packageId, answer, optionId) => {
    setPopoverAnchor({
      element: event.currentTarget,
      questionId,
      packageId,
      answer,
      optionId,
    })
  }

  const handlePopoverClose = () => {
    setPopoverAnchor({
      element: null,
      questionId: "",
      packageId: "",
      answer: undefined,
      optionId: undefined,
    })
  }

  const handlePriceTypeSelect = (priceType) => {
    if (popoverAnchor.basePriceId) {
      // Base Price case
      setEditingPrices((prev) => ({
        ...prev,
        [popoverAnchor.basePriceId]: {
          ...(prev[popoverAnchor.basePriceId] || {}),
          priceType,
          value: prev[popoverAnchor.basePriceId]?.value ?? 0, // keep value
        },
      }))
    } else {
      // Question Pricing case
      updatePriceRule(
        popoverAnchor.questionId,
        popoverAnchor.packageId,
        "priceType",
        priceType,
        popoverAnchor.answer,
        popoverAnchor.optionId,
      )
    }
    handlePopoverClose()
  }


  const handleValueTypeMenuOpen = (event, questionId, packageId, answer, optionId) => {
    const menuKey = `${questionId}-${packageId}-${answer || 'undefined'}-${optionId || 'undefined'}`
    setValueTypeMenus(prev => ({
      ...prev,
      [menuKey]: event.currentTarget
    }))
  }

  const handleValueTypeMenuClose = (questionId, packageId, answer, optionId) => {
    const menuKey = `${questionId}-${packageId}-${answer || 'undefined'}-${optionId || 'undefined'}`
    setValueTypeMenus(prev => {
      const newMenus = { ...prev }
      delete newMenus[menuKey]
      return newMenus
    })
  }

  const handleValueTypeSelect = (questionId, packageId, answer, optionId, valueType) => {
    updatePriceRule(questionId, packageId, "valueType", valueType, answer, optionId)
    handleValueTypeMenuClose(questionId, packageId, answer, optionId)
  }

  const getPriceTypeIcon = (priceType) => {
    switch (priceType) {
      case "upcharge":
        return "+"
      case "discount":
        return "-"
      case "bid_in_person":
        return "?"
      default:
        return "○"
    }
  }

  const getPriceTypeColor = (priceType) => {
    switch (priceType) {
      case "upcharge":
        return "success.main"
      case "discount":
        return "warning.main"
      case "bid_in_person":
        return "info.main"
      default:
        return "grey.400"
    }
  }

  const mapToApiPricingType = (type) => {
    switch (type) {
      case "upcharge":
        return "upcharge_percent"
      case "discount":
        return "discount_percent"
      case "fixed":
      case "bid_in_person":
        return "fixed_price"
      case "ignore":
      default:
        return "ignore"
    }
  }

  const formatRuleForPayload = (rule) => {
    const isZeroed = ["ignore", "bid_in_person"].includes(rule.priceType)
    const rawValue = isZeroed ? 0 : rule.value || 0
    return {
      package_id: rule.packageId,
      pricing_type: mapToApiPricingType(rule.priceType),
      value: rawValue.toFixed(2),
      value_type: rule.valueType || "amount", // Include value_type in payload
    }
  }

  const handleSave = async (questionId, isRecursiveCall = false) => {
    const questionToSave = flattenedQuestions.find((q) => q.id === questionId)
    if (!questionToSave) return

    try {
      if (questionToSave.question_type === "yes_no") {
        // This handles simple yes_no questions (top-level or conditional child)
        const rulesToSave = priceRules.filter((r) => r.questionId === questionId)
        const pricing_rules = rulesToSave.map(formatRuleForPayload)
        const payload = {
          question_id: questionId, // Default for top-level yes_no or conditional child yes_no
          pricing_rules,
        }
        // Adjust payload key if it's a conditional child question (as per user's example)
        // if (questionToSave.is_conditional && questionToSave.parent_question) {
        //   payload.question = questionId // Use 'question' key for conditional child
        //   delete payload.question_id
        // }
        await createQuestionPricing(payload).unwrap() // Use createQuestionPricing for yes_no types (including conditional children)
      } else if (questionToSave.question_type === "multiple_yes_no") {
        // This handles multiple_yes_no questions and their sub_questions
        const subQuestions = questionToSave.sub_questions || []
        for (const subQ of subQuestions) {
          const subQRules = priceRules.filter((r) => r.questionId === subQ.id) // Rules are tied to sub_question ID
          const pricing_rules = subQRules.map(formatRuleForPayload)
          const payload = {
            sub_question_id: subQ.id, // Use 'sub_question_id' key for sub-questions
            pricing_rules,
          }
          await createSubQuestionPricing(payload).unwrap()
        }
      } else if (questionToSave.question_type === "conditional") {
        // This handles conditional questions by recursively saving their child_questions
        const childQuestions = questionToSave.child_questions || []
        for (const childQ of childQuestions) {
          await handleSave(childQ.id, true) // Pass true for recursive calls
        }
      } else if (questionToSave.options && questionToSave.options.length > 0) {
        // This handles questions with options (e.g., describe, multiple_choice)
        // This applies to top-level, sub-questions, and conditional child questions with options
        const options = questionToSave.options || []
        for (const opt of options) {
          const optionRules = priceRules.filter((r) => r.questionId === questionId && r.optionId === opt.id) // Filter by current questionId and optionId
          const pricing_rules = optionRules.map(formatRuleForPayload)
          const payload = {
            option_id: opt.id,
            pricing_rules,
          }
          await createOptionPricing(payload).unwrap()
        }
      }

      // Only perform these actions if it's the initial call (not a recursive one)
      if (!isRecursiveCall) {
        const fullServiceData = await dispatch(
          servicesApi.endpoints.getServiceById.initiate(data.id, { forceRefetch: true }),
        ).unwrap()
        onUpdate(fullServiceData)
        setChangedQuestions((prev) => ({ ...prev, [questionId]: false })) // Clear the flag for the top-level question
        alert("Pricing saved successfully!")
      }
    } catch (err) {
      console.error(err)
      // Error handling should also be conditional or handled differently for recursive calls
      if (!isRecursiveCall) {
        alert("Failed to save pricing. Please try again.")
      }
      // Re-throw the error so the parent conditional can catch it if needed
      throw err
    }
  }

  // Recursive rendering function for questions and their nested children
  const renderQuestionTable = (question, level = 0) => {
    const questionDisplayTitle = question.question_text || question.sub_question_text

    // Conditional questions are special: they don't have their own pricing table,
    // but act as containers for child questions based on conditions.
    if (question.question_type === "conditional") {
      return (
        <Box key={question.id} mb={4} pl={level * 2}>
          <Typography variant="subtitle1" fontWeight="bold" fontSize={30} mb={2}>
            {questionDisplayTitle}
          </Typography>
          {/* Assuming 'If Yes' is the primary condition for display based on the image */}
          <Box mt={2} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={1}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              If Yes
            </Typography>
            {question.child_questions && question.child_questions.length > 0 && (
              <Box>{question.child_questions.map((childQ) => renderQuestionTable(childQ, level + 1))}</Box>
            )}
          </Box>
          <Box display="flex" justifyContent="flex-end" mt={1}>
            <Button
              variant="contained"
              color="primary"
              disabled={!changedQuestions[question.id] || isLoading}
              onClick={() => handleSave(question.id)}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </Box>
        </Box>
      )
    }

    // For all other question types (yes_no, multiple_yes_no, describe, multiple_choice, etc.)
    // and for child questions of conditional types.
    return (
      <Box key={question.id} mb={4} pl={level * 2}>
        <Typography variant="subtitle1" fontWeight="bold" fontSize={30} mb={2}>
          {questionDisplayTitle}
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
              {/* Handle yes_no and multiple_yes_no questions */}
              {question.question_type === "yes_no" || question.question_type === "multiple_yes_no"
                ? (question.question_type === "multiple_yes_no" &&
                  question.sub_questions &&
                  question.sub_questions.length > 0
                    ? question.sub_questions
                    : [{ id: question.id, sub_question_text: `If Yes` }]
                  ) // For simple yes_no, treat it as a single item
                    .map((item) => {
                      const currentQuestionId = item.id
                      const rowLabel = item.sub_question_text || `For: "Yes":` // Use sub_question_text for sub_questions, 'For: "Yes":' for simple yes_no

                      return (
                        <TableRow key={currentQuestionId}>
                          <TableCell>{rowLabel}</TableCell>
                          {packages.map((pkg) => {
                            const rule = getPriceRule(currentQuestionId, pkg.id, "yes", undefined)
                            const menuKey = `${currentQuestionId}-${pkg.id}-yes-undefined`
                            
                            return (
                              <TableCell key={pkg.id} align="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Box display="flex" alignItems="center" position="relative">
                                    <TextField
                                      size="small"
                                      type="number"
                                      value={isValueEditable(rule?.priceType) ? (rule?.value ?? 0) : ""}
                                      onChange={(e) => {
                                        if (!isValueEditable(rule?.priceType)) return
                                        updatePriceRule(
                                          currentQuestionId,
                                          pkg.id,
                                          "value",
                                          Number(e.target.value),
                                          "yes",
                                          undefined,
                                        )
                                      }}
                                      disabled={!isValueEditable(rule?.priceType)}
                                      placeholder={!isValueEditable(rule?.priceType) ? "" : undefined}
                                      sx={{ 
                                        width: 100,
                                        minWidth: 80,
                                        '& .MuiInputBase-input': {
                                          paddingLeft: '32px', // Make room for the icon
                                          textAlign: 'right',
                                        }
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleValueTypeMenuOpen(e, currentQuestionId, pkg.id, "yes", undefined)}
                                      disabled={!isValueEditable(rule?.priceType)}
                                      sx={{
                                        position: 'absolute',
                                        left: '4px',
                                        zIndex: 1 ,
                                        width: 20,
                                        height: 20,
                                        bgcolor: 'rgba(0, 0, 0, 0.1)',
                                        '&:hover': {
                                          bgcolor: 'rgba(0, 0, 0, 0.2)',
                                        }
                                      }}
                                    >
                                      {rule?.valueType === "percent" ? (
                                        <Percent sx={{ fontSize: 12 }} />
                                      ) : (
                                        <AttachMoney sx={{ fontSize: 12 }} />
                                      )}
                                    </IconButton>
                                    <Menu
                                      anchorEl={valueTypeMenus[menuKey]}
                                      open={Boolean(valueTypeMenus[menuKey])}
                                      onClose={() => handleValueTypeMenuClose(currentQuestionId, pkg.id, "yes", undefined)}
                                    >
                                      <MenuItem 
                                        onClick={() => handleValueTypeSelect(currentQuestionId, pkg.id, "yes", undefined, "amount")}
                                        selected={rule?.valueType === "amount"}
                                      >
                                        <AttachMoney sx={{ mr: 1, fontSize: 16 }} />
                                        Price
                                      </MenuItem>
                                      <MenuItem 
                                        onClick={() => handleValueTypeSelect(currentQuestionId, pkg.id, "yes", undefined, "percent")}
                                        selected={rule?.valueType === "percent"}
                                      >
                                        <Percent sx={{ mr: 1, fontSize: 16 }} />
                                        Percent
                                      </MenuItem>
                                    </Menu>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handlePopoverOpen(e, currentQuestionId, pkg.id, "yes")}
                                    sx={{
                                      bgcolor: getPriceTypeColor(rule?.priceType || "ignore"),
                                      color: "white",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <Typography fontSize="small">{getPriceTypeIcon(rule?.priceType)}</Typography>
                                  </IconButton>
                                </Box>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      )
                    })
                : // Handle questions with options (describe, multiple_choice, etc.)
                  question.options && question.options.length > 0
                  ? question.options.map((option) => (
                      <TableRow key={option.id}>
                        <TableCell>{option.option_text}</TableCell>
                        {packages.map((pkg) => {
                          const rule = getPriceRule(question.id, pkg.id, undefined, option.id)
                          const menuKey = `${question.id}-${pkg.id}-undefined-${option.id}`
                          
                          return (
                            <TableCell key={pkg.id} align="center">
                              <Box display="flex" alignItems="center" gap={1}>
                                <Box display="flex" alignItems="center" position="relative">
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={isValueEditable(rule?.priceType) ? (rule?.value ?? 0) : ""}
                                    onChange={(e) => {
                                      if (!isValueEditable(rule?.priceType)) return
                                      updatePriceRule(
                                        question.id,
                                        pkg.id,
                                        "value",
                                        Number(e.target.value),
                                        undefined,
                                        option.id,
                                      )
                                    }}
                                    disabled={!isValueEditable(rule?.priceType)}
                                    placeholder={!isValueEditable(rule?.priceType) ? "" : undefined}
                                    sx={{ 
                                      width: 100,
                                      minWidth:80,
                                      '& .MuiInputBase-input': {
                                        paddingLeft: '32px', // Make room for the icon
                                        textAlign: 'right',
                                      }
                                    }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleValueTypeMenuOpen(e, question.id, pkg.id, undefined, option.id)}
                                    disabled={!isValueEditable(rule?.priceType)}
                                    sx={{
                                      position: 'absolute',
                                      left: '4px',
                                      zIndex: 1,
                                      width: 20,
                                      height: 20,
                                      bgcolor: 'rgba(0, 0, 0, 0.1)',
                                      '&:hover': {
                                        bgcolor: 'rgba(0, 0, 0, 0.2)',
                                      }
                                    }}
                                  >
                                    {rule?.valueType === "percent" ? (
                                      <Percent sx={{ fontSize: 12 }} />
                                    ) : (
                                      <AttachMoney sx={{ fontSize: 12 }} />
                                    )}
                                  </IconButton>
                                  <Menu
                                    anchorEl={valueTypeMenus[menuKey]}
                                    open={Boolean(valueTypeMenus[menuKey])}
                                    onClose={() => handleValueTypeMenuClose(question.id, pkg.id, undefined, option.id)}
                                  >
                                    <MenuItem 
                                      onClick={() => handleValueTypeSelect(question.id, pkg.id, undefined, option.id, "amount")}
                                      selected={rule?.valueType === "amount"}
                                    >
                                      <AttachMoney sx={{ mr: 1, fontSize: 16 }} />
                                      Price
                                    </MenuItem>
                                    <MenuItem 
                                      onClick={() => handleValueTypeSelect(question.id, pkg.id, undefined, option.id, "percent")}
                                      selected={rule?.valueType === "percent"}
                                    >
                                      <Percent sx={{ mr: 1, fontSize: 16 }} />
                                      Percent
                                    </MenuItem>
                                  </Menu>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handlePopoverOpen(e, question.id, pkg.id, undefined, option.id)}
                                  sx={{
                                    bgcolor: getPriceTypeColor(rule?.priceType || "ignore"),
                                    color: "white",
                                    width: 24,
                                    height: 24,
                                  }}
                                >
                                  <Typography fontSize="small">{getPriceTypeIcon(rule?.priceType)}</Typography>
                                </IconButton>
                              </Box>
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))
                  : null}
            </TableBody>
          </Table>
        </TableContainer>
        <Box display="flex" justifyContent="flex-end" mt={1}>
          {/* {question.question_type == 'conditional'&& */}
            <Button
              variant="contained"
              color="primary"
              disabled={!changedQuestions[question.id] || isLoading}
              onClick={() => handleSave(question.id)}
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          {/* } */}
        </Box>
        {/* Render sub_questions if they exist and it's not a multiple_yes_no (as its sub_questions are handled in the table) */}
        {question.sub_questions &&
          question.sub_questions.length > 0 &&
          question.question_type !== "multiple_yes_no" && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Sub-questions:
              </Typography>
              {question.sub_questions.map((subQ) => renderQuestionTable(subQ, level + 1))}
            </Box>
          )}
        {/* Render child_questions if they exist and it's not a conditional (as its child_questions are handled within the conditional block) */}
        {question.child_questions &&
          question.child_questions.length > 0 &&
          question.question_type !== "conditional" && (
            <Box mt={2}>
              <Typography variant="subtitle2" fontWeight="bold" mb={1}>
                Conditional Questions:
              </Typography>
              {question.child_questions.map((childQ) => renderQuestionTable(childQ, level + 1))}
            </Box>
          )}
      </Box>
    )
  }

  return (
    <>
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>
        Base Price Setup
      </Typography>

      {basePriceLoading ? (
        <Typography>Loading base prices...</Typography>
        ) : (
          ["Residential", "Commercial"].map((type) => {
            const ranges = basePrices.filter((r) => r.property_type_name === type)
            if (!ranges.length) return null

            return (
              <Box key={type} mb={4} p={2} border={1} borderColor="grey.300" borderRadius={1}>
                <Typography variant="subtitle1" fontWeight="bold" fontSize={24} mb={2}>
                  {type}
                </Typography>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Building Size</TableCell>
                        {packages.map((pkg) => (
                          <TableCell key={pkg.id} align="center">
                            {pkg.name}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ranges.map((range) => (
                        <TableRow key={range.id}>
                          <TableCell>
                            {range.min_sqft === 0
                              ? `Less than ${range.max_sqft} sq ft`
                              : `${range.min_sqft} – ${range.max_sqft} sq ft`}
                          </TableCell>

                          {packages.map((pkg) => {
                            const sp = range.service_prices.find((p) => p.service_package_name === pkg.name)
                            if (!sp) return <TableCell key={pkg.id} />

                            const menuKey = `base-${sp.id}-${pkg.id}`

                            return (
                              <TableCell key={pkg.id} align="center">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <TextField
                                    size="small"
                                    type="number"
                                    value={
                                      ["ignore", "bid_in_person"].includes(
                                        editingPrices[sp.id]?.priceType || sp.pricing_type
                                      )
                                        ? "" // hide value when disabled
                                        : editingPrices[sp.id]?.value ?? sp.price
                                    }
                                    disabled={["ignore", "bid_in_person"].includes(
                                      editingPrices[sp.id]?.priceType || sp.pricing_type
                                    )}
                                    onChange={(e) =>
                                      setEditingPrices((prev) => ({
                                        ...prev,
                                        [sp.id]: {
                                          ...(prev[sp.id] || { priceType: sp.pricing_type || "ignore" }),
                                          value: e.target.value,
                                        },
                                      }))
                                    }
                                    sx={{ width: 100, '& .MuiInputBase-input': {
                                      textAlign: 'right',
                                    } }}
                                  />

                                  <IconButton
                                    size="small"
                                    onClick={(e) =>
                                      setPopoverAnchor({
                                        element: e.currentTarget,
                                        basePriceId: sp.id,
                                        packageId: pkg.id,
                                      })
                                    }
                                    sx={{
                                      bgcolor: getPriceTypeColor(editingPrices[sp.id]?.priceType || sp.pricing_type || "ignore"),
                                      color: "white",
                                      width: 24,
                                      height: 24,
                                    }}
                                  >
                                    <Typography fontSize="small">
                                      {getPriceTypeIcon(editingPrices[sp.id]?.priceType || sp.pricing_type || "ignore")}
                                    </Typography>
                                  </IconButton>
                                </Box>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box display="flex" justifyContent="flex-end" mt={2}>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        const updates = Object.entries(editingPrices).map(([id, price]) =>
                          updateBasePrice({
                            id,
                            price: Number(price.value),
                            pricing_type: price.priceType,
                          }).unwrap()
                        )
                        await Promise.all(updates)
                        await refetchBasePrices()
                        setEditingPrices({})
                        alert(`${type} base prices updated!`)
                      } catch (err) {
                        console.error(err)
                        alert("Failed to update base prices")
                      }
                    }}
                  >
                    Save {type}
                  </Button>
                </Box>
              </Box>
            )
          })
        )}
      </Box>

      <Box>
        <Typography variant="h6" gutterBottom>
          Price Setup
        </Typography>
        {topLevelQuestions.map((question) => renderQuestionTable(question))}
        <Popover
          open={Boolean(popoverAnchor.element)}
          anchorEl={popoverAnchor.element}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          transformOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Box p={2}>
            <Typography variant="subtitle2" gutterBottom>
              Select Price Type
            </Typography>
            <RadioGroup
              value={
                popoverAnchor.basePriceId
                  ? (
                      editingPrices[popoverAnchor.basePriceId]?.priceType ||
                      basePrices
                        .flatMap(bp => bp.service_prices)
                        .find(sp => sp.id === popoverAnchor.basePriceId)?.pricing_type ||
                      "ignore"
                    )
                  : (
                      getPriceRule(
                        popoverAnchor.questionId,
                        popoverAnchor.packageId,
                        popoverAnchor.answer,
                        popoverAnchor.optionId,
                      )?.priceType || "ignore"
                    )
              }
              onChange={(e) => handlePriceTypeSelect(e.target.value)}
            >
              {(
                popoverAnchor.basePriceId
                      ? ["upcharge", "bid_in_person"]
                      : ["upcharge", "discount", "ignore", "bid_in_person"]
                  ).map((type) => (
                      <FormControlLabel
                        key={type}
                        value={type}
                        control={<Radio size="small" />}
                        label={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2">{type.replace(/_/g, " ")}</Typography>
                            <Tooltip title={`Type: ${type}`}>
                              <Info fontSize="small" />
                            </Tooltip>
                          </Box>
                        }
                      />
                    ))}
            </RadioGroup>
          </Box>
        </Popover>
      </Box>
    </>
  )
}

export default PriceSetupForm