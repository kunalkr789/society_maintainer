import type { ReactNode } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

type Tone = "primary" | "success" | "warning" | "error" | "info";

/** A labelled number with an icon, an optional hint line and optional footer (e.g. a progress bar). */
export default function StatCard({ label, value, hint, icon, tone = "primary", footer }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; footer?: ReactNode }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
              {value}
            </Typography>
            {hint && (
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.25 }}>
                {hint}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", color: `${tone}.main`, bgcolor: (t) => `${t.palette[tone].main}14`, flex: "none" }}>{icon}</Box>
          )}
        </Stack>
        {footer && <Box sx={{ mt: 1.5 }}>{footer}</Box>}
      </CardContent>
    </Card>
  );
}
