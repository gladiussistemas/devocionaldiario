import { Grid, Paper, Typography, Box } from '@mui/material';
import { MenuBook, Person, Category } from '@mui/icons-material';

const StatCard = ({ title, value, icon, color }) => (
  <Paper sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ color, fontSize: 48 }}>{icon}</Box>
    </Box>
  </Paper>
);

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Bem-vindo ao painel administrativo de devocionais
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Devocionais"
            value="3"
            icon={<MenuBook />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Autores"
            value="3"
            icon={<Person />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Temas"
            value="5"
            icon={<Category />}
            color="success.main"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          🚀 Próximos Passos
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Devocionais:</strong> Gerencie os devocionais publicados
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Autores:</strong> Adicione e edite informações de autores
        </Typography>
        <Typography variant="body2" paragraph>
          • <strong>Temas:</strong> Organize devocionais por temas
        </Typography>
      </Paper>
    </Box>
  );
}
