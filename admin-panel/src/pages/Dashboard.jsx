import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from '@mui/material';
import {
  Edit as EditIcon,
} from '@mui/icons-material';
import devotionalService from '../services/devotionalService';

// Custom SVG Icons
const DevotionalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="m17.5,0H6.5C4.019,0,2,2.019,2,4.5v16c0,1.93,1.57,3.5,3.5,3.5h12c2.481,0,4.5-2.019,4.5-4.5V4.5c0-2.481-2.019-4.5-4.5-4.5ZM3,4.5c0-1.93,1.57-3.5,3.5-3.5h11c1.93,0,3.5,1.57,3.5,3.5v12.5H5.5c-.98,0-1.864.407-2.5,1.058V4.5Zm14.5,18.5H5.5c-1.378,0-2.5-1.121-2.5-2.5s1.122-2.5,2.5-2.5h15.5v1.5c0,1.93-1.57,3.5-3.5,3.5Zm-6.604-9.391c.325.262.715.392,1.104.392s.779-.13,1.104-.392c1.171-.942,3.896-3.374,3.896-5.614,0-1.652-1.233-2.996-2.75-2.996-.938,0-1.768.493-2.274,1.248-.486-.76-1.294-1.248-2.226-1.248-1.517,0-2.75,1.344-2.75,2.996,0,2.24,2.724,4.672,3.896,5.614Zm-1.146-7.609c.959,0,1.711.86,1.711,1.958,0,.276.224.5.5.5s.5-.224.5-.5c0-1.08.802-1.958,1.789-1.958.965,0,1.75.895,1.75,1.996,0,1.476-1.819,3.465-3.522,4.834-.281.226-.674.226-.955,0-1.703-1.369-3.522-3.358-3.522-4.834,0-1.101.785-1.996,1.75-1.996Z"/>
  </svg>
);

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M23.312,9.733c-1.684-2.515-5.394-6.733-11.312-6.733S2.373,7.219,.688,9.733c-.922,1.377-.922,3.156,0,4.533,1.684,2.515,5.394,6.733,11.312,6.733s9.627-4.219,11.312-6.733c.922-1.377,.922-3.156,0-4.533Zm-.831,3.977c-1.573,2.349-5.027,6.29-10.48,6.29S3.093,16.059,1.52,13.71c-.696-1.039-.696-2.381,0-3.42,1.573-2.349,5.027-6.29,10.48-6.29s8.907,3.941,10.48,6.29c.696,1.039,.696,2.381,0,3.42ZM12,7c-2.757,0-5,2.243-5,5s2.243,5,5,5,5-2.243,5-5-2.243-5-5-5Zm0,9c-2.206,0-4-1.794-4-4s1.794-4,4-4,4,1.794,4,4-1.794,4-4,4Z"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
    <path d="M23.312,9.733c-.839-1.252-2.18-2.926-4.046-4.292l3.588-3.588c.195-.195,.195-.512,0-.707s-.512-.195-.707,0l-3.725,3.725c-1.743-1.089-3.877-1.872-6.421-1.872C6.082,3,2.373,7.219,.688,9.733c-.922,1.377-.922,3.156,0,4.533,.839,1.252,2.18,2.926,4.046,4.292l-3.588,3.588c-.195,.195-.195,.512,0,.707,.098,.098,.226,.146,.354,.146s.256-.049,.354-.146l3.725-3.725c1.743,1.089,3.877,1.872,6.421,1.872,5.918,0,9.627-4.219,11.312-6.733,.922-1.377,.922-3.156,0-4.533ZM1.52,13.71c-.696-1.039-.696-2.381,0-3.42,1.573-2.349,5.027-6.29,10.48-6.29,2.23,0,4.12,.664,5.689,1.604l-2.543,2.543c-.862-.705-1.948-1.146-3.146-1.146-2.757,0-5,2.243-5,5,0,1.198,.441,2.284,1.146,3.146l-2.692,2.692c-1.818-1.297-3.126-2.922-3.935-4.129Zm7.334,.73c-.527-.677-.853-1.517-.853-2.44,0-2.206,1.794-4,4-4,.922,0,1.762,.327,2.44,.853l-5.587,5.587Zm6.294-4.88c.527,.677,.853,1.517,.853,2.44,0,2.206-1.794,4-4,4-.922,0-1.762-.327-2.44-.853l5.587-5.587Zm7.334,4.15c-1.573,2.349-5.027,6.29-10.48,6.29-2.23,0-4.12-.664-5.689-1.604l2.543-2.543c.862,.705,1.948,1.146,3.146,1.146,2.757,0,5-2.243,5-5,0-1.198-.441-2.284-1.146-3.146l2.692-2.692c1.818,1.297,3.126,2.922,3.935,4.129,.696,1.039,.696,2.381,0,3.42Z"/>
  </svg>
);

const StatCard = ({ title, value, icon, color, loading }) => (
  <Paper sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        {loading ? (
          <CircularProgress size={32} />
        ) : (
          <Typography variant="h4" component="div" sx={{ fontWeight: 600, color: '#000' }}>
            {value}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ color }}>{icon}</Box>
    </Box>
  </Paper>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    drafts: 0,
  });
  const [recentDevotionals, setRecentDevotionals] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch all devotionals to calculate stats
      const data = await devotionalService.getAll({ page: 1, limit: 100 });

      const devotionals = data.devotionals || [];

      setStats({
        total: devotionals.length,
        published: devotionals.filter(d => d.is_published).length,
        drafts: devotionals.filter(d => !d.is_published).length,
      });

      // Get 5 most recent devotionals
      setRecentDevotionals(devotionals.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Bem-vindo ao painel administrativo de devocionais GlowUp
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total de Devocionais"
            value={stats.total}
            icon={<DevotionalIcon />}
            color="#000"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Publicados"
            value={stats.published}
            icon={<EyeIcon />}
            color="#000"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Rascunhos"
            value={stats.drafts}
            icon={<EyeOffIcon />}
            color="#000"
            loading={loading}
          />
        </Grid>
      </Grid>

      <Paper sx={{ mt: 3 }}>
        <Box sx={{ p: 3, pb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Devocionais Recentes
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Data de Publicação</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentDevotionals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        Nenhum devocional encontrado. Crie seu primeiro devocional!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentDevotionals.map((devotional) => (
                    <TableRow key={devotional.id} hover>
                      <TableCell>{devotional.title}</TableCell>
                      <TableCell>{formatDate(devotional.publish_date)}</TableCell>
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
                          onClick={() => navigate(`/devotionals/edit/${devotional.id}`)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}
