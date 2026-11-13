import type { ReactNode } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { shortDate } from "@/utils/format";
import { statusColor, statusLabel, type Request } from "./api";

/** One helpdesk request; `actions` lets the admin view add controls underneath. */
export default function RequestCard({ r, showFlat, actions }: { r: Request; showFlat?: boolean; actions?: ReactNode }) {
  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1">{r.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {[showFlat && `Flat ${r.flatNo}`, r.category, r.createdAt ? `raised ${shortDate(r.createdAt)}` : "just now"].filter(Boolean).join(" · ")}
            </Typography>
          </Box>
          <Chip size="small" color={statusColor[r.status]} label={statusLabel[r.status]} />
        </Stack>
        {r.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-line" }}>
            {r.description}
          </Typography>
        )}
        {r.adminNote && (
          <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: "background.default", borderLeft: 3, borderColor: `${statusColor[r.status]}.main` }}>
            <Typography variant="caption" color="text.secondary">
              Update from the admin{r.updatedAt ? ` · ${shortDate(r.updatedAt)}` : ""}
            </Typography>
            <Typography variant="body2">{r.adminNote}</Typography>
          </Box>
        )}
        {actions && <Box sx={{ mt: 1.5 }}>{actions}</Box>}
      </CardContent>
    </Card>
  );
}
