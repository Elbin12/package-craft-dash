import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Close } from "@mui/icons-material"

const runOnImageChange = (cb, value) => {
  if (!cb) return Promise.resolve()
  const out = cb(value)
  return out && typeof out.then === "function" ? out : Promise.resolve()
}

export const ImageDialog = ({
  open,
  onClose,
  imageUrl,
  onImageChange,
  title,
  accept = "image/jpeg,image/png,image/gif,image/webp,image/svg+xml,.svg",
}) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(imageUrl)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    setPreviewUrl(imageUrl)
  }, [imageUrl])

  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setSaveError(null)
    }
  }, [open])

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    if (!onImageChange) {
      onClose()
      return
    }
    setSaveError(null)
    if (selectedFile) {
      setSaving(true)
      try {
        await runOnImageChange(onImageChange, selectedFile)
        onClose()
      } catch (e) {
        setSaveError(
          e?.data?.detail ||
            e?.data?.message ||
            (typeof e?.data === "string" ? e.data : null) ||
            e?.message ||
            "Save failed. Please try again.",
        )
      } finally {
        setSaving(false)
      }
      return
    }
    if (!imageUrl) {
      setSaving(true)
      try {
        await runOnImageChange(onImageChange, null)
        onClose()
      } catch (e) {
        setSaveError(
          e?.data?.detail ||
            e?.data?.message ||
            (typeof e?.data === "string" ? e.data : null) ||
            e?.message ||
            "Save failed. Please try again.",
        )
      } finally {
        setSaving(false)
      }
      return
    }
    onClose()
  }

  const handleRemove = async () => {
    if (!onImageChange) {
      setSelectedFile(null)
      setPreviewUrl(null)
      onClose()
      return
    }
    setSaveError(null)
    setSaving(true)
    try {
      await runOnImageChange(onImageChange, null)
      setSelectedFile(null)
      setPreviewUrl(null)
      onClose()
    } catch (e) {
      setSaveError(
        e?.data?.detail ||
          e?.data?.message ||
          (typeof e?.data === "string" ? e.data : null) ||
          e?.message ||
          "Remove failed. Please try again.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{title}</Typography>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {saveError && (
            <Alert severity="error" sx={{ width: "100%" }} onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Preview"
              sx={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                borderRadius: 1,
                border: "1px solid #e0e0e0",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed #ccc",
                borderRadius: 1,
                backgroundColor: "#f5f5f5",
              }}
            >
              <Typography color="text.secondary">No image selected</Typography>
            </Box>
          )}

          <Button variant="outlined" component="label" fullWidth>
            {previewUrl ? "Change Image" : "Upload Image"}
            <input type="file" hidden accept={accept} onChange={handleFileSelect} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        {previewUrl && (
          <Button onClick={handleRemove} color="error" disabled={saving}>
            Remove Image
          </Button>
        )}
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving || (!selectedFile && !previewUrl)}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}