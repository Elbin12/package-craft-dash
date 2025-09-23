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
  Tab,
  Tabs,
  Skeleton,
} from "@mui/material"
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Save as SaveIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import {
  useGetHouseSizesQuery,
  useCreateHouseSizesMutation,
  useDeleteHouseSizeMutation,
  useUpdateHouseSizesMutation,
} from "../../store/api/houseSizesApi"
import { commercial_id, residential_id } from "../../store/axios/axios"

const parseNumber = (v) => {
  const n = Number.parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

const HouseSizeInfo = () => {
  const [propertyType, setPropertyType] = useState("residential")
  const [type_id, setTypeId] = useState(residential_id)

  const { data: fetched, isLoading, isFetching, isError, error, refetch } =
    useGetHouseSizesQuery(type_id, {
      refetchOnMountOrArgChange: true,
    })
  const [createHouseSizes, { isLoading: isSaving }] =
    useCreateHouseSizesMutation()
  const [updateHouseSizes] = useUpdateHouseSizesMutation()
  const [deleteHouseSize] = useDeleteHouseSizeMutation()

  const [rows, setRows] = useState([{ max: "", andUp: false }])
  const [initialized, setInitialized] = useState(false)
  const [packages, setPackages] = useState(["Package 1", "Package 2", "Package 3"])
  const [packageValues, setPackageValues] = useState({})
  const [savingRows, setSavingRows] = useState(new Set())

  // Reset initialized state when property type changes
  useEffect(() => {
    setInitialized(false)
    setRows([{ max: "", andUp: false }])
    setPackageValues({})
    setPackages(["Package 1", "Package 2", "Package 3"])
  }, [fetched, propertyType])

  useEffect(() => {
    setTypeId(propertyType === "residential" ? residential_id : commercial_id)
  }, [propertyType])

  useEffect(() => {
    if (!initialized && Array.isArray(fetched)) {
      const mappedRows = fetched.map((r, idx) => ({
        id: r.id || `temp-${idx}`, // Ensure each row has a unique ID for DnD
        max: r.max_sqft != null ? String(r.max_sqft) : "",
        andUp: r.max_sqft == null,
        originalId: r.id, // Keep original ID separate for API calls
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

      setRows(mappedRows.length ? mappedRows : [{ id: "temp-0", max: "", andUp: false }])
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
      const prevMax =
        i === 0 ? 0 : prev && prev.max !== "" ? parseNumber(prev.max) : null
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

  const handlePropertyTypeChange = (event, newValue) => {
    setPropertyType(newValue)
  }

  const handleChangeMax = useCallback((index, value) => {
    setRows((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], max: value, andUp: false }

      const currentMax = parseNumber(value)
      if (currentMax !== null) {
        let lastMax = currentMax
        for (let i = index + 1; i < copy.length; i++) {
          if (copy[i].andUp) break
          const nextRowMax = parseNumber(copy[i].max)
          const requiredMinimum = lastMax + 1
          if (nextRowMax === null || nextRowMax < requiredMinimum) {
            const newMax = lastMax + 500
            copy[i] = { ...copy[i], max: String(newMax) }
            lastMax = newMax
          } else {
            lastMax = nextRowMax
          }
        }
      }
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
      const newId = `temp-${Date.now()}`
      return [...prev, { id: newId, max: "", andUp: false }]
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
    if (row.originalId) {
      try {
        await deleteHouseSize(row.originalId).unwrap()
        alert(`Row ${index + 1} deleted successfully`)
      } catch (error) {
        console.error("Delete failed:", error)
        alert("Failed to delete row from server.")
        return
      }
    }
    setRows((prev) => prev.filter((_, i) => i !== index))
    setPackageValues((prev) => {
      const updated = { ...prev }
      delete updated[index]
      const reindexed = {}
      Object.keys(updated).forEach((key, idx) => {
        if (parseInt(key) > index) {
          reindexed[idx] = updated[key]
        } else if (parseInt(key) < index) {
          reindexed[key] = updated[key]
        }
      })
      return reindexed
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
    if (!row) return ""   // prevent crash if row is undefined
    if (!derived[idx]) return ""
    if (row.andUp) return ""
    
    const min =
      idx === 0
        ? 0
        : derived[idx - 1]?.max !== ""
        ? parseNumber(derived[idx - 1].max) + 1
        : 0

    if (row.max === "") return ""
    const maxParsed = parseNumber(row.max)
    if (maxParsed === null) return "Invalid number"
    if (maxParsed < min) return `Must be ≥ ${min}`
    return ""
  }

  const hasErrors = useMemo(() => {
      return rows.some((row, index) => !!getRowError(row, index, derivedRows))
    }, [rows, derivedRows])

  // Drag and drop handler
  const handleOnDragEnd = (result) => {
    if (!result.destination) return

    const { source, destination } = result

    if (source.index === destination.index) return

    // Reorder rows
    setRows((prev) => {
      const newRows = Array.from(prev)
      const [reorderedItem] = newRows.splice(source.index, 1)
      newRows.splice(destination.index, 0, reorderedItem)
      return newRows
    })

    // Reorder package values
    setPackageValues((prev) => {
      const newValues = { ...prev }
      const sourceValues = newValues[source.index]
      const reorderedValues = {}
      
      // Create a new mapping based on the reordered rows
      const newRowsOrder = Array.from(rows)
      const [reorderedItem] = newRowsOrder.splice(source.index, 1)
      newRowsOrder.splice(destination.index, 0, reorderedItem)
      
      newRowsOrder.forEach((row, newIndex) => {
        const oldIndex = rows.findIndex(r => r.id === row.id)
        if (newValues[oldIndex]) {
          reorderedValues[newIndex] = newValues[oldIndex]
        }
      })
      
      return reorderedValues
    })
  }

  const handleSaveAffectedRows = async (startIndex) => {
    return new Promise((resolve) => {
      setRows((currentRows) => {
        setPackageValues((currentPackageValues) => {
          const affectedRows = []
          const freshDerivedRows = []
          for (let i = 0; i < currentRows.length; i++) {
            const row = currentRows[i]
            const prev = freshDerivedRows[i - 1]
            const prevMax =
              i === 0
                ? 0
                : prev && prev.max !== ""
                ? parseNumber(prev.max)
                : null
            const min_sq_ft = i === 0 ? 0 : prevMax !== null ? prevMax + 1 : ""
            freshDerivedRows.push({
              min: min_sq_ft,
              max: row.max,
              andUp: row.andUp,
            })
            if (row.andUp) break
          }

          for (let i = startIndex; i < freshDerivedRows.length; i++) {
            const row = freshDerivedRows[i]
            const originalRow = currentRows[i]
            if (!row) continue
            const minParsed = parseNumber(String(row.min))
            const maxParsed = parseNumber(originalRow.max)
            if (minParsed === null) {
              alert(`Invalid minimum value for row ${i + 1}`)
              resolve()
              return currentPackageValues
            }

            const packagesForRow = currentPackageValues[i] || {}
            const template_prices = Object.entries(packagesForRow).map(
              ([label, priceStr], idx) => {
                const price = parseFloat(priceStr)
                return {
                  label,
                  price: isNaN(price) ? 0 : price,
                  order: idx + 1,
                }
              }
            )

            affectedRows.push({
              index: i,
              payload: {
                min_sqft: minParsed,
                max_sqft:
                  originalRow.andUp || originalRow.max === ""
                    ? null
                    : maxParsed,
                order: i + 1,
                property_type: type_id,
                template_prices,
              },
              isNew: !originalRow.originalId,
              id: originalRow.originalId,
            })
          }

          const saveRows = async () => {
            setSavingRows((prev) => {
              const newSet = new Set(prev)
              affectedRows.forEach((row) => newSet.add(row.index))
              return newSet
            })

            try {
              for (const rowData of affectedRows) {
                if (rowData.isNew) {
                  await createHouseSizes(rowData.payload).unwrap()
                } else {
                  await updateHouseSizes({
                    id: rowData.id,
                    sizes: rowData.payload,
                  }).unwrap()
                }
              }

              alert(`Successfully updated ${affectedRows.length} row(s)`)
              setInitialized(false)
              await refetch();
            } catch (err) {
              console.error("Save error:", err)
              alert(`Error saving rows: ${err.message || "Unknown error"}`)
            } finally {
              setSavingRows((prev) => {
                const newSet = new Set(prev)
                affectedRows.forEach((row) => newSet.delete(row.index))
                return newSet
              })
              resolve()
            }
          }
          saveRows()
          return currentPackageValues
        })
        return currentRows
      })
    })
  }

  const handleSaveAll = async () => {
    await handleSaveAffectedRows(0)
  }

  return (
    <Box sx={{ p: 3, background: "#fff", borderRadius: 2, boxShadow: 1 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={propertyType}
          onChange={handlePropertyTypeChange}
          aria-label="property type tabs"
        >
          <Tab
            label="Residential Sizes"
            value="residential"
            sx={{
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: propertyType === "residential" ? 600 : 400,
            }}
          />
          <Tab
            label="Commercial Sizes"
            value="commercial"
            sx={{
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: propertyType === "commercial" ? 600 : 400,
            }}
          />
        </Tabs>
      </Box>

      <Typography variant="h6" mb={2}>
        House Size Information
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Define square footage ranges. Minimum is auto-derived from the previous row's maximum + 1.  
        When you update a maximum value, it automatically updates the minimum of subsequent rows. Any row can be toggled to "And Up" (no upper bound). Rows after an "And Up" are removed.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        You can now <strong>drag and drop rows</strong> to reorder sizes.  
        Minimum values will auto-update after reordering. Use the drag handle (⋮⋮) to move rows.
      </Typography>

      {isFetching ? (
        <>
          {/* Skeleton for Add Package Column button */}
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Skeleton variant="rectangular" width={162} height={32} sx={{ borderRadius: 1 }} />
          </Box>
          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 80 }}>Minimum</TableCell>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>Maximum</TableCell>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Package 1</TableCell>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 120 }}>Package 2</TableCell>
                  <TableCell sx={{ fontWeight: "bold", width: 100 }}>And Up</TableCell>
                  <TableCell sx={{ width: 60 }}></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[...Array(3)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={35} sx={{borderRadius: 1}} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={35} sx={{borderRadius: 1}}/>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={35} sx={{borderRadius: 1}}/>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={100} height={35} sx={{borderRadius: 1}}/>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="circular" width={20} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="circular" width={24} height={24} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Skeleton for footer buttons */}
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Skeleton variant="rectangular" width={150} height={28} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={85} height={28} sx={{ borderRadius: 1 }} />
          </Stack>
        </>
      ) : (
        <>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button onClick={handleAddPackage} variant="outlined" size="small">
              + Add Package Column
            </Button>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold", width: 40 }}>
                    {/* Drag handle column */}
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 80 }}>
                    Minimum
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", minWidth: 100 }}>
                    Maximum
                  </TableCell>
                  {packages.map((pkg) => (
                    <TableCell key={pkg} sx={{ fontWeight: "bold", minWidth: 120 }}>
                      {pkg}
                    </TableCell>
                  ))}
                  <TableCell sx={{ fontWeight: "bold", width: 100 }}>
                    And Up
                  </TableCell>
                  <TableCell sx={{ width: 80 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="house-sizes-table">
                  {(provided, snapshot) => (
                    <TableBody
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      sx={{
                        backgroundColor: snapshot.isDraggingOver ? '#f0f8ff' : 'transparent',
                        transition: 'background-color 0.2s ease',
                      }}
                    >
                      {derivedRows.map((row, index) => {
                        const errorText = getRowError(rows[index], index, derivedRows)
                        const isRowSaving = savingRows.has(index)

                        return (
                          <Draggable
                            key={rows[index]?.id || `row-${index}`}
                            draggableId={rows[index]?.id || `row-${index}`}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <TableRow
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                sx={{
                                  backgroundColor: snapshot.isDragging 
                                    ? '#e3f2fd' 
                                    : snapshot.draggingOver 
                                    ? '#f5f5f5' 
                                    : 'transparent',
                                  transform: snapshot.isDragging 
                                    ? provided.draggableProps.style?.transform + ' rotate(2deg)'
                                    : provided.draggableProps.style?.transform,
                                  boxShadow: snapshot.isDragging 
                                    ? '0 8px 24px rgba(0,0,0,0.15)' 
                                    : 'none',
                                  transition: snapshot.isDragging 
                                    ? 'none' 
                                    : 'all 0.2s ease',
                                  zIndex: snapshot.isDragging ? 1000 : 'auto',
                                  '&:hover': {
                                    backgroundColor: snapshot.isDragging 
                                      ? '#e3f2fd' 
                                      : '#f9f9f9',
                                  }
                                }}
                              >
                                <TableCell>
                                  <div
                                    {...provided.dragHandleProps}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: snapshot.isDragging ? 'grabbing' : 'grab',
                                    }}
                                  >
                                    <DragIndicatorIcon 
                                      sx={{ 
                                        color: snapshot.isDragging ? 'primary.main' : 'text.secondary',
                                        transition: 'color 0.2s ease',
                                      }} 
                                    />
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body1" fontWeight={500}>
                                    {row.min === "" ? "-" : row.min}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {!row.andUp ? (
                                    <TextField
                                      size="small"
                                      type="number"
                                      placeholder="Maximum"
                                      value={rows[index]?.max || ""}
                                      onChange={(e) =>
                                        handleChangeMax(index, e.target.value)
                                      }
                                      sx={{ width: 100 }}
                                      inputProps={{ min: 0 }}
                                      error={!!errorText}
                                      helperText={errorText}
                                    />
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
                                      onChange={(e) =>
                                        handlePackageValueChange(
                                          index,
                                          pkg,
                                          e.target.value
                                        )
                                      }
                                      sx={{ width: 100 }}
                                      InputProps={{
                                        startAdornment: (
                                          <InputAdornment position="start">$</InputAdornment>
                                        ),
                                      }}
                                    />
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Checkbox
                                    size="small"
                                    checked={rows[index]?.andUp || false}
                                    onChange={() => toggleAndUp(index)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <IconButton
                                    aria-label="delete"
                                    size="small"
                                    onClick={() => handleDeleteRow(index)}
                                    color="error"
                                    disabled={savingRows.size > 0}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </TableBody>
                  )}
                </Droppable>
              </DragDropContext>
            </Table>
          </TableContainer>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddRow}
              disabled={rows.some((r) => r.andUp)}
            >
              Add Range
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSaveAll}
              disabled={isSaving || savingRows.size > 0 || hasErrors}
            >
              {isSaving || savingRows.size > 0 ? "Saving..." : "Save All"}
            </Button>
          </Stack>
        </>
      )}
    </Box>
  )
}

export default HouseSizeInfo