"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  TextField,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Button,
} from "@mui/material"
import { ExpandMore } from "@mui/icons-material"
import { useGetServiceQuestionsQuery } from "../../../store/api/user/quoteApi"

export const QuestionsForm = ({ data, onUpdate }) => {
  const [allServiceQuestions, setAllServiceQuestions] = useState([])
  const [loadingServices, setLoadingServices] = useState([])
  const [forceRefresh, setForceRefresh] = useState(0)
  const [expandedService, setExpandedService] = useState(null)

  const selectedServices = data?.selectedServices || []

  console.log(data, 'allServiceQuestionsState')

  const serviceQueries = selectedServices.map((service) =>
    useGetServiceQuestionsQuery(service.id, {
      skip: !service.id,
      refetchOnMountOrArgChange: true,
    }),
  )
  // console.log(serviceQueries, 'allServiceQuestions')

  useEffect(() => {
    setForceRefresh((prev) => prev + 1)
    setAllServiceQuestions([])
    if (selectedServices.length > 0) {
      setExpandedService(selectedServices[0].id)
    }
  }, [selectedServices.map((s) => s.id).join(",")])

  useEffect(() => {
    const processServiceQuestions = () => {
      const processedServices = []
      let hasLoading = false
      let hasError = false

      serviceQueries.forEach((query, index) => {
        const service = selectedServices[index]

        if (query.isLoading) {
          hasLoading = true
          if (!loadingServices.includes(service.id)) {
            setLoadingServices((prev) => [...prev, service.id])
          }
        } else {
          setLoadingServices((prev) => prev.filter((id) => id !== service.id))
        }

        if (query.isError) {
          hasError = true
          return
        }

        if (query.data && !query.isLoading) {
          const serviceData = query.data

          const normalizedQuestions = Array.from(serviceData.questions || [])
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((q) => normalizeQuestion(q))

          processedServices.push({
            service: serviceData.service,
            questions: normalizedQuestions,
          })
        }
      })

      if (!hasLoading && !hasError && processedServices.length > 0) {
        setAllServiceQuestions(processedServices)
      }
    }

    processServiceQuestions()
  }, [
    serviceQueries.map((q) => q.data),
    serviceQueries.map((q) => q.isLoading),
    serviceQueries.map((q) => q.isError),
    forceRefresh,
  ])

  const handleRefresh = () => {
    setForceRefresh((prev) => prev + 1)
    serviceQueries.forEach((query) => {
      if (query.refetch) {
        query.refetch()
      }
    })
  }

  const normalizeQuestion = (question) => {
    const normalized = {
      id: question.id,
      image: question.image || null,
      text: question.question_text,
      type: question.question_type,
      order: question.order,
      parent_question: question.parent_question,
      condition_answer: question.condition_answer,
      condition_option: question.condition_option,
      allow_quantity: question.allow_quantity || false,
      measurement_unit: question.measurement_unit || null,
      max_measurements: question.max_measurements || null,
      options: [],
      sub_questions: [],
      child_questions: [],
    }

    if (["describe", "quantity", "options", "measurement"].includes(question.question_type) && question.options) {
      normalized.options = Array.from(question.options)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((opt) => ({
          id: opt.id,
          text: opt.option_text,
          allow_quantity: opt.allow_quantity || false,
          max_quantity: opt.max_quantity || 1,
          image: opt.image || null,
        }))
    }

    if (question.question_type === "multiple_yes_no" && question.sub_questions) {
      normalized.sub_questions = Array.from(question.sub_questions)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((subQ) => ({
          id: subQ.id,
          text: subQ.sub_question_text,
          order: subQ.order,
          image: subQ.image || null,
        }))
    }

    if (question.child_questions && question.child_questions.length > 0) {
      normalized.child_questions = question.child_questions.map((child) => normalizeQuestion(child))
    }

    return normalized
  }

  const handleAnswerChange = (serviceId, questionId, answer, subQuestionId = null, optionId = null) => {
    console.log('Answer change:', { serviceId, questionId, answer, subQuestionId, optionId })
    
    const key = subQuestionId
      ? `${serviceId}_${questionId}_${subQuestionId}`
      : optionId
        ? `${serviceId}_${questionId}_${optionId}`
        : `${serviceId}_${questionId}`

    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [key]: answer,
      },
    })
  }

  const handleQuantityChange = (serviceId, questionId, optionId, quantity) => {
    console.log('Quantity change:', { serviceId, questionId, optionId, quantity })
    
    const key = `${serviceId}_${questionId}_${optionId}_quantity`
    onUpdate({
      questionAnswers: {
        ...data.questionAnswers,
        [key]: quantity,
      },
    })
  }

  const handleAddMeasurement = (serviceId, questionId) => {
    const updatedAnswers = { ...data.questionAnswers }
    
    // Find the next available index for this question
    let index = 0
    while (Object.keys(updatedAnswers).some(key => 
      key.startsWith(`${serviceId}_${questionId}_measurement_${index}_`)
    )) {
      index++
    }
    
    // Initialize the new measurement entry with empty values
    updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_option`] = ''
    updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_length`] = ''
    updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_width`] = ''
    updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_quantity`] = 1
    
    onUpdate({ questionAnswers: updatedAnswers })
  }

  const handleRemoveMeasurement = (serviceId, questionId, index) => {
    const updatedAnswers = { ...data.questionAnswers }
    
    // Remove all keys for this measurement index
    delete updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_option`]
    delete updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_length`]
    delete updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_width`]
    delete updatedAnswers[`${serviceId}_${questionId}_measurement_${index}_quantity`]
    
    onUpdate({ questionAnswers: updatedAnswers })
  }

  const getMeasurementCount = (serviceId, questionId) => {
    const keys = Object.keys(data.questionAnswers || {})
    const measurementKeys = keys.filter(key => 
      key.startsWith(`${serviceId}_${questionId}_measurement_`) && 
      key.endsWith('_option')
    )
    return measurementKeys.length
  }

  const getMeasurementIndices = (serviceId, questionId) => {
    const keys = Object.keys(data.questionAnswers || {})
    const indices = new Set()
    
    keys.forEach(key => {
      if (key.startsWith(`${serviceId}_${questionId}_measurement_`)) {
        const match = key.match(/_measurement_(\d+)_/)
        if (match) {
          indices.add(parseInt(match[1]))
        }
      }
    })
    
    return Array.from(indices).sort((a, b) => a - b)
  }

  const getAllQuestionsFlattened = (questions) => {
    const flattened = []
    
    const processQuestion = (question) => {
      flattened.push(question)
      if (question.child_questions && question.child_questions.length > 0) {
        question.child_questions.forEach(childQuestion => {
          processQuestion(childQuestion)
        })
      }
    }

    questions.forEach(question => {
      processQuestion(question)
    })

    return flattened
  }

  const shouldShowQuestion = (question, serviceId) => {
    if (!question.parent_question || !question.condition_answer) {
      return true
    }

    const parentKey = `${serviceId}_${question.parent_question}`
    const parentAnswer = data.questionAnswers?.[parentKey]
    return parentAnswer === question.condition_answer
  }

  const renderQuestion = (question, serviceId) => {
    console.log('Rendering question:', question)
    return (
      <Box key={question.id} sx={{ mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            backgroundColor: '#d9edf7',
            padding: '12px 20px',
            borderRadius: '8px',
            mb: 2
          }}
        >
          {question.image && (
            <Box 
              sx={{ 
                width: 80, 
                height: 80, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: '6px',
              }}
            >
              <img 
                src={question.image} 
                alt="question image" 
                style={{ 
                  maxWidth: '100%',
                  maxHeight: '100%',
                  display: 'inline-block',
                  objectFit: 'contain',
                }} 
              />
            </Box>
          )}
          <Typography 
            sx={{ 
              color: '#2c2c6c',
              fontSize: { xs: '16px', sm: '18px' },
              fontWeight: 400,
              lineHeight: 1.4
            }}
          >
          {question.text}
          <span style={{ color: '#d32f2f', marginLeft: '4px' }}>*</span>
          </Typography>
        </Box>
        
        <Box sx={{ pl: {xs:0, sm:2} }}>
          {renderQuestionContent(question, serviceId)}
        </Box>
      </Box>
    )
  }

  const renderQuestionContent = (question, serviceId) => {
    const questionKey = `${serviceId}_${question.id}`

    switch (question.type) {
      case "yes_no":
      case "conditional":
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
              sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
            >
              <FormControlLabel 
                value="yes" 
                control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                label="Yes" 
              />
              <FormControlLabel 
                value="no" 
                control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                label="No" 
              />
            </RadioGroup>
          </FormControl>
        )

      case "describe":
      case "options":
        return (
          <FormControl component="fieldset">
            <RadioGroup
              value={data.questionAnswers?.[questionKey] || ""}
              onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value)}
              sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {question.options?.map((option) => (
                <FormControlLabel
                  key={option.id}
                  value={option.id}
                  control={<Radio sx={{ color: '#e1e1e1 ', '&.Mui-checked': { color: '#023c8f' } }} />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {option.image && (
                        <Box 
                          sx={{ 
                            width: 90, 
                            height: 90, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: '#f9f9f9', // optional
                            borderRadius: '6px',
                          }}
                        >
                          <img 
                            src={option.image} 
                            alt="option image" 
                            style={{
                              maxWidth: '100%',
                              maxHeight: '100%',
                              objectFit: 'contain',
                            }}
                          />
                        </Box>
                      )}
                      <Typography>{option.text}</Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        )

      case "quantity":
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {question.options?.map((option) => {
              const optionKey = `${serviceId}_${question.id}_${option.id}`
              const quantityKey = `${serviceId}_${question.id}_${option.id}_quantity`
              const isSelected = Boolean(data.questionAnswers?.[optionKey])
              const quantity = data.questionAnswers?.[quantityKey] !== undefined? data.questionAnswers[quantityKey]: 1

              return (
                <Box 
                  key={option.id}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    padding: { xs: '8px', sm: '10px', md: '11px' },
                    border: isSelected ? '1px solid #779cd1' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? '#f8fbff' : 'white'
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isSelected}
                        onChange={(e) => {
                          const updatedAnswers = { ...data.questionAnswers }
                          if (e.target.checked) {
                            updatedAnswers[optionKey] = "selected"
                            if (option.allow_quantity) {
                              updatedAnswers[quantityKey] = quantity || 1
                            }
                          } else {
                            delete updatedAnswers[optionKey]
                            delete updatedAnswers[quantityKey]
                          }
                          onUpdate({ questionAnswers: updatedAnswers })
                        }}
                        sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {option.image && (
                          <Box 
                            sx={{ 
                              width: {xs: 50, sm: 75, md: 90}, 
                              height: {xs: 50, sm: 75, md: 90}, 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: '#f9f9f9', // optional
                              borderRadius: '6px',
                            }}
                          >
                              <img 
                                src={option.image} 
                                alt="option image" 
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'contain',
                                }}
                              />
                          </Box>
                        )}
                        <Typography
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' } }}
                        >
                          {option.text}
                        </Typography>
                      </Box>
                    }
                  />
                  
                  {isSelected && option.allow_quantity && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                      <TextField
                        type="number"
                        size="small"
                        value={quantity}
                        onChange={(e) => {
                          const inputValue = e.target.value
                          
                          // Allow empty string for editing
                          if (inputValue === '') {
                            handleQuantityChange(serviceId, question.id, option.id, '')
                            return
                          }
                          
                          const numericValue = Number.parseInt(inputValue)
                          
                          // Only update if it's a valid number
                          if (!isNaN(numericValue)) {
                            const newQuantity = Math.min(
                              Math.max(1, numericValue),
                              option.max_quantity,
                            )
                            handleQuantityChange(serviceId, question.id, option.id, newQuantity)
                          }
                        }}
                        onBlur={(e) => {
                          // Ensure valid value when user leaves the field
                          const inputValue = e.target.value
                          if (inputValue === '' || isNaN(Number.parseInt(inputValue))) {
                            handleQuantityChange(serviceId, question.id, option.id, 1)
                          }
                        }}
                        inputProps={{
                          min: 1,
                          max: option.max_quantity,
                          sx: { height: {xs:32, md:36}, padding: '0 8px' }
                        }}
                        sx={{ width: 80 }}
                      />
                      <Typography variant="caption" sx={{ color: '#666', fontSize: { xs: '0.55rem', sm: '0.7rem', md: '0.8rem' } }}>
                        (Max: {option.max_quantity})
                      </Typography>
                    </Box>
                  )}
                </Box>
              )
            })}
          </Box>
        )

      case "multiple_yes_no":
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {question.sub_questions?.map((subQuestion) => {
              const subQuestionKey = `${serviceId}_${question.id}_${subQuestion.id}`
              
              return (
                <Box key={subQuestion.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {subQuestion.image && (
                      <Box 
                        sx={{ 
                          width: 90, 
                          height: 90, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: '#f9f9f9', // optional
                          borderRadius: '6px',
                        }}
                      >
                        <img 
                          src={subQuestion.image} 
                          alt="sub-question image"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                    )}
                    <Typography sx={{ fontSize: '15px', color: '#555', fontWeight: 500 }}>
                      {subQuestion.text}
                    </Typography>
                  </Box>
                  <FormControl component="fieldset" sx={{ ml: 2 }}>
                    <RadioGroup
                      value={data.questionAnswers?.[subQuestionKey] || ""}
                      onChange={(e) => handleAnswerChange(serviceId, question.id, e.target.value, subQuestion.id)}
                      sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}
                    >
                      <FormControlLabel 
                        value="yes" 
                        control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                        label="Yes" 
                      />
                      <FormControlLabel 
                        value="no" 
                        control={<Radio sx={{ color: '#e1e1e1', '&.Mui-checked': { color: '#023c8f' } }} />} 
                        label="No" 
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
              )
            })}
          </Box>
        )

      case "measurement":
        const measurementIndices = getMeasurementIndices(serviceId, question.id)
        const currentCount = measurementIndices.length
        const canAddMore = question.max_measurements === null || currentCount < question.max_measurements

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {measurementIndices.map((index) => {
              const optionKey = `${serviceId}_${question.id}_measurement_${index}_option`
              const lengthKey = `${serviceId}_${question.id}_measurement_${index}_length`
              const widthKey = `${serviceId}_${question.id}_measurement_${index}_width`
              const quantityKey = `${serviceId}_${question.id}_measurement_${index}_quantity`
              
              const selectedOption = data.questionAnswers?.[optionKey] || ''
              const length = data.questionAnswers?.[lengthKey] || ''
              const width = data.questionAnswers?.[widthKey] || ''
              const quantity = data.questionAnswers?.[quantityKey] !== undefined ? data.questionAnswers[quantityKey] : 1

              return (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 2,
                    padding: { xs: '12px', sm: '14px', md: '16px' },
                    border: '1px solid #779cd1',
                    borderRadius: '8px',
                    backgroundColor: '#f8fbff',
                    position: 'relative'
                  }}
                >
                  {/* Remove Button */}
                  {currentCount > 1 && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <button
                        onClick={() => handleRemoveMeasurement(serviceId, question.id, index)}
                        style={{
                          background: '#d32f2f',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Remove
                      </button>
                    </Box>
                  )}

                  {/* Option Dropdown */}
                  <Box>
                    <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block', fontWeight: 500 }}>
                      Select Option <span style={{ color: '#d32f2f' }}>*</span>
                    </Typography>
                    <FormControl fullWidth size="small">
                      <select
                        value={selectedOption}
                        onChange={(e) => {
                          handleAnswerChange(serviceId, question.id, e.target.value, null, `measurement_${index}_option`)
                        }}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '4px',
                          border: '1px solid #c4c4c4',
                          fontSize: '14px',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          height: '40px'
                        }}
                      >
                        <option value="">Please choose an option</option>
                        {question.options?.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.text}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                  </Box>
                  
                  {/* Measurement Inputs in One Row */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    alignItems: 'flex-end',
                    flexWrap: 'wrap'
                  }}>
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: 100 }}>
                      <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block', fontWeight: 500 }}>
                        Length ({question.measurement_unit || 'cm'})
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        value={length}
                        onChange={(e) => {
                          const value = e.target.value
                          handleAnswerChange(serviceId, question.id, value, null, `measurement_${index}_length`)
                        }}
                        inputProps={{
                          min: 0,
                          step: 0.1,
                          sx: { height: {xs:36, md:40}, padding: '0 12px' }
                        }}
                        placeholder="0.0"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#023c8f' },
                            '&.Mui-focused fieldset': { borderColor: '#023c8f' },
                          },
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, minWidth: 100 }}>
                      <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block', fontWeight: 500 }}>
                        Width ({question.measurement_unit || 'cm'})
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        fullWidth
                        value={width}
                        onChange={(e) => {
                          const value = e.target.value
                          handleAnswerChange(serviceId, question.id, value, null, `measurement_${index}_width`)
                        }}
                        inputProps={{
                          min: 0,
                          step: 0.1,
                          sx: { height: {xs:36, md:40}, padding: '0 12px' }
                        }}
                        placeholder="0.0"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': { borderColor: '#023c8f' },
                            '&.Mui-focused fieldset': { borderColor: '#023c8f' },
                          },
                        }}
                      />
                    </Box>

                    {question.allow_quantity && (
                      <Box sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, minWidth: 100 }}>
                        <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block', fontWeight: 500 }}>
                          Quantity
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          value={quantity}
                          onChange={(e) => {
                            const inputValue = e.target.value
                            
                            if (inputValue === '') {
                              handleAnswerChange(serviceId, question.id, '', null, `measurement_${index}_quantity`)
                              return
                            }
                            
                            const numericValue = Number.parseInt(inputValue)
                            
                            if (!isNaN(numericValue) && numericValue >= 1) {
                              handleAnswerChange(serviceId, question.id, numericValue, null, `measurement_${index}_quantity`)
                            }
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value
                            if (inputValue === '' || isNaN(Number.parseInt(inputValue)) || parseInt(inputValue) < 1) {
                              handleAnswerChange(serviceId, question.id, 1, null, `measurement_${index}_quantity`)
                            }
                          }}
                          inputProps={{
                            min: 1,
                            sx: { height: {xs:36, md:40}, padding: '0 12px' }
                          }}
                          sx={{ 
                            width: 100,
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': { borderColor: '#023c8f' },
                              '&.Mui-focused fieldset': { borderColor: '#023c8f' },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
              )
            })}

            {/* Add New Area Button */}
            {canAddMore && (
              <Button
                onClick={() => handleAddMeasurement(serviceId, question.id)}
                size="small"
                sx={{
                  px:2,
                  backgroundColor: "#42bd3f",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "fit-content",
                  textTransform: "none", // Prevents uppercase text
                  "&:hover": {
                    backgroundColor: "#3aa838",
                  },
                }}
              >
                <span style={{ fontSize: "18px" }}>+</span> Add a new area
              </Button>

            )}

            {question.max_measurements !== null && (
              <Typography variant="caption" sx={{ color: '#666', fontStyle: 'italic' }}>
                Maximum {question.max_measurements} measurement(s) allowed ({currentCount}/{question.max_measurements})
              </Typography>
            )}
          </Box>
        )

      default:
        return <Alert severity="warning">Unsupported question type: {question.type}</Alert>
    }
  }

  const handleAccordionChange = (serviceId) => (event, isExpanded) => {
    setExpandedService(isExpanded ? serviceId : null)
  }

  if (serviceQueries.some((query) => query.isLoading)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress sx={{ color: '#023c8f' }} />
        <Typography sx={{ ml: 2 }}>Loading questions...</Typography>
      </Box>
    )
  }

  if (serviceQueries.some((query) => query.isError)) {
    return (
      <Alert 
        severity="error" 
        action={
          <button 
            onClick={handleRefresh} 
            style={{ 
              padding: "8px 16px", 
              backgroundColor: '#023c8f',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        }
      >
        Failed to load questions. Please try again.
      </Alert>
    )
  }

  if (allServiceQuestions.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          Service Questions
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          No questions available for the selected services.
        </Typography>
        <button 
          onClick={handleRefresh} 
          style={{ 
            padding: "10px 20px",
            backgroundColor: '#023c8f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Refresh Questions
        </button>
      </Box>
    )
  }

  // Debug log
  // console.log('Current question answers:', data.questionAnswers)

  return (
    <Box>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 1, 
          fontWeight: 300, 
          color: '#023c8f',
          textAlign: 'center'
        }}
      >
        Service Questions
      </Typography>
      
      <Typography 
        sx={{ 
          mb: 4, 
          color: '#666', 
          textAlign: 'center'
        }}
      >
        Please answer the questions for each service
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {allServiceQuestions.map((serviceData) => {
          const hasQuestions = serviceData.questions.length > 0
          const isExpanded = expandedService === serviceData.service.id

          return (
            <Accordion 
              key={serviceData.service.id}
              expanded={isExpanded}
              onChange={handleAccordionChange(serviceData.service.id)}
              sx={{
                border: '1px solid #ddd',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                boxShadow: 'none',
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                sx={{
                  backgroundColor: '#023c8f',
                  color: 'white',
                  borderRadius: '8px',
                  minHeight: 44,
                  '&.Mui-expanded': {
                    minHeight: 44,
                    borderRadius: '8px 8px 0 0'
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: 0,
                  },
                  '& .MuiAccordionSummary-content.Mui-expanded': {
                    margin: 0,
                  }
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 500 }}>
                  {serviceData.service.name}
                </Typography>
              </AccordionSummary>
              
              <AccordionDetails sx={{ p: 2 }}>
                {serviceData.service.description && (
                  <Typography sx={{ mb: 2, color: '#666', fontSize: '14px' }}>
                    {serviceData.service.description}
                  </Typography>
                )}

                {!hasQuestions ? (
                  <Typography sx={{ color: '#666', fontStyle: "italic" }}>
                    No additional questions for this service.
                  </Typography>
                ) : (
                  <Box>
                    {getAllQuestionsFlattened(serviceData.questions)
                      .filter(question => shouldShowQuestion(question, serviceData.service.id))
                      .map((question) => renderQuestion(question, serviceData.service.id))
                    }
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Box>
      {allServiceQuestions.some(serviceData => {
      const hasUnansweredQuestions = getAllQuestionsFlattened(serviceData.questions)
        .filter(question => shouldShowQuestion(question, serviceData.service.id))
        .some(question => {
          const questionKey = `${serviceData.service.id}_${question.id}`;
          
          switch (question.type) {
            case "yes_no":
            case "conditional":
            case "describe":
            case "options":
              return !data.questionAnswers?.[questionKey];
            
            case "quantity":
              return !Object.keys(data.questionAnswers || {}).some(k => 
                k.startsWith(`${serviceData.service.id}_${question.id}_`) && 
                k.endsWith('_quantity') &&
                parseInt(data.questionAnswers[k]) > 0
              );
            
            case "multiple_yes_no":
              return !question.sub_questions?.some(subQ => {
                const subKey = `${serviceData.service.id}_${question.id}_${subQ.id}`;
                return data.questionAnswers?.[subKey] === "yes" || data.questionAnswers?.[subKey] === "no";
              });
            
            default:
              return false;
          }
        });
      
      return hasUnansweredQuestions;
    }) && (
      <Alert severity="warning" sx={{ mt: 3 }}>
        Please answer all required questions (marked with *) before proceeding to the next step.
      </Alert>
    )}
    </Box>
  )
}

export default QuestionsForm