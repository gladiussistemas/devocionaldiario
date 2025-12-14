import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  IconButton,
  Button,
  Paper,
  Typography,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import {
  getBookList,
  getChapters,
  getVerses,
  formatReference
} from '../../data/bibleStructure';

export default function BiblicalRefInput({ references, onChange }) {
  const bookList = getBookList();

  const handleAdd = () => {
    onChange([
      ...references,
      {
        book: '',
        chapter: '',
        verse_start: '',
        verse_end: '',
        reference_text: '',
        scripture_text: {}
      },
    ]);
  };

  const handleRemove = (index) => {
    onChange(references.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = [...references];
    const ref = { ...updated[index] };

    // When book changes, reset chapter and verses
    if (field === 'book') {
      ref.book = value;
      ref.chapter = '';
      ref.verse_start = '';
      ref.verse_end = '';
    }
    // When chapter changes, reset verses
    else if (field === 'chapter') {
      ref.chapter = value;
      ref.verse_start = '';
      ref.verse_end = '';
    }
    // Normal update
    else {
      ref[field] = value;
    }

    // Auto-generate reference_text
    if (ref.book && ref.chapter && ref.verse_start) {
      ref.reference_text = formatReference(
        ref.book,
        ref.chapter,
        ref.verse_start,
        ref.verse_end
      );
    }

    updated[index] = ref;
    onChange(updated);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="subtitle2">Referências Bíblicas</Typography>
        <Button startIcon={<AddIcon />} onClick={handleAdd} size="small" variant="outlined">
          Adicionar Referência
        </Button>
      </Box>

      {references.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            Nenhuma referência bíblica adicionada
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Clique em "Adicionar Referência" para começar
          </Typography>
        </Paper>
      )}

      {references.map((ref, index) => {
        const chapters = ref.book ? getChapters(ref.book) : [];
        const verses = ref.book && ref.chapter ? getVerses(ref.book, ref.chapter) : [];

        return (
          <Paper key={index} sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="caption" color="text.secondary" fontWeight="bold">
                REFERÊNCIA #{index + 1}
              </Typography>
              <IconButton
                onClick={() => handleRemove(index)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Row 1: Book */}
            <Box mb={2}>
              <TextField
                select
                label="Livro da Bíblia"
                value={ref.book}
                onChange={(e) => handleChange(index, 'book', e.target.value)}
                size="small"
                fullWidth
                required
                helperText="Selecione o livro da Bíblia"
              >
                <MenuItem value="" disabled>
                  <em>Selecione um livro</em>
                </MenuItem>

                {/* Old Testament */}
                <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main', mt: 1 }}>
                  ANTIGO TESTAMENTO
                </MenuItem>
                {bookList
                  .filter(book => book.testament === 'old')
                  .map((book) => (
                    <MenuItem key={book.value} value={book.value}>
                      {book.label}
                    </MenuItem>
                  ))}

                {/* New Testament */}
                <MenuItem disabled sx={{ fontWeight: 'bold', color: 'primary.main', mt: 2 }}>
                  NOVO TESTAMENTO
                </MenuItem>
                {bookList
                  .filter(book => book.testament === 'new')
                  .map((book) => (
                    <MenuItem key={book.value} value={book.value}>
                      {book.label}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            {/* Row 2: Chapter and Verses */}
            <Box display="flex" gap={2} mb={2}>
              <TextField
                select
                label="Capítulo"
                value={ref.chapter}
                onChange={(e) => handleChange(index, 'chapter', e.target.value)}
                size="small"
                sx={{ width: 150 }}
                disabled={!ref.book}
                required
              >
                <MenuItem value="" disabled>
                  <em>Cap.</em>
                </MenuItem>
                {chapters.map((ch) => (
                  <MenuItem key={ch} value={ch}>
                    {ch}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Versículo Inicial"
                value={ref.verse_start}
                onChange={(e) => handleChange(index, 'verse_start', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                disabled={!ref.chapter}
                required
              >
                <MenuItem value="" disabled>
                  <em>Vers.</em>
                </MenuItem>
                {verses.map((v) => (
                  <MenuItem key={v} value={v}>
                    {v}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Versículo Final"
                value={ref.verse_end}
                onChange={(e) => handleChange(index, 'verse_end', e.target.value)}
                size="small"
                sx={{ flex: 1 }}
                disabled={!ref.verse_start}
                helperText="Opcional"
              >
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {verses
                  .filter(v => v >= ref.verse_start)
                  .map((v) => (
                    <MenuItem key={v} value={v}>
                      {v}
                    </MenuItem>
                  ))}
              </TextField>
            </Box>

            {/* Row 3: Reference Text (auto-generated) */}
            {ref.reference_text && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'primary.50',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'primary.200'
                }}
              >
                <Typography variant="caption" color="primary.dark" fontWeight="bold">
                  REFERÊNCIA GERADA:
                </Typography>
                <Typography variant="body1" color="primary.main" fontWeight="bold">
                  {ref.reference_text}
                </Typography>
              </Box>
            )}

            {/* Row 4: Scripture Text (optional) */}
            <TextField
              label="Texto da Passagem (opcional)"
              value={ref.scripture_text?.pt || ''}
              onChange={(e) => {
                const updated = [...references];
                updated[index] = {
                  ...updated[index],
                  scripture_text: {
                    ...updated[index].scripture_text,
                    pt: e.target.value
                  }
                };
                onChange(updated);
              }}
              multiline
              rows={3}
              size="small"
              fullWidth
              sx={{ mt: 2 }}
              placeholder="Cole o texto da passagem bíblica aqui (opcional)"
              helperText="Você pode colar o texto completo da passagem para facilitar"
            />
          </Paper>
        );
      })}
    </Box>
  );
}
