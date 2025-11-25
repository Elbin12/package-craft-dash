import { Box, Typography } from "@mui/material";
import { useState } from "react";

export default function DisclaimerBox({ title, content, bgColor, textColor }) {
  const [isExpanded, setIsExpanded] = useState(true);

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
        // maxHeight: isExpanded ? "none" : "350px",
        overflow: "hidden",
      }}
    >
      {/* <Typography
        variant="subtitle2"
        sx={{ color: textColor, mb: 1, fontWeight: "bold" }}
      >
        {title}:
      </Typography> */}

      <Typography
        variant="body2"
        sx={{
          color: textColor,
          fontSize: { xs: "0.5rem", sm: "0.75rem", md: "0.9rem" },
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
            fontSize: { xs: "0.5rem", sm: "1rem", md: "1.1rem" },
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
