import * as React from "react";
import { useNavigate } from "react-router-dom";
import { IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function BackButton({
  tooltip = "Go Back",
  fallback = "/",
  size = "medium",
}: {
  tooltip?: string;
  fallback?: string;
  size?: "small" | "medium" | "large";
}) {
  const nav = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) nav(-1);
    else nav(fallback); // fallback if no history
  };

  return (
    <Tooltip title={tooltip}>
      <IconButton
        color="primary"
        onClick={handleBack}
        size={size}
        sx={{
          bgcolor: "none",
          //boxShadow: 1,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <ArrowBackIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  );
}