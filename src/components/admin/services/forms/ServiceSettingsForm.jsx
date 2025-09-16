"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Grid,
  InputAdornment,
  Alert,
} from "@mui/material"
import { Add as AddIcon, Delete as DeleteIcon, Save as SaveIcon, Close as CloseIcon } from "@mui/icons-material"
import { useGetOptionQuestionsQuery } from "../../../../store/api/questionsApi"
import {
  useCreateQuantityDiscountMutation,
  useUpdateQuantityDiscountMutation,
  useDeleteQuantityDiscountMutation,
  useLazyGetQuantityDiscountsQuery,
} from "../../../../store/api/addOnServicesApi"

const ServiceSettingsForm = ({ data, onUpdate }) => {
  const [discounts, setDiscounts] = useState({})
  const [discountForms, setDiscountForms] = useState({})
  const [existingDiscounts, setExistingDiscounts] = useState([])
  const [editingDiscounts, setEditingDiscounts] = useState({})

  const { data: optionQuestions, isLoading } = useGetOptionQuestionsQuery(data.id)
  const [createQuantityDiscount] = useCreateQuantityDiscountMutation()
  const [updateQuantityDiscount] = useUpdateQuantityDiscountMutation()
  const [deleteQuantityDiscount] = useDeleteQuantityDiscountMutation()

  const [trigger] = useLazyGetQuantityDiscountsQuery()

  // Get quantity questions with options
  const quantityQuestions = useMemo(
    () =>
      optionQuestions?.filter(
        (question) =>
          question.question_type === "quantity" && question.options?.some((option) => option.allow_quantity),
      ) || [],
    [optionQuestions],
  )

  const questionIds = useMemo(() => quantityQuestions.map((q) => q.id), [quantityQuestions])

  useEffect(() => {
    if (questionIds.length === 0) {
      setExistingDiscounts([])
      return
    }

    let isCancelled = false
    const timeoutId = setTimeout(async () => {
      if (isCancelled) return

      try {
        const results = await Promise.allSettled(questionIds.map((id) => trigger(id).unwrap()))

        if (!isCancelled) {
          const successfulResults = results
            .filter((result) => result.status === "fulfilled")
            .flatMap((result) => result.value)

          setExistingDiscounts(successfulResults)
        }
      } catch (err) {
        if (!isCancelled) {
          console.error("Error fetching discounts:", err)
          setExistingDiscounts([])
        }
      }
    }, 300) // Added 300ms debounce to prevent rapid successive calls

    return () => {
      isCancelled = true
      clearTimeout(timeoutId)
    }
  }, [questionIds, trigger])

  const handleChange = (field) => (event) => {
    const value = event.target.type === "checkbox" ? event.target.checked : event.target.value
    onUpdate({ settings: { ...data.settings, [field]: value } })
  }

  const handleDiscountToggle = (questionId, type) => (event) => {
    const checked = event.target.checked
    setDiscounts((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [type]: checked,
      },
    }))

    if (!checked) {
      setDiscountForms((prev) => ({
        ...prev,
        [`${questionId}_${type}`]: undefined,
      }))
    }
  }

  const showAddDiscountForm = (questionId, type, optionId = null) => {
    const key = optionId ? `${questionId}_${type}_${optionId}` : `${questionId}_${type}`
    setDiscountForms((prev) => ({
      ...prev,
      [key]: {
        value: "",
        minQuantity: "",
        questionId,
        optionId,
        type,
      },
    }))
  }

  const handleDiscountFormChange = (key, field) => (event) => {
    setDiscountForms((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: event.target.value,
      },
    }))
  }

  const submitDiscount = async (key) => {
    const form = discountForms[key]
    if (!form.value || !form.minQuantity) {
      alert("Please fill in both percentage and minimum quantity")
      return
    }

    const payload = {
      question: form.questionId,
      scope: form.optionId ? "option" : "question",
      discount_type: "percent",
      value: Number.parseFloat(form.value),
      min_quantity: Number.parseInt(form.minQuantity),
    }

    if (form.optionId) {
      payload.option = form.optionId
    }

    try {
      const result = await createQuantityDiscount(payload).unwrap()
      setExistingDiscounts((prev) => [...prev, result])
      setDiscountForms((prev) => ({
        ...prev,
        [key]: undefined,
      }))
      alert("Discount added successfully!")
    } catch (error) {
      console.error("Error creating discount:", error)
      alert("Error adding discount. Please try again.")
    }
  }

  const cancelDiscountForm = (key) => {
    setDiscountForms((prev) => ({
      ...prev,
      [key]: undefined,
    }))
  }

  const deleteDiscount = async (discountId) => {
    try {
      await deleteQuantityDiscount(discountId).unwrap()
      setExistingDiscounts((prev) => prev.filter((discount) => discount.id !== discountId))
      alert("Discount deleted successfully!")
    } catch (error) {
      console.error("Error deleting discount:", error)
      alert("Error deleting discount.")
    }
  }

  const startEditing = (discount) => {
    setEditingDiscounts((prev) => ({
      ...prev,
      [discount.id]: { ...discount },
    }))
  }

  const cancelEditing = (id) => {
    setEditingDiscounts((prev) => {
      const updated = { ...prev }
      delete updated[id]
      return updated
    })
  }

  const handleEditChange = (id, field, value) => {
    setEditingDiscounts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }))
  }

  const saveEdit = async (id) => {
    const discount = editingDiscounts[id]
    try {
      const result = await updateQuantityDiscount({
        id,
        value: Number.parseFloat(discount.value),
        min_quantity: Number.parseInt(discount.min_quantity),
        question: discount.question,
      }).unwrap()

      setExistingDiscounts((prev) => prev.map((d) => (d.id === id ? result : d)))
      cancelEditing(id)
      alert("Discount updated successfully!")
    } catch (error) {
      console.error("Error updating discount:", error)
      alert("Error updating discount.")
    }
  }

  const getDiscountsForQuestion = useMemo(
    () => (questionId) => {
      return existingDiscounts.filter((discount) => discount.question === questionId && discount.scope === "question")
    },
    [existingDiscounts],
  )

  const getDiscountsForOption = useMemo(
    () => (questionId, optionId) => {
      return existingDiscounts.filter(
        (discount) => discount.question === questionId && discount.option === optionId && discount.scope === "option",
      )
    },
    [existingDiscounts],
  )

  const renderDiscountBox = (discount) => {
    const isEditing = !!editingDiscounts[discount.id]
    const current = isEditing ? editingDiscounts[discount.id] : discount

    return (
      <Card key={discount.id} variant="outlined" sx={{ mt: 1, backgroundColor: "#f5f5f5" }}>
        <CardContent sx={{ py: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={4}>
              <TextField
                label="Percentage"
                type="number"
                size="small"
                value={current.value}
                disabled={!isEditing}
                onChange={(e) => handleEditChange(discount.id, "value", e.target.value)}
                InputProps={{
                  endAdornment: <InputAdornment position="end">%</InputAdornment>,
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Min Quantity"
                type="number"
                size="small"
                value={current.min_quantity}
                disabled={!isEditing}
                onChange={(e) => handleEditChange(discount.id, "min_quantity", e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={4}>
              {!isEditing ? (
                <>
                  <Button size="small" variant="outlined" onClick={() => startEditing(discount)}>
                    Edit
                  </Button>
                  <IconButton onClick={() => deleteDiscount(discount.id)} color="error" size="small">
                    <DeleteIcon />
                  </IconButton>
                </>
              ) : (
                <>
                  <IconButton onClick={() => saveEdit(discount.id)} color="primary" size="small">
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={() => cancelEditing(discount.id)} color="error" size="small">
                    <CloseIcon />
                  </IconButton>
                </>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    )
  }

  const renderDiscountForm = (key, form) => (
    <Card key={key} variant="outlined" sx={{ mt: 1, ml: form.optionId ? 4 : 2 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Add Discount {form.optionId ? "(Option Level)" : "(Question Level)"}
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={4}>
            <TextField
              label="Percentage"
              type="number"
              size="small"
              value={form.value}
              onChange={handleDiscountFormChange(key, "value")}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <TextField
              label="Min Quantity"
              type="number"
              size="small"
              value={form.minQuantity}
              onChange={handleDiscountFormChange(key, "minQuantity")}
              fullWidth
            />
          </Grid>
          <Grid item xs={4}>
            <Button variant="contained" size="small" onClick={() => submitDiscount(key)} sx={{ mr: 1 }}>
              Add
            </Button>
            <Button variant="outlined" size="small" onClick={() => cancelDiscountForm(key)}>
              Cancel
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderQuestion = (question) => {
    const questionDiscounts = discounts[question.id] || {}
    const hasQuantityOptions = question.options?.some((option) => option.allow_quantity)
    const questionLevelDiscounts = getDiscountsForQuestion(question.id)

    if (!hasQuantityOptions) return null

    return (
      <Card key={question.id} variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {question.question_text}
          </Typography>

          {/* Question Level Discounts */}
          <Box mb={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={questionDiscounts.total || false}
                  onChange={handleDiscountToggle(question.id, "total")}
                />
              }
              label="Enable Total Volume Discounts"
            />

            {questionDiscounts.total && questionLevelDiscounts.length === 0 && (
              <Box ml={2} mt={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => showAddDiscountForm(question.id, "total")}
                  sx={{ mb: 1 }}
                >
                  Add Discount
                </Button>
              </Box>
            )}

            {questionLevelDiscounts.length > 0 && (
              <Box ml={2} mt={1}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current Discount:
                </Typography>
                <Box>{questionLevelDiscounts.map((discount) => renderDiscountBox(discount))}</Box>
              </Box>
            )}

            {discountForms[`${question.id}_total`] &&
              renderDiscountForm(`${question.id}_total`, discountForms[`${question.id}_total`])}
          </Box>

          {/* Option Level Discounts */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Individual Options:
            </Typography>
            {question.options
              ?.filter((option) => option.allow_quantity)
              .map((option) => {
                const optionLevelDiscounts = getDiscountsForOption(question.id, option.id)

                return (
                  <Box key={option.id} ml={2} mb={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={questionDiscounts[option.id] || false}
                          onChange={handleDiscountToggle(question.id, option.id)}
                        />
                      }
                      label={`Enable ${option.option_text}`}
                    />

                    {questionDiscounts[option.id] && optionLevelDiscounts.length === 0 && (
                      <Box ml={4} mt={1}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => showAddDiscountForm(question.id, "option", option.id)}
                          sx={{ mb: 1 }}
                        >
                          Add Discount
                        </Button>
                      </Box>
                    )}

                    {optionLevelDiscounts.length > 0 && (
                      <Box ml={4} mt={1}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Current Discount:
                        </Typography>
                        <Box>{optionLevelDiscounts.map((discount) => renderDiscountBox(discount))}</Box>
                      </Box>
                    )}

                    {discountForms[`${question.id}_option_${option.id}`] &&
                      renderDiscountForm(
                        `${question.id}_option_${option.id}`,
                        discountForms[`${question.id}_option_${option.id}`],
                      )}
                  </Box>
                )
              })}
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="h6">Final Details</Typography>

      <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.apply_area_minimum || false}
            onChange={handleChange("apply_area_minimum")}
          />
        }
        label="Apply Area Minimum"
      />

      <FormControlLabel
        control={
          <Checkbox
            checked={data?.settings?.apply_trip_charge_to_bid || false}
            onChange={handleChange("apply_trip_charge_to_bid")}
          />
        }
        label="Apply Trip Charge To Bid"
      />

      <TextField
        label="General Disclaimer"
        value={data?.settings?.general_disclaimer || ""}
        onChange={handleChange("general_disclaimer")}
        fullWidth
        multiline
        minRows={2}
        maxRows={10}
        InputProps={{
          sx: {
            '& textarea': {
              resize: 'vertical',   // allow dragging resize
            },
          },
        }}
      />


      <TextField
        label="Bid in Person Disclaimer"
        value={data?.settings?.bid_in_person_disclaimer || ""}
        onChange={handleChange("bid_in_person_disclaimer")}
        fullWidth
        multiline
        minRows={2}
        maxRows={10}
        InputProps={{
          sx: {
            '& textarea': {
              resize: 'vertical',   // allow dragging resize
            },
          },
        }}
      />

      <Box mt={3}>
        <Typography variant="h6" gutterBottom>
          Quantity Discounts
        </Typography>

        {isLoading ? (
          <Typography>Loading questions...</Typography>
        ) : (
          <>
            {quantityQuestions.map(renderQuestion)}

            {quantityQuestions.length === 0 && (
              <Alert severity="info">No quantity-based questions available for discounts.</Alert>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default ServiceSettingsForm
