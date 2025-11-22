import * as React from "react";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";

type Props = {
  title: string;
  body: string;
  createdAt?: any;
  accent?: "warning" | "info" | "success" | "error" | "secondary";
};

export default function NoticeBanner({
  title,
  body,
  createdAt,
  accent = "success",
}: Props) {
  // format date if present (Firestore Timestamp or ISO)
  const dateStr = createdAt
    ? createdAt?.seconds
      ? new Date(createdAt.seconds * 1000).toLocaleString()
      : new Date(createdAt).toLocaleString()
    : undefined;

  // Colorful, attention-grabbing banner
  const bgByAccent: Record<string, any> = {
    warning: { bg: "rgba(250, 204, 21, 0.15)", border: "#F59E0B" }, // amber
    info: { bg: "rgba(59, 130, 246, 0.12)", border: "#3B82F6" }, // blue
    success: { bg: "rgba(34, 197, 94, 0.12)", border: "#22C55E" }, // green
    error: { bg: "rgba(239, 68, 68, 0.12)", border: "#EF4444" }, // red
    secondary: { bg: "rgba(79, 70, 229, 0.12)", border: "#4F46E5" }, // indigo
  };
  const palette = bgByAccent[accent] ?? bgByAccent.warning;

  return (
    <Card
      elevation={0}
      sx={{
        borderLeft: `4px solid ${palette.border}`,
        background: `linear-gradient(0deg, ${palette.bg}, ${palette.bg}), #fff`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={1}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
          >
            <CampaignIcon sx={{ color: palette.border }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
            {dateStr && (
              <Chip
                size="small"
                label={dateStr}
                sx={{ ml: { xs: 0, sm: 1 } }}
              />
            )}
          </Stack>

          {/* Full body, not truncated */}
          <Typography
            variant="body1"
            sx={{ whiteSpace: "pre-wrap", color: "text.primary" }}
          >
            {body}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
