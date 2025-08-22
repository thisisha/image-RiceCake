// 메뉴 아이템 타입
export interface MenuItem {
  id: string;
  name: string;
  category: 'main' | 'side' | 'soup' | 'dessert';
  description?: string;
  imageUrl?: string;
}

// 메뉴 요청 타입
export interface MenuRequest {
  items: MenuItem[];
  date?: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner';
}

// 이미지 생성 응답 타입
export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  cached?: boolean;
  mock?: boolean;
  error?: string;
}

// DBA 매칭 결과 타입
export interface DBAMatchResult {
  matched: boolean;
  referencePrompt?: string;
  cachedImage?: string;
  confidence: number;
}

// 식판 템플릿 타입
export interface TrayTemplate {
  id: string;
  name: string;
  layout: 'standard' | 'compact' | 'premium';
  sections: TraySection[];
}

export interface TraySection {
  id: string;
  name: string;
  position: { x: number; y: number; width: number; height: number };
  maxItems: number;
  category: MenuItem['category'];
}
