import { Box, TextField, IconButton, Button, Paper, Typography } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';

export default function BiblicalRefInput({ references, onChange }) {
  const handleAdd = () => {
    onChange([
      ...references,
      { book: '', chapter: '', verse_start: '', verse_end: '', reference_text: '' },
    ]);
  };

  const handleRemove = (index) => {
    onChange(references.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...references];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-generate reference_text
    if (field === 'book' || field === 'chapter' || field === 'verse_start' || field === 'verse_end') {
      const ref = updated[index];
      if (ref.book && ref.chapter && ref.verse_start) {
        const verseRange = ref.verse_end ? `${ref.verse_start}-${ref.verse_end}` : ref.verse_start;
        updated[index].reference_text = `${ref.book} ${ref.chapter}:${verseRange}`;
      }
    }

    onChange(updated);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">Referências Bíblicas</Typography>
        <Button startIcon={<AddIcon />} onClick={handleAdd} size="small">
          Adicionar Referência
        </Button>
      </Box>

      {references.length === 0 && (
        <Typography variant="body2" color="text.secondary" align="center" py={2}>
          Nenhuma referência adicionada
        </Typography>
      )}

      {references.map((ref, index) => (
        <Paper key={index} sx={{ p: 2, mb: 2 }}>
          <Box display="flex" gap={2} alignItems="flex-start">
            <TextField
              label="Livro"
              value={ref.book}
              onChange={(e) => handleChange(index, 'book', e.target.value)}
              size="small"
              fullWidth
              placeholder="Ex: John, Psalms, Genesis"
              helperText="Nome do livro em inglês"
            />
            <TextField
              label="Capítulo"
              type="number"
              value={ref.chapter}
              onChange={(e) => handleChange(index, 'chapter', e.target.value)}
              size="small"
              sx={{ width: 100 }}
            />
            <TextField
              label="Versículo Inicial"
              type="number"
              value={ref.verse_start}
              onChange={(e) => handleChange(index, 'verse_start', e.target.value)}
              size="small"
              sx={{ width: 120 }}
            />
            <TextField
              label="Versículo Final"
              type="number"
              value={ref.verse_end}
              onChange={(e) => handleChange(index, 'verse_end', e.target.value)}
              size="small"
              sx={{ width: 120 }}
              placeholder="Opcional"
            />
            <IconButton
              onClick={() => handleRemove(index)}
              color="error"
              size="small"
              sx={{ mt: 0.5 }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
          <TextField
            label="Texto de Referência"
            value={ref.reference_text}
            onChange={(e) => handleChange(index, 'reference_text', e.target.value)}
            size="small"
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Ex: João 3:16 ou Salmos 23:1-6"
            helperText="Gerado automaticamente, mas pode ser editado"
          />
        </Paper>
      ))}
    </Box>
  );
}
