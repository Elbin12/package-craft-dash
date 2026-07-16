"use client"

import { useState } from "react"
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
  Alert,
  Button,
  Dialog,
  IconButton,
} from "@mui/material"
import CloseIcon from "@mui/icons-material/Close"
import ZoomInIcon from "@mui/icons-material/ZoomIn"
import ZoomOutIcon from "@mui/icons-material/ZoomOut"
import RestartAltIcon from "@mui/icons-material/RestartAlt"
import {ServiceQuestionsSection} from "./ServiceQuestionsSection"

const PREVIEW_ZOOM_MIN = 0.5
const PREVIEW_ZOOM_MAX = 3
const PREVIEW_ZOOM_STEP = 0.25

export const QuestionsForm = ({ data, onUpdate }) => {
  const selectedServices = data?.selectedServices || []
  const [previewImage, setPreviewImage] = useState(null)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [previewBaseSize, setPreviewBaseSize] = useState({ width: 0, height: 0 })

  console.log(data, 'allServiceQuestionsState')

  const openImagePreview = (e, src, alt = "Preview") => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewZoom(1)
    setPreviewBaseSize({ width: 0, height: 0 })
    setPreviewImage({ src, alt })
  }

  const closeImagePreview = () => {
    setPreviewImage(null)
    setPreviewZoom(1)
    setPreviewBaseSize({ width: 0, height: 0 })
  }

  const handlePreviewImageLoad = (e) => {
    const img = e.currentTarget
    const maxW = Math.min(window.innerWidth * 0.85, 720)
    const maxH = window.innerHeight * 0.6
    const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight)
    // Small icons: still show at a readable base size (at least ~220px)
    const minDisplay = 220
    const fittedW = img.naturalWidth * scale
    const fittedH = img.naturalHeight * scale
    const boost = fittedW < minDisplay && fittedH < minDisplay
      ? Math.min(minDisplay / fittedW, minDisplay / fittedH, maxW / fittedW, maxH / fittedH)
      : 1
    setPreviewBaseSize({
      width: Math.round(fittedW * boost),
      height: Math.round(fittedH * boost),
    })
  }

  const zoomInPreview = () => {
    setPreviewZoom((z) => Math.min(PREVIEW_ZOOM_MAX, Math.round((z + PREVIEW_ZOOM_STEP) * 100) / 100))
  }

  const zoomOutPreview = () => {
    setPreviewZoom((z) => Math.max(PREVIEW_ZOOM_MIN, Math.round((z - PREVIEW_ZOOM_STEP) * 100) / 100))
  }

  const resetPreviewZoom = () => setPreviewZoom(1)

  const previewDisplayWidth = previewBaseSize.width
    ? previewBaseSize.width * previewZoom
    : undefined
  const previewDisplayHeight = previewBaseSize.height
    ? previewBaseSize.height * previewZoom
    : undefined

  const renderZoomableImage = (src, alt, sizeSx = { width: 90, height: 90 }) => (
    <Box
      onClick={(e) => openImagePreview(e, src, alt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          openImagePreview(e, src, alt)
        }
      }}
      title="Click to enlarge"
      sx={{
        ...sizeSx,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9f9f9",
        borderRadius: "6px",
        position: "relative",
        cursor: "zoom-in",
        overflow: "hidden",
        flexShrink: 0,
        "&:hover .zoom-hint": { opacity: 1 },
        "&:hover img": { opacity: 0.85 },
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          maxWidth: "100%",
          maxHeight: "100%",
          objectFit: "contain",
          pointerEvents: "none",
        }}
      />
      <Box
        className="zoom-hint"
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(2, 60, 143, 0.35)",
          opacity: 0,
          transition: "opacity 0.15s ease",
          pointerEvents: "none",
        }}
      >
        <ZoomInIcon sx={{ color: "white", fontSize: 28 }} />
      </Box>
    </Box>
  )

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
          {question.image && renderZoomableImage(question.image, "question image", { width: 80, height: 80 })}
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
                      {option.image && renderZoomableImage(option.image, option.text || "option image")}
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
                        {option.image &&
                          renderZoomableImage(option.image, option.text || "option image", {
                            width: { xs: 50, sm: 75, md: 90 },
                            height: { xs: 50, sm: 75, md: 90 },
                          })}
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
                    {subQuestion.image &&
                      renderZoomableImage(subQuestion.image, subQuestion.text || "sub-question image")}
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

  return (
    <Box>
      <Typography
        variant="h4"
        sx={{
          mb: 1,
          fontWeight: 300,
          color: "#023c8f",
          textAlign: "center",
        }}
      >
        Service Questions
      </Typography>

      <Typography
        sx={{
          mb: 4,
          color: "#666",
          textAlign: "center",
        }}
      >
        Please answer the questions for each service
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {selectedServices.map((service) => (
          <ServiceQuestionsSection
            key={service.id}
            service={service}
            data={data}
            onUpdate={onUpdate}
            normalizeQuestion={normalizeQuestion}
            renderQuestion={renderQuestion}
            getAllQuestionsFlattened={getAllQuestionsFlattened}
            shouldShowQuestion={shouldShowQuestion}
          />
        ))}
      </Box>

      <Dialog
        open={Boolean(previewImage)}
        onClose={closeImagePreview}
        maxWidth={false}
        PaperProps={{
          sx: {
            backgroundColor: "transparent",
            boxShadow: "none",
            overflow: "visible",
            m: 2,
            width: "auto",
            maxWidth: "95vw",
          },
        }}
      >
        <Box sx={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, p: 1 }}>
          <IconButton
            onClick={closeImagePreview}
            aria-label="Close image preview"
            sx={{
              position: "absolute",
              top: -8,
              right: -8,
              zIndex: 2,
              backgroundColor: "white",
              boxShadow: 2,
              "&:hover": { backgroundColor: "#f5f5f5" },
            }}
          >
            <CloseIcon />
          </IconButton>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              backgroundColor: "white",
              borderRadius: 999,
              boxShadow: 2,
              px: 1,
              py: 0.5,
            }}
          >
            <IconButton
              onClick={zoomOutPreview}
              disabled={previewZoom <= PREVIEW_ZOOM_MIN}
              aria-label="Zoom out"
              size="small"
            >
              <ZoomOutIcon />
            </IconButton>
            <Typography sx={{ minWidth: 48, textAlign: "center", fontSize: 13, fontWeight: 600, color: "#023c8f" }}>
              {Math.round(previewZoom * 100)}%
            </Typography>
            <IconButton
              onClick={zoomInPreview}
              disabled={previewZoom >= PREVIEW_ZOOM_MAX}
              aria-label="Zoom in"
              size="small"
            >
              <ZoomInIcon />
            </IconButton>
            <IconButton
              onClick={resetPreviewZoom}
              disabled={previewZoom === 1}
              aria-label="Reset zoom"
              size="small"
              title="Reset zoom"
            >
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box
            sx={{
              maxWidth: "100%",
              maxHeight: { xs: "70vh", sm: "80vh" },
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {previewImage && (
              <Box
                component="img"
                src={previewImage.src}
                alt={previewImage.alt}
                onLoad={handlePreviewImageLoad}
                sx={{
                  width: previewDisplayWidth || "auto",
                  height: previewDisplayHeight || "auto",
                  maxWidth: previewDisplayWidth ? "none" : "85%",
                  maxHeight: previewDisplayHeight ? "none" : "60vh",
                  objectFit: "contain",
                  borderRadius: 1,
                  backgroundColor: "white",
                  boxShadow: 3,
                  transition: "width 0.15s ease, height 0.15s ease",
                  flexShrink: 0,
                  display: "block",
                }}
              />
            )}
          </Box>
        </Box>
      </Dialog>
    </Box>
  );
}

export default QuestionsForm