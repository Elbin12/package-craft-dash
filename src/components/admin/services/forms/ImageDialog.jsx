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
} from "@mui/material"
import { Close } from "@mui/icons-material"

export const ImageDialog = ({ open, onClose, imageUrl, onImageChange, title }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(imageUrl)

  useEffect(() => {
    setPreviewUrl(imageUrl)
  }, [imageUrl])

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

  const handleSave = () => {
    if (selectedFile) {
      onImageChange(selectedFile)
    } else if (!imageUrl) {
      // If no image was selected and there was no initial image, clear it
      onImageChange(null)
    }
    onClose()
  }

  const handleRemove = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    onImageChange(null)
    onClose()
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
            <input type="file" hidden accept="image/*" onChange={handleFileSelect} />
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        {previewUrl && (
          <Button onClick={handleRemove} color="error">
            Remove Image
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!selectedFile && !previewUrl}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}