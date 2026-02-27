import { Box, Typography } from "@mui/material";
import { useState } from "react";
import { QuillDeltaToHtmlConverter } from 'quill-delta-to-html';
import 'react-quill/dist/quill.snow.css';

export default function DisclaimerBox({ title, content, bgColor, textColor }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Convert Delta to HTML
  let htmlContent = "";
  try {
    const delta = typeof content === "string" ? JSON.parse(content) : content;
    const converter = new QuillDeltaToHtmlConverter(delta.ops, {
      inlineStyles: true, // ADD THIS LINE
    });
    htmlContent = converter.convert();
  } catch (err) {
    if (typeof content === "string") {
      htmlContent = content
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br/>");
      htmlContent = `<p>${htmlContent}</p>`;
    } else {
      htmlContent = "";
    }
  }

  // Count plain text for "Show more"
  const plainText = htmlContent.replace(/<[^>]+>/g, "");
  const isLong = plainText.length > 500;

  // Determine displayed HTML for collapsed state
  let displayHtml = htmlContent;
  if (isLong && !isExpanded) {
    const truncatedText = plainText.substring(0, 500) + "...";
    // Wrap truncated text in a <p> to preserve spacing
    displayHtml = `<p>${truncatedText}</p>`;
  }

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

      <div
        className="ql-editor"  // ADD THIS LINE
        dangerouslySetInnerHTML={{ __html: displayHtml }}
        style={{
          color: textColor,
          fontSize: "0.9rem",
          lineHeight: 1.7,
          textAlign: "justify",
          padding: 0,  // ADD THIS LINE to remove default Quill padding
        }}
      />


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
