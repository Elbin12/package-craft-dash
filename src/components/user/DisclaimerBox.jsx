import { Box, Typography } from "@mui/material";
import { useState } from "react";

export default function DisclaimerBox({ title, content, bgColor, textColor }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show expand/collapse for very long content
  const isLong = content.length > 500; 
  const displayContent = isLong && !isExpanded 
    ? content.substring(0, 500) + "..." 
    : content;

  return (
    <Box
      sx={{
        backgroundColor: bgColor,
        padding: "15px",
        borderRadius: "6px",
        mb: 2,
        // border: "1px solid #ddd",
        maxHeight: isExpanded ? "none" : "350px",
        overflow: "hidden",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ color: textColor, mb: 1, fontWeight: "bold" }}
      >
        {title}:
      </Typography>

      <Typography
        variant="body2"
        sx={{
          color: textColor,
          fontSize: "14px",
          lineHeight: 1.7,
          whiteSpace: "pre-line", // ✅ preserves line breaks
          textAlign: "justify",
        }}
      >
        {displayContent}
      </Typography>

      {isLong && (
        <Typography
          component="span"
          sx={{
            display: "block",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
            mt: 1,
            fontSize: "13px",
            textAlign: "right",
            "&:hover": {
              color: "#0056b3",
            },
          }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </Typography>
      )}
    </Box>
  );
}
