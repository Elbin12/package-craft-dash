"use client"

import { useCallback, useMemo, useState, useEffect } from "react"
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Stack,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  InputAdornment,
} from "@mui/material"
import { Delete as DeleteIcon, Add as AddIcon, Save as SaveIcon } from "@mui/icons-material"
import {
  useGetHouseSizesQuery,
  useCreateHouseSizesMutation,
  useDeleteHouseSizeMutation,
} from "../../store/api/houseSizesApi"

const parseNumber = (v) => {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

const HouseSizeInfo = () => {
  const { data: fetched, isLoading: isFetching, isError, error } = useGetHouseSizesQuery()
  const [createHouseSizes, { isLoading: isSaving }] = useCreateHouseSizesMutation()
  const [deleteHouseSize] = useDeleteHouseSizeMutation()

  const [rows, setRows] = useState([{ max: "", andUp: false }])
  const [initialized, setInitialized] = useState(false)
  const [packages, setPackages] = useState(["Package 1", "Package 2", "Package 3"])
  const [packageValues, setPackageValues] = useState({})
  const [savingRows, setSavingRows] = useState(new Set())

  useEffect(() => {
    if (!initialized && Array.isArray(fetched)) {
      const mappedRows = fetched.map((r) => ({
        id: r.id,
        max: r.max_sqft != null ? String(r.max_sqft) : "",
        andUp: r.max_sqft == null,
      }))

      const newPackageValues = {}
      const packageSet = new Set()

      fetched.forEach((r, idx) => {
        newPackageValues[idx] = {}
        r.template_prices.forEach((tp) => {
          newPackageValues[idx][tp.label] = tp.price.toString()
          packageSet.add(tp.label)
        })
      })

      setRows(mappedRows.length ? mappedRows : [{ max: "", andUp: false }])
      setPackageValues(newPackageValues)
      setPackages(Array.from(packageSet))
      setInitialized(true)
    }
  }, [fetched, initialized])


  const derivedRows = useMemo(() => {
    const result = []
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const prev = result[i - 1]
      const prevMax = i === 0 ? 0 : prev && prev.max !== "" ? parseNumber(prev.max) : null
      const min_sq_ft = i === 0 ? 0 : prevMax !== null ? prevMax + 1 : ""
      result.push({
        min: min_sq_ft,
        max: row.max,
        andUp: row.andUp,
      })
      if (row.andUp) break
    }
    return result
  }, [rows])

  const handleChangeMax = useCallback((index, value) => {
    setRows((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], max: value, andUp: false }
      return copy
    })
  }, [])

  const toggleAndUp = (index) => {
    setRows((prev) => {
      const copy = [...prev]
      const currently = copy[index].andUp
      copy[index] = {
        ...copy[index],
        andUp: !currently,
        max: currently ? copy[index].max : "",
      }
      if (!currently) {
        copy.splice(index + 1)
      }
      return copy
    })
  }

  const handleAddRow = () => {
    setRows((prev) => {
      if (prev.some((r) => r.andUp)) return prev
      return [...prev, { max: "", andUp: false }]
    })
    setPackageValues((prev) => {
      const newValues = { ...prev }
      const newIndex = rows.length
      newValues[newIndex] = {}
      packages.forEach((pkg) => {
        newValues[newIndex][pkg] = ""
      })
      return newValues
    })
  }

  const handleDeleteRow = async (index) => {
    const row = rows[index]
    if (row.id) {
      try {
        await deleteHouseSize(row.id).unwrap()
        alert(`Row ${index + 1} deleted successfully`)
      } catch (error) {
        console.error("Delete failed:", error)
        alert("Failed to delete row from server.")
        return // Do not proceed to remove from local state
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index))
    setPackageValues((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const handleAddPackage = () => {
    setPackages((prev) => {
      const nextIndex = prev.length + 1
      return [...prev, `Package ${nextIndex}`]
    })
    setPackageValues((prev) => {
      const updated = { ...prev }
      rows.forEach((_, idx) => {
        const key = String(idx)
        if (!updated[key]) updated[key] = {}
        updated[key][`Package ${packages.length + 1}`] = ""
      })
      return updated
    })
  }

  const handlePackageValueChange = (rowIndex, packageName, value) => {
    setPackageValues((prev) => ({
      ...prev,
      [rowIndex]: {
        ...prev[rowIndex],
        [packageName]: value,
      },
    }))
  }

  const getRowError = (row, idx, derived) => {
    if (row.andUp) return ""
    const min = idx === 0 ? 0 : derived[idx - 1]?.max !== "" ? parseNumber(derived[idx - 1].max) + 1 : 0
    if (row.max === "") return ""
    const maxParsed = parseNumber(row.max)
    if (maxParsed === null) return "Invalid number"
    if (maxParsed < min) return `Must be ≥ ${min}`
    return ""
  }

  const handleSaveRow = async (rowIndex) => {
    const row = derivedRows[rowIndex]
    if (!row) return

    const minParsed = parseNumber(String(row.min))
    const maxParsed = parseNumber(row.max)

    if (minParsed === null) {
      alert("Invalid minimum value")
      return
    }

    const packagesForRow = packageValues[rowIndex] || {}

    const template_prices = Object.entries(packagesForRow).map(([label, priceStr], idx) => {
      const price = parseFloat(priceStr)
      return {
        label,
        price: isNaN(price) ? 0 : price,
        order: idx + 1,
      }
    })

    const payload = {
      min_sqft: minParsed,
      max_sqft: row.andUp || row.max === "" ? null : maxParsed,
      order: rowIndex + 1,
      template_prices,
    }

    setSavingRows((prev) => new Set([...prev, rowIndex]))

    try {
      await createHouseSizes(payload).unwrap()
      alert(`Row ${rowIndex + 1} saved successfully!`)
    } catch (err) {
      console.error("Save error:", err)
      alert(`Error saving row ${rowIndex + 1}`)
    } finally {
      setSavingRows((prev) => {
        const newSet = new Set(prev)
        newSet.delete(rowIndex)
        return newSet
      })
    }
  }


  return (
    <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" mb={2}>
        House Size Information
      </Typography>
      <Typography variant="body2" mb={2} color="text.secondary">
        Define square footage ranges. Minimum is auto-derived; edit maximum. Any row can be toggled to "And Up" (no
        upper bound). Rows after an "And Up" are removed.
      </Typography>

      {isFetching && <Typography sx={{ mb: 2 }}>Loading existing ranges...</Typography>}
      {isError && (
        <Typography color="error" sx={{ mb: 2 }}>
          Failed to load ranges. {error?.toString ? error.toString() : ""}
        </Typography>
      )}

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button onClick={handleAddPackage} variant="outlined" size="small">
          + Add Package Column
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold", minWidth: 80 }}>Minimum</TableCell>
              <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Maximum</TableCell>
              {packages.map((pkg) => (
                <TableCell key={pkg} sx={{ fontWeight: "bold", minWidth: 120 }}>
                  Minimum <br /> {pkg}
                </TableCell>
              ))}
              <TableCell sx={{ fontWeight: "bold", width: 100 }}>And Up</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: 80 }}>Save</TableCell>
              <TableCell sx={{ width: 60 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {derivedRows.map((row, index) => {
              const errorText = getRowError(rows[index], index, derivedRows)
              const isRowSaving = savingRows.has(index)

              return (
                <TableRow key={index}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Sq Ft</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {row.min === "" ? "-" : row.min}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {!row.andUp ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="body2">to</Typography>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Maximum"
                          value={rows[index]?.max || ""}
                          onChange={(e) => handleChangeMax(index, e.target.value)}
                          sx={{ width: 100 }}
                          inputProps={{ min: 0 }}
                          error={!!errorText}
                          helperText={errorText}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        And Up
                      </Typography>
                    )}
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={`${index}-${pkg}`}>
                      <TextField
                        size="small"
                        placeholder="0"
                        value={packageValues[index]?.[pkg] || ""}
                        onChange={(e) => handlePackageValueChange(index, pkg, e.target.value)}
                        sx={{ width: 100 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">$</InputAdornment>,
                        }}
                      />
                    </TableCell>
                  ))}
                  <TableCell>
                    <Checkbox size="small" checked={rows[index]?.andUp || false} onChange={() => toggleAndUp(index)} />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      aria-label="save row"
                      size="small"
                      onClick={() => handleSaveRow(index)}
                      color="primary"
                      disabled={isRowSaving}
                    >
                      <SaveIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <IconButton aria-label="delete" size="small" onClick={() => handleDeleteRow(index)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {derivedRows.length === 0 && !isFetching && (
        <Typography sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
          No ranges defined. Click "Add New Option" to start.
        </Typography>
      )}

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          size="small"
          data-testid="add-new-option"
          disabled={rows.some((r) => r.andUp)}
        >
          + Add New Option
        </Button>
      </Stack>
    </Box>
  )
}

export default HouseSizeInfo
