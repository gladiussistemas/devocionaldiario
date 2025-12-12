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
import themeService from '../../services/themeService';

const initialFormData = {
  slug: '',
  translations: {
    pt: { name: '', description: '' },
    en: { name: '', description: '' },
  },
};

export default function ThemeForm() {
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
      fetchTheme();
    }
  }, [id]);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      const theme = await themeService.getById(id);

      // Convert array of translations to object format
      const translationsObj = { pt: { name: '', description: '' }, en: { name: '', description: '' } };
      if (theme.theme_translations && Array.isArray(theme.theme_translations)) {
        theme.theme_translations.forEach((trans) => {
          translationsObj[trans.language] = {
            name: trans.name || '',
            description: trans.description || '',
          };
        });
      }

      setFormData({
        slug: theme.slug,
        translations: translationsObj,
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar tema');
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
          description: value.description,
        }));

      const payload = {
        slug: formData.slug,
        translations: translationsArray,
      };

      if (isEditing) {
        await themeService.update(id, payload);
        setSuccess('Tema atualizado com sucesso!');
      } else {
        await themeService.create(payload);
        setSuccess('Tema criado com sucesso!');
        setTimeout(() => navigate('/themes'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar tema');
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
          {isEditing ? 'Editar Tema' : 'Novo Tema'}
        </Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/themes')}>
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
          helperText="URL amigável (ex: fe, oracao, gratidao)"
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
            label="Descrição"
            value={formData.translations[currentLanguage].description}
            onChange={(e) =>
              handleTranslationChange(currentLanguage, 'description', e.target.value)
            }
            fullWidth
            multiline
            rows={4}
            helperText="Breve descrição do tema"
          />
        </Box>

        <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
          <Button variant="outlined" onClick={() => navigate('/themes')}>
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
