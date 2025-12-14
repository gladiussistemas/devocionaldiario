import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material';
import devotionalService from '../../services/devotionalService';

export default function DevotionalView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [devotional, setDevotional] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    fetchDevotional();
  }, [id]);

  const fetchDevotional = async () => {
    try {
      setLoading(true);
      setError(null);
      const devotional = await devotionalService.getById(id);
      setDevotional(devotional);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar devocional');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/devotionals')}>
          Voltar
        </Button>
      </Box>
    );
  }

  if (!devotional) {
    return null;
  }

  // Organizar conteúdo por idioma
  const contentPt = devotional.devotional_contents?.find(c => c.language === 'pt') || {};
  const contentEn = devotional.devotional_contents?.find(c => c.language === 'en') || {};
  const currentContent = currentTab === 0 ? contentPt : contentEn;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Visualizar Devocional
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/devotionals/edit/${id}`)}
          >
            Editar
          </Button>
          <Button startIcon={<BackIcon />} onClick={() => navigate('/devotionals')}>
            Voltar
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 4 }}>
        {/* Informações Gerais */}
        <Box mb={4}>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <Chip label={`Slug: ${devotional.slug}`} variant="outlined" />
            <Chip label={`Data: ${formatDate(devotional.publish_date)}`} variant="outlined" />
            {devotional.day_number && (
              <Chip label={`Dia ${devotional.day_number}`} variant="outlined" />
            )}
            <Chip label={`${devotional.estimated_duration_minutes} min`} variant="outlined" />
            <Chip
              label={devotional.is_published ? 'Publicado' : 'Rascunho'}
              color={devotional.is_published ? 'success' : 'default'}
            />
          </Box>
          {devotional.tags && devotional.tags.length > 0 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Tags:
              </Typography>
              {devotional.tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Tabs de Idioma */}
        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Português" />
          <Tab label="English" />
        </Tabs>

        {/* Conteúdo */}
        <Box>
          {/* Título */}
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            {currentContent.title || 'Sem título'}
          </Typography>

          {/* Citação */}
          {currentContent.quote_text && (
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', borderLeft: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 1 }}>
                "{currentContent.quote_text}"
              </Typography>
              {currentContent.quote_author && (
                <Typography variant="body2" color="text.secondary" align="right">
                  — {currentContent.quote_author}
                </Typography>
              )}
            </Paper>
          )}

          {/* Conteúdo de Ensino */}
          {currentContent.teaching_content && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                Ensinamento
              </Typography>
              <Box
                sx={{
                  '& p': { mb: 2 },
                  '& h1, & h2, & h3': { mt: 3, mb: 2, fontWeight: 600 },
                  '& ul, & ol': { mb: 2, pl: 3 },
                }}
                dangerouslySetInnerHTML={{ __html: currentContent.teaching_content }}
              />
            </Box>
          )}

          {/* Perguntas de Reflexão */}
          {currentContent.reflection_questions && currentContent.reflection_questions.length > 0 && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                Perguntas para Reflexão
              </Typography>
              <Box component="ol" sx={{ pl: 3 }}>
                {currentContent.reflection_questions.map((question, index) => (
                  <Typography component="li" key={index} sx={{ mb: 1.5 }}>
                    {question}
                  </Typography>
                ))}
              </Box>
            </Box>
          )}

          {/* Oração Final */}
          {currentContent.closing_prayer && (
            <Box mb={4}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                Oração
              </Typography>
              <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                  {currentContent.closing_prayer}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Referências Bíblicas */}
          {devotional.biblical_references && devotional.biblical_references.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main', mb: 2 }}>
                Referências Bíblicas
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {devotional.biblical_references
                  .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                  .map((ref) => (
                    <Chip
                      key={ref.id}
                      label={`${ref.book} ${ref.chapter}:${ref.verse_start}${
                        ref.verse_end ? `-${ref.verse_end}` : ''
                      }`}
                      variant="outlined"
                      color="secondary"
                    />
                  ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
