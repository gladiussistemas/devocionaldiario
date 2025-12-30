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
import { Save as SaveIcon, ArrowBack as BackIcon, Translate as TranslateIcon, Edit as EditIcon } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import devotionalService from '../../services/devotionalService';
import BiblicalRefInput from './BiblicalRefInput';

const initialFormData = {
  slug: '',
  publish_date: new Date().toISOString().split('T')[0],
  day_number: '',
  estimated_duration_minutes: 10,
  tags: [],
  is_published: false,
  contents: {
    pt: {
      title: '',
      quote_author: '',
      quote_text: '',
      teaching_content: '',
      reflection_questions: [],
      closing_prayer: '',
    },
    en: {
      title: '',
      quote_author: '',
      quote_text: '',
      teaching_content: '',
      reflection_questions: [],
      closing_prayer: '',
    },
  },
  biblical_references: [],
};

export default function DevotionalForm({ readOnly = false }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [suggestedDayNumber, setSuggestedDayNumber] = useState(null);

  useEffect(() => {
    if (isEditing) {
      fetchDevotional();
    } else {
      fetchNextDayNumber();
    }
  }, [id]);

  const fetchNextDayNumber = async () => {
    try {
      const data = await devotionalService.getAll({ limit: 1, page: 1 });
      if (data.devotionals && data.devotionals.length > 0) {
        const maxDay = Math.max(...data.devotionals.map(d => d.day_number || 0).filter(Boolean));
        setSuggestedDayNumber(maxDay + 1);
      } else {
        setSuggestedDayNumber(1);
      }
    } catch (err) {
      setSuggestedDayNumber(1);
    }
  };

  const fetchDevotional = async () => {
    try {
      setLoading(true);
      const devotional = await devotionalService.getById(id);

      // Convert array of contents to object format
      const contentsObj = {
        pt: {
          title: '',
          quote_author: '',
          quote_text: '',
          opening_inspiration: '',
          teaching_content: '',
          reflection_questions: [],
          action_step: '',
          closing_prayer: '',
        },
        en: {
          title: '',
          quote_author: '',
          quote_text: '',
          opening_inspiration: '',
          teaching_content: '',
          reflection_questions: [],
          action_step: '',
          closing_prayer: '',
        }
      };
      if (devotional.devotional_contents && Array.isArray(devotional.devotional_contents)) {
        devotional.devotional_contents.forEach((content) => {
          contentsObj[content.language] = {
            title: content.title || '',
            quote_author: content.quote_author || '',
            quote_text: content.quote_text || '',
            opening_inspiration: content.opening_inspiration || '',
            teaching_content: content.teaching_content || '',
            reflection_questions: content.reflection_questions || [],
            action_step: content.action_step || '',
            closing_prayer: content.closing_prayer || '',
          };
        });
      }

      // Transform API response to form structure
      setFormData({
        slug: devotional.slug,
        publish_date: devotional.publish_date.split('T')[0],
        day_number: devotional.day_number || '',
        estimated_duration_minutes: devotional.estimated_duration_minutes || 10,
        tags: devotional.tags || [],
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

  const handleTranslate = async () => {
    try {
      setIsTranslating(true);
      setError(null);

      // Check if PT content is filled
      if (!formData.contents.pt.title || !formData.contents.pt.teaching_content) {
        setError('Preencha pelo menos o Título e o Devocional em Português antes de traduzir');
        return;
      }

      // Call translation API
      const translated = await devotionalService.translate(
        formData.contents.pt,
        formData.biblical_references
      );

      console.log('📥 Conteúdo original PT:', formData.contents.pt);
      console.log('📤 Tradução recebida EN:', translated.content);
      console.log('📚 Referências traduzidas:', translated.biblical_references);

      // Update EN content with translations
      setFormData((prev) => ({
        ...prev,
        contents: {
          ...prev.contents,
          en: {
            title: translated.content.title || '',
            quote_author: translated.content.quote_author || '',
            quote_text: translated.content.quote_text || '',
            teaching_content: translated.content.teaching_content || '',
            reflection_questions: translated.content.reflection_questions || [],
            closing_prayer: translated.content.closing_prayer || '',
          },
        },
        biblical_references: prev.biblical_references.map((ref, index) => {
          const translatedRef = translated.biblical_references[index];
          return {
            ...ref,
            reference_text: translatedRef?.reference_text_en || ref.reference_text,
            scripture_text: {
              pt: ref.scripture_text?.pt || '',
              en: translatedRef?.scripture_text_en || '',
            },
          };
        }),
      }));

      console.log('✅ Estado atualizado - verificando PT:', formData.contents.pt);

      setSuccess('Conteúdo traduzido com sucesso! Revise a aba "English" antes de salvar.');
      setCurrentTab(1); // Switch to EN tab
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao traduzir conteúdo. Verifique se a chave do DeepL está configurada.');
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmit = async (publish = false) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Validate required fields
      if (!formData.slug) {
        setError('Preencha o slug');
        return;
      }

      if (!formData.contents.pt.title || !formData.contents.pt.teaching_content) {
        setError('Preencha pelo menos o título e o devocional em português');
        return;
      }

      // Transform form data to API format
      // Convert contents object to array format
      const contentsArray = Object.entries(formData.contents)
        .filter(([_, value]) => value.title) // Only include contents with a title
        .map(([language, value]) => ({
          language,
          title: value.title,
          quote_author: value.quote_author || null,
          quote_text: value.quote_text || null,
          opening_inspiration: value.opening_inspiration || null,
          teaching_content: value.teaching_content,
          reflection_questions: value.reflection_questions || [],
          action_step: value.action_step || null,
          closing_prayer: value.closing_prayer,
        }));

      const payload = {
        slug: formData.slug,
        publish_date: formData.publish_date,
        day_number: formData.day_number ? parseInt(formData.day_number) : null,
        estimated_duration_minutes: parseInt(formData.estimated_duration_minutes),
        tags: formData.tags,
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
          {readOnly ? 'Visualizar Devocional' : isEditing ? 'Editar Devocional' : 'Novo Devocional'}
        </Typography>
        <Box display="flex" gap={2}>
          {readOnly && isEditing && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/devotionals/edit/${id}`)}
            >
              Editar
            </Button>
          )}
          <Button startIcon={<BackIcon />} onClick={() => navigate('/devotionals')}>
            Voltar
          </Button>
        </Box>
      </Box>

      {readOnly && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Você está visualizando este devocional. Clique em "Editar" para fazer alterações.
        </Alert>
      )}

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
            disabled={readOnly}
            helperText="URL amigável (ex: confianca-em-deus)"
          />
          <TextField
            label="Data de Publicação"
            type="date"
            value={formData.publish_date}
            onChange={(e) => handleChange('publish_date', e.target.value)}
            fullWidth
            required
            disabled={readOnly}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box display="flex" gap={2} mb={3}>
          <TextField
            label="Dia do Plano"
            type="number"
            value={formData.day_number}
            onChange={(e) => handleChange('day_number', e.target.value)}
            disabled={readOnly}
            helperText={suggestedDayNumber ? `Próximo disponível: ${suggestedDayNumber}` : "Número do dia no plano"}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Duração (minutos)"
            type="number"
            value={formData.estimated_duration_minutes}
            onChange={(e) => handleChange('estimated_duration_minutes', e.target.value)}
            helperText="Tempo estimado de leitura"
            sx={{ flex: 1 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                backgroundColor: '#fff',
                color: '#000',
                border: '1px solid #ddd',
                borderRadius: 1,
                minHeight: 48,
                '&.Mui-selected': {
                  backgroundColor: '#000',
                  color: '#fff',
                },
              },
            }}
          >
            <Tab label="Português" sx={{ mr: 1, minWidth: 120 }} />
            <Tab label="English" sx={{ minWidth: 120 }} />
          </Tabs>
          <Button
            variant="outlined"
            startIcon={isTranslating ? <CircularProgress size={16} /> : <TranslateIcon />}
            onClick={handleTranslate}
            disabled={isTranslating || loading || currentTab !== 0}
            size="small"
          >
            {isTranslating ? 'Traduzindo...' : 'Traduzir PT → EN'}
          </Button>
        </Box>

        <Box>
          <TextField
            label="Título"
            value={formData.contents[currentLanguage].title}
            onChange={(e) => handleContentChange(currentLanguage, 'title', e.target.value)}
            fullWidth
            required={currentLanguage === 'pt'}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Citação Diária</Typography>

          <TextField
            label="Autor da Citação"
            value={formData.contents[currentLanguage].quote_author}
            onChange={(e) => handleContentChange(currentLanguage, 'quote_author', e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Texto da Citação"
            value={formData.contents[currentLanguage].quote_text}
            onChange={(e) => handleContentChange(currentLanguage, 'quote_text', e.target.value)}
            fullWidth
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />

          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Conteúdo do Devocional</Typography>

          <Typography variant="subtitle2" gutterBottom>
            Devocional {currentLanguage === 'pt' && '*'}
          </Typography>
          <Box sx={{ mb: 3, '& .quill': { height: '300px', mb: 5 } }}>
            <ReactQuill
              theme="snow"
              value={formData.contents[currentLanguage].teaching_content}
              onChange={(value) => handleContentChange(currentLanguage, 'teaching_content', value)}
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
            Perguntas de Reflexão
          </Typography>
          <TextField
            value={formData.contents[currentLanguage].reflection_questions.join('\n')}
            onChange={(e) => handleContentChange(
              currentLanguage,
              'reflection_questions',
              e.target.value.split('\n').filter(Boolean)
            )}
            fullWidth
            multiline
            rows={4}
            sx={{ mb: 3 }}
            helperText="Uma pergunta por linha"
          />

          <Typography variant="subtitle2" gutterBottom>
            Oração {currentLanguage === 'pt' && '*'}
          </Typography>
          <Box sx={{ mb: 3, '& .quill': { height: '150px', mb: 5 } }}>
            <ReactQuill
              theme="snow"
              value={formData.contents[currentLanguage].closing_prayer}
              onChange={(value) => handleContentChange(currentLanguage, 'closing_prayer', value)}
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

        {!readOnly && (
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
        )}
      </Paper>
    </Box>
  );
}
