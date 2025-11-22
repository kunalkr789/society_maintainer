import { Box, Card, CardContent, Typography, Stack, Chip } from '@mui/material'
import { useApp } from '@/store'
import { fmt } from '@/utils/date'
import { Campaign } from '@mui/icons-material'

export default function Notices() {
  const { db } = useApp()
  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Stack spacing={2}>
        {(db.notices ?? []).map((n: any) => {
          const dateStr = n?.createdAt?.seconds
            ? new Date(n.createdAt.seconds * 1000).toLocaleString()
            : n?.createdAt
            ? new Date(n.createdAt).toLocaleString()
            : "";
          return (
            <Card key={n.id} variant="outlined">
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack
                  direction="row"
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack spacing={0.5} sx={{ pr: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Campaign fontSize="small" />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {n.title}
                      </Typography>
                    </Stack>
                    {dateStr && (
                      <Typography variant="caption" color="text.secondary">
                        {dateStr}
                      </Typography>
                    )}
                    <Typography sx={{ whiteSpace: "pre-wrap", mt: 1 }}>
                      {n.body}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
        {(!db.notices || db.notices.length === 0) && (
          <Card variant="outlined">
            <CardContent>
              <Typography color="text.secondary">No notices yet.</Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
