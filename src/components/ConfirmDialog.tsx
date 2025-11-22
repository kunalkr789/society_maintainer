import * as React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material'

type Props = {
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  onClose: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  open, title = 'Are you sure?', message = 'This action cannot be undone.',
  confirmText = 'Delete', cancelText = 'Cancel', onClose, onConfirm
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelText}</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  )
}