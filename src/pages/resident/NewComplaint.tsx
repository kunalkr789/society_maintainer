import { Box, Card, CardContent, Typography, TextField, Button, Stack } from '@mui/material'

export default function NewComplaint() {
  return (
    <Box sx={{ px:{ xs:2, md:3 }}}>
      <Card>
        <CardContent>
          <Typography variant="h6">Raise Complaint</Typography>
          <Stack spacing={2} sx={{ mt:1 }}>
            <TextField label="Title" />
            <TextField label="Description" multiline minRows={3} />
            <Button variant="contained">Submit</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
