import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import authorService from '../../services/authorService';

const initialFormData = {
  slug: '',
  translations: {
    pt: { name: '', bio: '' },
    en: { name: '', bio: '' },
  },
};

export default function AuthorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchAuthor();
    }
  }, [id]);

  const fetchAuthor = async () => {
    try {
      setLoading(true);
      const author = await authorService.getById(id);

      // Convert array of translations to object format
      const translationsObj = { pt: { name: '', bio: '' }, en: { name: '', bio: '' } };
      if (author.author_translations && Array.isArray(author.author_translations)) {
        author.author_translations.forEach((trans) => {
          translationsObj[trans.language] = {
            name: trans.name || '',
            bio: trans.bio || '',
          };
        });
      }

      setFormData({
        slug: author.slug,
        translations: translationsObj,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar autor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTranslationChange = (language, field, value) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [language]: {
          ...prev.translations[language],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.slug) {
        setError('O slug é obrigatório');
        return;
      }

      if (!formData.translations.pt.name) {
        setError('O nome em português é obrigatório');
        return;
      }

      // Convert translations object to array format expected by backend
      const translationsArray = Object.entries(formData.translations)
        .filter(([_, value]) => value.name) // Only include translations with a name
        .map(([language, value]) => ({
          language,
          name: value.name,
          bio: value.bio,
        }));

      const payload = {
        slug: formData.slug,
        translations: translationsArray,
      };

      if (isEditing) {
        await authorService.update(id, payload);
        setSuccess('Autor atualizado com sucesso!');
      } else {
        await authorService.create(payload);
        setSuccess('Autor criado com sucesso!');
        setTimeout(() => navigate('/authors'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar autor');
    } finally {
      setLoading(false);
    }
  };

  const currentLanguage = currentTab === 0 ? 'pt' : 'en';

  if (loading && isEditing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          {isEditing ? 'Editar Autor' : 'Novo Autor'}
        </Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/authors')}>
          Voltar
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <TextField
          label="Slug"
          value={formData.slug}
          onChange={(e) => handleChange('slug', e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
          helperText="URL amigável (ex: charles-spurgeon)"
        />

        <Divider sx={{ my: 3 }} />

        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Português" />
          <Tab label="English" />
        </Tabs>

        <Box>
          <TextField
            label="Nome"
            value={formData.translations[currentLanguage].name}
            onChange={(e) =>
              handleTranslationChange(currentLanguage, 'name', e.target.value)
            }
            fullWidth
            required={currentLanguage === 'pt'}
            sx={{ mb: 3 }}
          />

          <TextField
            label="Biografia"
            value={formData.translations[currentLanguage].bio}
            onChange={(e) =>
              handleTranslationChange(currentLanguage, 'bio', e.target.value)
            }
            fullWidth
            multiline
            rows={6}
            helperText="Breve biografia do autor"
          />
        </Box>

        <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
          <Button variant="outlined" onClick={() => navigate('/authors')}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
