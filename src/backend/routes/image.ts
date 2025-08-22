import { Router, Request, Response } from 'express';
import { MenuRequest, ImageGenerationResponse } from '../../types';
import { ImageService } from '../services/ImageService';
import { DBAService } from '../services/DBAService';
import { createError } from '../middleware/errorHandler';

const router = Router();
let imageService: ImageService | null = null;
let dbaService: DBAService | null = null;

// 지연 초기화 함수
function getImageService(): ImageService {
  if (!imageService) {
    imageService = new ImageService();
  }
  return imageService;
}

function getDBAService(): DBAService {
  if (!dbaService) {
    dbaService = new DBAService();
  }
  return dbaService;
}

// 이미지 생성 요청
router.post('/generate', async (req: Request, res: Response) => {
  const reqId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { items, templateId = 'standard' }: MenuRequest & { templateId?: string } = req.body;
    console.log(`🚀 [${reqId}] 이미지 생성 요청 시작:`, items?.map(item => item.name));

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw createError('메뉴 아이템이 필요합니다.', 400);
    }

    // DBA 매칭 및 캐시 확인
    const dbaResult = await getDBAService().findMatch(items);
    
    if (dbaResult.matched && dbaResult.cachedImage) {
      console.log(`💾 [${reqId}] 캐시된 이미지 사용:`, dbaResult.cachedImage);
      return res.json({
        success: true,
        data: {
          imageUrl: dbaResult.cachedImage,
          cached: true,
          confidence: dbaResult.confidence,
          message: '캐시된 이미지를 찾았습니다!'
        }
      });
    }

    // AI 이미지 생성
    const imageResult = await getImageService().generateTrayImage(items, templateId);
    
    if (!imageResult.success) {
      throw createError(imageResult.error || '이미지 생성에 실패했습니다.', 500);
    }

    // DBA에 결과 저장
    await getDBAService().saveResult(items, imageResult.imageUrl!);

    console.log(`✅ [${reqId}] 이미지 생성 성공:`, imageResult.imageUrl);
    res.json({
      success: true,
      data: {
        imageUrl: imageResult.imageUrl,
        cached: false,
        mock: imageResult.mock || false,
        confidence: 1.0,
        message: '새로운 이미지가 생성되었습니다!'
      }
    });

  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    console.error(`❌ [${reqId}] 이미지 생성 실패:`, error instanceof Error ? error.message : error);
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '이미지 생성 중 오류가 발생했습니다.'
    });
  }
});

// 이미지 미리보기 (개별 음식)
router.post('/preview', async (req: Request, res: Response) => {
  try {
    const { itemName, category }: { itemName: string; category: string } = req.body;

    if (!itemName || !category) {
      throw createError('음식 이름과 카테고리가 필요합니다.', 400);
    }

    const previewResult = await getImageService().generateFoodPreview(itemName, category);
    
    if (!previewResult.success) {
      throw createError(previewResult.error || '미리보기 생성에 실패했습니다.', 500);
    }

    res.json({
      success: true,
      data: {
        imageUrl: previewResult.imageUrl,
        itemName,
        category
      }
    });

  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '미리보기 생성 중 오류가 발생했습니다.'
    });
  }
});

// 이미지 다운로드
router.get('/download/:imageId', async (req: Request, res: Response) => {
  try {
    const { imageId } = req.params;
    
    // 실제 구현에서는 이미지 ID로 파일 경로를 찾아서 다운로드
    const imagePath = await getImageService().getImagePath(imageId);
    
    if (!imagePath) {
      throw createError('이미지를 찾을 수 없습니다.', 404);
    }

    res.download(imagePath, `ricecake_${imageId}.png`);

  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '이미지 다운로드 중 오류가 발생했습니다.'
    });
  }
});

// 이미지 품질 개선
router.post('/enhance', async (req: Request, res: Response) => {
  try {
    const { imageUrl, enhancementType = 'general' }: { imageUrl: string; enhancementType?: string } = req.body;

    if (!imageUrl) {
      throw createError('이미지 URL이 필요합니다.', 400);
    }

    const enhancedResult = await getImageService().enhanceImage(imageUrl, enhancementType);
    
    if (!enhancedResult.success) {
      throw createError(enhancedResult.error || '이미지 개선에 실패했습니다.', 500);
    }

    res.json({
      success: true,
      data: {
        originalUrl: imageUrl,
        enhancedUrl: enhancedResult.imageUrl,
        enhancementType
      }
    });

  } catch (error) {
    const statusCode = error instanceof Error && 'statusCode' in error ? (error as any).statusCode : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : '이미지 개선 중 오류가 발생했습니다.'
    });
  }
});

export { router as imageRoutes };
