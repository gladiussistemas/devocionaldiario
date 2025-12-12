import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  MenuItem,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import devotionalService from '../../services/devotionalService';
import authorService from '../../services/authorService';
import themeService from '../../services/themeService';
import BiblicalRefInput from './BiblicalRefInput';

const initialFormData = {
  slug: '',
  author_id: '',
  theme_id: '',
  publication_date: new Date().toISOString().split('T')[0],
  is_published: false,
  contents: {
    pt: { title: '', content: '', prayer: '' },
    en: { title: '', content: '', prayer: '' },
  },
  biblical_references: [],
};

export default function DevotionalForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [authors, setAuthors] = useState([]);
  const [themes, setThemes] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchAuthorsAndThemes();
    if (isEditing) {
      fetchDevotional();
    }
  }, [id]);

  const fetchAuthorsAndThemes = async () => {
    try {
      const [authorsData, themesData] = await Promise.all([
        authorService.getAllPublic(),
        themeService.getAllPublic(),
      ]);
      setAuthors(authorsData);
      setThemes(themesData);
    } catch (err) {
      setError('Erro ao carregar autores e temas');
    }
  };

  const fetchDevotional = async () => {
    try {
      setLoading(true);
      const devotional = await devotionalService.getById(id);

      // Convert array of contents to object format
      const contentsObj = {
        pt: { title: '', content: '', prayer: '' },
        en: { title: '', content: '', prayer: '' }
      };
      if (devotional.devotional_contents && Array.isArray(devotional.devotional_contents)) {
        devotional.devotional_contents.forEach((content) => {
          contentsObj[content.language] = {
            title: content.title || '',
            content: content.content || '',
            prayer: content.prayer || '',
          };
        });
      }

      // Transform API response to form structure
      setFormData({
        slug: devotional.slug,
        author_id: devotional.author_id,
        theme_id: devotional.theme_id,
        publication_date: devotional.publication_date.split('T')[0],
        is_published: devotional.is_published,
        contents: contentsObj,
        biblical_references: devotional.biblical_references || [],
      });
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar devocional');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContentChange = (language, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contents: {
        ...prev.contents,
        [language]: {
          ...prev.contents[language],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (publish = false) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.slug || !formData.author_id || !formData.theme_id) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }

      if (!formData.contents.pt.title || !formData.contents.pt.content) {
        setError('Preencha pelo menos o título e conteúdo em português');
        return;
      }

      // Transform form data to API format
      // Convert contents object to array format
      const contentsArray = Object.entries(formData.contents)
        .filter(([_, value]) => value.title) // Only include contents with a title
        .map(([language, value]) => ({
          language,
          title: value.title,
          content: value.content,
          prayer: value.prayer,
        }));

      const payload = {
        slug: formData.slug,
        author_id: formData.author_id,
        theme_id: formData.theme_id,
        publication_date: formData.publication_date,
        is_published: publish,
        contents: contentsArray,
        biblical_references: formData.biblical_references.filter(
          (ref) => ref.book && ref.chapter && ref.verse_start
        ),
      };

      if (isEditing) {
        await devotionalService.update(id, payload);
        setSuccess('Devocional atualizado com sucesso!');
      } else {
        await devotionalService.create(payload);
        setSuccess('Devocional criado com sucesso!');
        setTimeout(() => navigate('/devotionals'), 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao salvar devocional');
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
          {isEditing ? 'Editar Devocional' : 'Novo Devocional'}
        </Typography>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/devotionals')}>
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

      <Paper sx={{ p: 3 }}>
        <Box display="flex" gap={2} mb={3}>
          <TextField
            label="Slug"
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            fullWidth
            required
            helperText="URL amigável (ex: confianca-em-deus)"
          />
          <TextField
            label="Data de Publicação"
            type="date"
            value={formData.publication_date}
            onChange={(e) => handleChange('publication_date', e.target.value)}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <TextField
            label="Autor"
            select
            value={formData.author_id}
            onChange={(e) => handleChange('author_id', e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="">Selecione um autor</MenuItem>
            {authors.map((author) => (
              <MenuItem key={author.id} value={author.id}>
                {author.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Tema"
            select
            value={formData.theme_id}
            onChange={(e) => handleChange('theme_id', e.target.value)}
            fullWidth
            required
          >
            <MenuItem value="">Selecione um tema</MenuItem>
            {themes.map((theme) => (
              <MenuItem key={theme.id} value={theme.id}>
                {theme.name}
              </MenuItem>
            ))}
          </TextField>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Português" />
          <Tab label="English" />
        </Tabs>

        <Box>
          <TextField
            label="Título"
            value={formData.contents[currentLanguage].title}
            onChange={(e) => handleContentChange(currentLanguage, 'title', e.target.value)}
            fullWidth
            required={currentLanguage === 'pt'}
            sx={{ mb: 3 }}
          />

          <Typography variant="subtitle2" gutterBottom>
            Conteúdo {currentLanguage === 'pt' && '*'}
          </Typography>
          <Box sx={{ mb: 3, '& .quill': { height: '300px', mb: 5 } }}>
            <ReactQuill
              theme="snow"
              value={formData.contents[currentLanguage].content}
              onChange={(value) => handleContentChange(currentLanguage, 'content', value)}
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['blockquote', 'code-block'],
                  ['link'],
                  ['clean'],
                ],
              }}
            />
          </Box>

          <Typography variant="subtitle2" gutterBottom>
            Oração
          </Typography>
          <Box sx={{ mb: 3, '& .quill': { height: '150px', mb: 5 } }}>
            <ReactQuill
              theme="snow"
              value={formData.contents[currentLanguage].prayer}
              onChange={(value) => handleContentChange(currentLanguage, 'prayer', value)}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ list: 'bullet' }],
                  ['clean'],
                ],
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <BiblicalRefInput
          references={formData.biblical_references}
          onChange={(refs) => handleChange('biblical_references', refs)}
        />

        <Box display="flex" gap={2} justifyContent="flex-end" mt={4}>
          <Button
            variant="outlined"
            onClick={() => handleSubmit(false)}
            disabled={loading}
          >
            Salvar Rascunho
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={() => handleSubmit(true)}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Publicar'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
