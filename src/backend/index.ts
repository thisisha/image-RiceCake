import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { menuRoutes } from './routes/menu';
import { imageRoutes } from './routes/image';
import { errorHandler } from './middleware/errorHandler';

// 환경 변수 로드
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use('/uploads', express.static('uploads'));

// 라우트
app.use('/api/menu', menuRoutes);
app.use('/api/image', imageRoutes);

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 에러 핸들러
app.use(errorHandler);

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Vercel에서는 listen을 호출하지 않음
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 RiceCake v2.0 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📱 프론트엔드: http://localhost:3000`);
    console.log(`🔧 백엔드 API: http://localhost:${PORT}/api`);
  });
}

export default app;
