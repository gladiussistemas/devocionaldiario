import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as PublishedIcon,
  VisibilityOff as UnpublishedIcon,
} from '@mui/icons-material';
import devotionalService from '../../services/devotionalService';
import authorService from '../../services/authorService';
import themeService from '../../services/themeService';

export default function DevotionalList() {
  const navigate = useNavigate();
  const [devotionals, setDevotionals] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    author_id: '',
    theme_id: '',
    is_published: '',
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  useEffect(() => {
    fetchAuthorsAndThemes();
  }, []);

  useEffect(() => {
    fetchDevotionals();
  }, [page, rowsPerPage, filters]);

  const fetchAuthorsAndThemes = async () => {
    try {
      const [authorsData, themesData] = await Promise.all([
        authorService.getAllPublic(),
        themeService.getAllPublic(),
      ]);
      setAuthors(authorsData);
      setThemes(themesData);
    } catch (err) {
      console.error('Error fetching authors/themes:', err);
    }
  };

  const fetchDevotionals = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        ),
      };
      const data = await devotionalService.getAll(params);
      setDevotionals(data.devotionals || []);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao carregar devocionais');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleEdit = (id) => {
    navigate(`/devotionals/edit/${id}`);
  };

  const handleDelete = async () => {
    try {
      await devotionalService.delete(deleteDialog.id);
      setDeleteDialog({ open: false, id: null });
      fetchDevotionals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao deletar devocional');
    }
  };

  const handleTogglePublish = async (id, currentStatus) => {
    try {
      await devotionalService.togglePublish(id, !currentStatus);
      fetchDevotionals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao alterar status');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading && devotionals.length === 0) {
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
          Devocionais
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/devotionals/new')}
        >
          Novo Devocional
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            sx={{ minWidth: 250 }}
          />
          <TextField
            label="Autor"
            variant="outlined"
            size="small"
            select
            value={filters.author_id}
            onChange={(e) => handleFilterChange('author_id', e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {authors.map((author) => (
              <MenuItem key={author.id} value={author.id}>
                {author.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Tema"
            variant="outlined"
            size="small"
            select
            value={filters.theme_id}
            onChange={(e) => handleFilterChange('theme_id', e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {themes.map((theme) => (
              <MenuItem key={theme.id} value={theme.id}>
                {theme.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Status"
            variant="outlined"
            size="small"
            select
            value={filters.is_published}
            onChange={(e) => handleFilterChange('is_published', e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Publicados</MenuItem>
            <MenuItem value="false">Rascunhos</MenuItem>
          </TextField>
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell>Tema</TableCell>
              <TableCell>Data Publicação</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devotionals.map((devotional) => (
              <TableRow key={devotional.id} hover>
                <TableCell>{devotional.title}</TableCell>
                <TableCell>{devotional.author?.name || '-'}</TableCell>
                <TableCell>{devotional.theme?.name || '-'}</TableCell>
                <TableCell>{formatDate(devotional.publication_date)}</TableCell>
                <TableCell>
                  <Chip
                    label={devotional.is_published ? 'Publicado' : 'Rascunho'}
                    color={devotional.is_published ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleTogglePublish(devotional.id, devotional.is_published)}
                    title={devotional.is_published ? 'Despublicar' : 'Publicar'}
                  >
                    {devotional.is_published ? <UnpublishedIcon /> : <PublishedIcon />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(devotional.id)}
                    title="Editar"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setDeleteDialog({ open: true, id: devotional.id })}
                    title="Deletar"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {devotionals.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography variant="body2" color="text.secondary" py={3}>
                    Nenhum devocional encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </TableContainer>

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir este devocional? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
