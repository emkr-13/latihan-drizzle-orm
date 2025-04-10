import express from 'express';
import authRoutes from './routes/auth';
import bookRoutes from './routes/book';

const app = express();
const PORT = process.env.APP_PORT || 3000;

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', bookRoutes); 

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});