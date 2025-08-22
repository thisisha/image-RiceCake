import { MenuItem, DBAMatchResult } from '../../types';
import { createClient } from 'redis';

export class DBAService {
  private redis: any;
  private foodPrompts!: Map<string, string>;
  private categoryTemplates!: Map<string, string>;
  private memoryCache: Map<string, string> = new Map();

  constructor() {
    this.initializeRedis();
    this.initializeFoodPrompts();
    this.initializeCategoryTemplates();
  }

  private async initializeRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await this.redis.connect();
      console.log('✅ Redis 연결 성공');
    } catch (error) {
      console.warn('⚠️ Redis 연결 실패, 메모리 캐시 사용:', error);
      this.redis = null;
      console.log('💾 메모리 캐시로 계속 진행');
    }
  }

  private initializeFoodPrompts() {
    // 개별 음식별 상세 프롬프트
    this.foodPrompts = new Map([
      // 메인 요리
      ['김치찌개', 'kimchi jjigae (spicy kimchi stew) with rich red broth and tender vegetables'],
      ['제육볶음', 'jeyuk bokkeum (spicy pork stir-fry) with caramelized onions and carrots'],
      ['비빔밥', 'bibimbap (mixed rice bowl) with colorful vegetables and gochujang sauce'],
      ['돈까스', 'tonkatsu (crispy breaded pork cutlet) with golden brown coating'],
      ['카레라이스', 'Japanese curry rice with rich brown sauce and tender meat'],
      ['삼겹살', 'samgyeopsal (grilled pork belly) with charred edges and juicy center'],
      ['불고기', 'bulgogi (marinated beef) with sweet soy sauce and sesame seeds'],
      ['순두부찌개', 'sundubu jjigae (soft tofu stew) with spicy red broth and soft tofu'],
      ['갈비탕', 'galbitang (beef rib soup) with clear broth and tender ribs'],
      ['닭볶음탕', 'dakbokkeumtang (spicy chicken stew) with potatoes and carrots'],
      ['치킨가라아게', 'chicken karaage (Japanese fried chicken) with crispy coating'],
      ['돼지갈비', 'dwaeji galbi (grilled pork ribs) with sweet marinade'],
      
      // 국/탕
      ['미역국', 'miyeokguk (seaweed soup) with clear broth and tender seaweed'],
      ['된장국', 'doenjang soup (fermented soybean soup) with vegetables and tofu'],
      ['미소국', 'miso soup (Japanese fermented soybean soup) with tofu and seaweed'],
      ['우동', 'udon noodles (thick wheat noodles) in savory broth'],
      
      // 반찬
      ['김치', 'kimchi (fermented napa cabbage) with spicy red seasoning'],
      ['깍두기', 'kkakdugi (cubed radish kimchi) with crunchy texture'],
      ['단무지', 'danmuji (pickled radish) with sweet and tangy flavor'],
      ['시금치나물', 'spinach namul (seasoned spinach) with sesame oil and garlic']
    ]);
  }

  private initializeCategoryTemplates() {
    // 카테고리별 식판 배치 템플릿
    this.categoryTemplates = new Map([
      ['korean_traditional', 'A traditional Korean school cafeteria meal tray with {main_dish}, {side_dish}, kimchi, and {soup} arranged neatly on a white plastic tray, Korean food photography style'],
      ['japanese_fusion', 'A Japanese-Korean fusion meal tray with {main_dish}, {noodle_dish}, kimchi, and {pickle} on a white school cafeteria tray, fusion cuisine style'],
      ['bbq_style', 'A Korean BBQ style meal tray with {grilled_meat}, {soup}, kimchi, and {side_dish} arranged on a white cafeteria tray, grilled food photography'],
      ['stew_focused', 'A hearty Korean stew meal with {main_stew}, {side_dish}, kimchi, and {pickle} on a white school tray, comfort food style']
    ]);
  }

  async findMatch(items: MenuItem[]): Promise<DBAMatchResult> {
    try {
      // 메뉴 조합을 정렬하여 일관된 키 생성
      const sortedItems = items
        .map(item => item.name)
        .sort()
        .join('+');
      
      // Redis에서 캐시 확인
      if (this.redis) {
        const cachedImage = await this.redis.get(`menu:${sortedItems}`);
        if (cachedImage) {
          return {
            matched: true,
            cachedImage,
            confidence: 1.0
          };
        }
      }

      // 개별 음식 프롬프트로 동적 프롬프트 생성
      const generatedPrompt = this.generateDynamicPrompt(items);
      
      return {
        matched: true,
        referencePrompt: generatedPrompt,
        confidence: 0.8
      };

    } catch (error) {
      console.error('DBA 매칭 중 오류:', error);
      return {
        matched: false,
        confidence: 0.0
      };
    }
  }

  private generateDynamicPrompt(items: MenuItem[]): string {
    // 카테고리별로 음식 분류
    const mainDish = items.find(item => item.category === 'main');
    const sideDish = items.find(item => item.category === 'side');
    const soup = items.find(item => item.category === 'soup');
    const dessert = items.find(item => item.category === 'dessert');

    // 적절한 템플릿 선택
    let template = this.categoryTemplates.get('korean_traditional') || '';
    
    if (mainDish?.name.includes('돈까스') || mainDish?.name.includes('카레')) {
      template = this.categoryTemplates.get('japanese_fusion') || '';
    } else if (mainDish?.name.includes('삼겹살') || mainDish?.name.includes('갈비')) {
      template = this.categoryTemplates.get('bbq_style') || '';
    } else if (mainDish?.name.includes('찌개') || mainDish?.name.includes('탕')) {
      template = this.categoryTemplates.get('stew_focused') || '';
    }

    // 개별 음식 프롬프트로 치환
    let prompt = template;
    
    if (mainDish) {
      const mainPrompt = this.foodPrompts.get(mainDish.name) || mainDish.name;
      prompt = prompt.replace('{main_dish}', mainPrompt);
    }
    
    if (sideDish) {
      const sidePrompt = this.foodPrompts.get(sideDish.name) || sideDish.name;
      prompt = prompt.replace('{side_dish}', sidePrompt);
    }
    
    if (soup) {
      const soupPrompt = this.foodPrompts.get(soup.name) || soup.name;
      prompt = prompt.replace('{soup}', soupPrompt);
    }

    // 추가 음식들도 포함
    const additionalItems = items
      .filter(item => item !== mainDish && item !== sideDish && item !== soup)
      .map(item => this.foodPrompts.get(item.name) || item.name)
      .join(', ');

    if (additionalItems) {
      prompt += `, along with ${additionalItems}`;
    }

    return prompt;
  }

  async saveResult(items: MenuItem[], imageUrl: string): Promise<void> {
    try {
      const sortedItems = items
        .map(item => item.name)
        .sort()
        .join('+');
      
      const key = `menu:${sortedItems}`;
      console.log('💾 DBA 저장 시작, 키:', key);
      
      // Redis에 저장 (24시간 TTL)
      if (this.redis) {
        await this.redis.setEx(key, 86400, imageUrl);
        console.log('💾 Redis에 결과 저장 완료:', key);
      } else {
        console.log('💾 Redis 없음, 메모리 캐시에 저장');
        // 메모리 캐시도 추가
        this.memoryCache = this.memoryCache || new Map();
        this.memoryCache.set(key, imageUrl);
      }

    } catch (error) {
      console.error('❌ 결과 저장 중 오류:', error);
      console.error('❌ 오류 스택:', error instanceof Error ? error.stack : 'Unknown error');
      // 오류가 발생해도 계속 진행
      console.log('💾 오류 무시하고 계속 진행');
    }
  }

  async getStats(): Promise<{ totalCached: number; totalFoodItems: number }> {
    try {
      let totalCached = 0;
      
      if (this.redis) {
        const keys = await this.redis.keys('menu:*');
        totalCached = keys.length;
      }

      return {
        totalCached,
        totalFoodItems: this.foodPrompts.size
      };
    } catch (error) {
      console.error('통계 조회 중 오류:', error);
      return { totalCached: 0, totalFoodItems: this.foodPrompts.size };
    }
  }

  // 새로운 음식 프롬프트 추가 메서드
  addFoodPrompt(foodName: string, prompt: string): void {
    this.foodPrompts.set(foodName, prompt);
  }

  // 새로운 카테고리 템플릿 추가 메서드
  addCategoryTemplate(category: string, template: string): void {
    this.categoryTemplates.set(category, template);
  }
}
