import express from 'express';

const app = express();

const jsonBodyMiddleware = express.json();
app.use(jsonBodyMiddleware);

export { app };