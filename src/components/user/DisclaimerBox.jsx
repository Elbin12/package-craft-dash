import { Box, Typography } from "@mui/material";
import { useState } from "react";

export default function DisclaimerBox({ title, content, bgColor, textColor, borderColor }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = content.length > 200; // Show expand/collapse for text longer than 200 chars
  
  const displayContent = isLong && !isExpanded 
    ? content.substring(0, 200) + '...' 
    : content;

  return (
    <Box 
      sx={{ 
        backgroundColor: bgColor,
        padding: '15px',
        borderRadius: '4px',
        mb: 2,
      }}
    >
      <Typography 
        variant="body2" 
        sx={{ 
          color: textColor,
          fontSize: '14px',
          lineHeight: 1.6,
          textAlign: 'justify',
          wordWrap: 'break-word'
        }}
      >
        <strong>{title}:</strong> {displayContent}
        {isLong && (
          <Typography
            component="span"
            sx={{
              color: '#007bff',
              cursor: 'pointer',
              textDecoration: 'underline',
              ml: 1,
              fontSize: '13px',
              '&:hover': {
                color: '#0056b3'
              }
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </Typography>
        )}
      </Typography>
    </Box>
  );
}