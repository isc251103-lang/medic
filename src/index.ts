import 'dotenv/config';
import express, { Express } from 'express';
import patientsRouter from './routes/patients';
import summariesRouter from './routes/summaries';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ルーティング
app.use('/api/v1/patients', patientsRouter);
app.use('/api/v1/summaries', summariesRouter);

// ヘルスチェック
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// エラーハンドリング
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    errorCode: 'INTERNAL_ERROR',
    message: '内部サーバーエラーが発生しました',
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

