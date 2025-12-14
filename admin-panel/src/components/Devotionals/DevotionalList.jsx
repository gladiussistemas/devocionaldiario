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
  Checkbox,
  Toolbar,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import devotionalService from '../../services/devotionalService';

// Custom SVG Icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M23.312,9.733c-1.684-2.515-5.394-6.733-11.312-6.733S2.373,7.219,.688,9.733c-.922,1.377-.922,3.156,0,4.533,1.684,2.515,5.394,6.733,11.312,6.733s9.627-4.219,11.312-6.733c.922-1.377,.922-3.156,0-4.533Zm-.831,3.977c-1.573,2.349-5.027,6.29-10.48,6.29S3.093,16.059,1.52,13.71c-.696-1.039-.696-2.381,0-3.42,1.573-2.349,5.027-6.29,10.48-6.29s8.907,3.941,10.48,6.29c.696,1.039,.696,2.381,0,3.42ZM12,7c-2.757,0-5,2.243-5,5s2.243,5,5,5,5-2.243,5-5-2.243-5-5-5Zm0,9c-2.206,0-4-1.794-4-4s1.794-4,4-4,4,1.794,4,4-1.794,4-4,4Z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M23.312,9.733c-.839-1.252-2.18-2.926-4.046-4.292l3.588-3.588c.195-.195,.195-.512,0-.707s-.512-.195-.707,0l-3.725,3.725c-1.743-1.089-3.877-1.872-6.421-1.872C6.082,3,2.373,7.219,.688,9.733c-.922,1.377-.922,3.156,0,4.533,.839,1.252,2.18,2.926,4.046,4.292l-3.588,3.588c-.195,.195-.195,.512,0,.707,.098,.098,.226,.146,.354,.146s.256-.049,.354-.146l3.725-3.725c1.743,1.089,3.877,1.872,6.421,1.872,5.918,0,9.627-4.219,11.312-6.733,.922-1.377,.922-3.156,0-4.533ZM1.52,13.71c-.696-1.039-.696-2.381,0-3.42,1.573-2.349,5.027-6.29,10.48-6.29,2.23,0,4.12,.664,5.689,1.604l-2.543,2.543c-.862-.705-1.948-1.146-3.146-1.146-2.757,0-5,2.243-5,5,0,1.198,.441,2.284,1.146,3.146l-2.692,2.692c-1.818-1.297-3.126-2.922-3.935-4.129Zm7.334,.73c-.527-.677-.853-1.517-.853-2.44,0-2.206,1.794-4,4-4,.922,0,1.762,.327,2.44,.853l-5.587,5.587Zm6.294-4.88c.527,.677,.853,1.517,.853,2.44,0,2.206-1.794,4-4,4-.922,0-1.762-.327-2.44-.853l5.587-5.587Zm7.334,4.15c-1.573,2.349-5.027,6.29-10.48,6.29-2.23,0-4.12-.664-5.689-1.604l2.543-2.543c.862,.705,1.948,1.146,3.146,1.146,2.757,0,5-2.243,5-5,0-1.198-.441-2.284-1.146-3.146l2.692-2.692c1.818,1.297,3.126,2.922,3.935,4.129,.696,1.039,.696,2.381,0,3.42Z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
    <path d="M21.5,4h-3.551c-.252-2.244-2.139-4-4.449-4h-3c-2.31,0-4.197,1.756-4.449,4H2.5c-.276,0-.5,.224-.5,.5s.224,.5,.5,.5h1.5v14.5c0,2.481,2.019,4.5,4.5,4.5h7c2.481,0,4.5-2.019,4.5-4.5V5h1.5c.276,0,.5-.224,.5-.5s-.224-.5-.5-.5ZM10.5,1h3c1.758,0,3.204,1.308,3.449,3H7.051c.245-1.692,1.691-3,3.449-3Zm8.5,18.5c0,1.93-1.57,3.5-3.5,3.5h-7c-1.93,0-3.5-1.57-3.5-3.5V5h14v14.5ZM10,10.5v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Zm5,0v7c0,.276-.224,.5-.5,.5s-.5-.224-.5-.5v-7c0-.276,.224-.5,.5-.5s.5,.224,.5,.5Z"/>
  </svg>
);

export default function DevotionalList() {
  const navigate = useNavigate();
  const [devotionals, setDevotionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    is_published: '',
  });
  const [tempFilters, setTempFilters] = useState({
    search: '',
    is_published: '',
  });
  const [selected, setSelected] = useState([]);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);

  useEffect(() => {
    fetchDevotionals();
    setSelected([]);
  }, [page, rowsPerPage, filters]);

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

  const handleTempFilterChange = (field, value) => {
    setTempFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setFilters(tempFilters);
    setPage(0);
    setSelected([]);
  };

  const handleEdit = (id) => {
    navigate(`/devotionals/edit/${id}`);
  };

  const handleView = (id) => {
    navigate(`/devotionals/view/${id}`);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(devotionals.map((d) => d.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = async () => {
    try {
      await Promise.all(
        selected.map((id) => {
          const devotional = devotionals.find((d) => d.id === id);
          return devotional && !devotional.is_published
            ? devotionalService.togglePublish(id, true)
            : Promise.resolve();
        })
      );
      setSelected([]);
      fetchDevotionals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao publicar devocionais');
    }
  };

  const handleBulkUnpublish = async () => {
    try {
      await Promise.all(
        selected.map((id) => {
          const devotional = devotionals.find((d) => d.id === id);
          return devotional && devotional.is_published
            ? devotionalService.togglePublish(id, false)
            : Promise.resolve();
        })
      );
      setSelected([]);
      fetchDevotionals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao despublicar devocionais');
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selected.map((id) => devotionalService.delete(id)));
      setBulkDeleteDialog(false);
      setSelected([]);
      fetchDevotionals();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao deletar devocionais');
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
        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            label="Buscar"
            variant="outlined"
            size="small"
            value={tempFilters.search}
            onChange={(e) => handleTempFilterChange('search', e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 250 }}
          />
          <TextField
            label="Status"
            variant="outlined"
            size="small"
            select
            value={tempFilters.is_published}
            onChange={(e) => handleTempFilterChange('is_published', e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Publicados</MenuItem>
            <MenuItem value="false">Rascunhos</MenuItem>
          </TextField>
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
          >
            Buscar
          </Button>
        </Box>
      </Paper>

      {selected.length > 0 && (
        <Paper sx={{ mb: 2 }}>
          <Toolbar
            sx={{
              bgcolor: 'primary.lighter',
              borderRadius: 1,
            }}
          >
            <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1">
              {selected.length} {selected.length === 1 ? 'item selecionado' : 'itens selecionados'}
            </Typography>
            <Tooltip title="Publicar selecionados">
              <Button
                size="medium"
                variant="outlined"
                startIcon={<EyeIcon />}
                onClick={handleBulkPublish}
                sx={{ mr: 2, px: 3, py: 1, color: '#000', borderColor: '#000', '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
              >
                Publicar
              </Button>
            </Tooltip>
            <Tooltip title="Despublicar selecionados">
              <Button
                size="medium"
                variant="outlined"
                startIcon={<EyeOffIcon />}
                onClick={handleBulkUnpublish}
                sx={{ mr: 2, px: 3, py: 1, color: '#000', borderColor: '#000', '&:hover': { borderColor: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
              >
                Despublicar
              </Button>
            </Tooltip>
            <Tooltip title="Excluir selecionados">
              <Button
                size="medium"
                variant="outlined"
                startIcon={<TrashIcon />}
                onClick={() => setBulkDeleteDialog(true)}
                sx={{ px: 3, py: 1, color: '#ff0000', borderColor: '#ff0000', '&:hover': { borderColor: '#ff0000', bgcolor: 'rgba(255,0,0,0.04)' } }}
              >
                Excluir
              </Button>
            </Tooltip>
          </Toolbar>
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < devotionals.length}
                  checked={devotionals.length > 0 && selected.length === devotionals.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Título</TableCell>
              <TableCell>Dia</TableCell>
              <TableCell>Data Publicação</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devotionals.map((devotional) => (
              <TableRow
                key={devotional.id}
                hover
                selected={selected.includes(devotional.id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(devotional.id)}
                    onChange={() => handleSelectOne(devotional.id)}
                  />
                </TableCell>
                <TableCell>{devotional.title}</TableCell>
                <TableCell>{devotional.day_number || '-'}</TableCell>
                <TableCell>{formatDate(devotional.publish_date)}</TableCell>
                <TableCell>
                  {devotional.tags && devotional.tags.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {devotional.tags.slice(0, 2).map((tag, index) => (
                        <Chip key={index} label={tag} size="small" variant="outlined" />
                      ))}
                      {devotional.tags.length > 2 && (
                        <Chip label={`+${devotional.tags.length - 2}`} size="small" variant="outlined" />
                      )}
                    </Box>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={devotional.is_published ? 'Publicado' : 'Rascunho'}
                    color={devotional.is_published ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Visualizar">
                    <IconButton
                      size="small"
                      onClick={() => handleView(devotional.id)}
                      sx={{ mr: 0.5 }}
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Editar">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(devotional.id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {devotionals.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
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
        open={bulkDeleteDialog}
        onClose={() => setBulkDeleteDialog(false)}
      >
        <DialogTitle>Confirmar exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja excluir {selected.length} {selected.length === 1 ? 'devocional' : 'devocionais'}? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleBulkDelete} color="error" autoFocus>
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
