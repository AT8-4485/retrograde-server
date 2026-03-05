import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// TODO: Mount routes here

// TODO: Global error handler here

export default app;
