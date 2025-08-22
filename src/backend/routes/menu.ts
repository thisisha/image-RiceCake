import { Router, Request, Response } from 'express';
import { MenuRequest, MenuItem } from '../../types';

const router = Router();

// 메뉴 입력 및 검증
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { items }: MenuRequest = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: '메뉴 아이템이 필요합니다.'
      });
    }

    // 메뉴 아이템 검증
    const validatedItems = items.map((item, index) => {
      if (!item.name || !item.category) {
        throw new Error(`아이템 ${index + 1}: 이름과 카테고리가 필요합니다.`);
      }

      if (!['main', 'side', 'soup', 'dessert'].includes(item.category)) {
        throw new Error(`아이템 ${index + 1}: 유효하지 않은 카테고리입니다.`);
      }

      return {
        id: item.id || `item_${Date.now()}_${index}`,
        name: item.name.trim(),
        category: item.category,
        description: item.description?.trim()
      };
    });

    res.json({
      success: true,
      data: {
        items: validatedItems,
        totalItems: validatedItems.length,
        categories: {
          main: validatedItems.filter(item => item.category === 'main').length,
          side: validatedItems.filter(item => item.category === 'side').length,
          soup: validatedItems.filter(item => item.category === 'soup').length,
          dessert: validatedItems.filter(item => item.category === 'dessert').length
        }
      }
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : '메뉴 검증 중 오류가 발생했습니다.'
    });
  }
});

// 메뉴 템플릿 가져오기
router.get('/templates', (req: Request, res: Response) => {
  const templates = [
    {
      id: 'standard',
      name: '표준 식판',
      layout: 'standard',
      description: '일반적인 학교 식판 레이아웃',
      sections: [
        { id: 'main', name: '메인 요리', category: 'main', maxItems: 1, position: { x: 0.1, y: 0.1, width: 0.4, height: 0.3 } },
        { id: 'side1', name: '반찬 1', category: 'side', maxItems: 2, position: { x: 0.55, y: 0.1, width: 0.35, height: 0.3 } },
        { id: 'side2', name: '반찬 2', category: 'side', maxItems: 2, position: { x: 0.1, y: 0.45, width: 0.35, height: 0.25 } },
        { id: 'soup', name: '국/탕', category: 'soup', maxItems: 1, position: { x: 0.55, y: 0.45, width: 0.35, height: 0.25 } },
        { id: 'dessert', name: '후식', category: 'dessert', maxItems: 1, position: { x: 0.1, y: 0.75, width: 0.8, height: 0.2 } }
      ]
    },
    {
      id: 'compact',
      name: '컴팩트 식판',
      layout: 'compact',
      description: '간단한 메뉴용 식판',
      sections: [
        { id: 'main', name: '메인', category: 'main', maxItems: 1, position: { x: 0.1, y: 0.1, width: 0.8, height: 0.4 } },
        { id: 'side', name: '반찬', category: 'side', maxItems: 3, position: { x: 0.1, y: 0.55, width: 0.8, height: 0.35 } }
      ]
    }
  ];

  res.json({
    success: true,
    data: templates
  });
});

// 메뉴 히스토리 (최근 10개)
router.get('/history', (req: Request, res: Response) => {
  // 실제 구현에서는 데이터베이스에서 가져옴
  const mockHistory = [
    {
      id: '1',
      date: new Date().toISOString(),
      items: ['김치찌개', '제육볶음', '김치', '미역국'],
      imageUrl: '/uploads/history_1.jpg'
    }
  ];

  res.json({
    success: true,
    data: mockHistory
  });
});

export { router as menuRoutes };
