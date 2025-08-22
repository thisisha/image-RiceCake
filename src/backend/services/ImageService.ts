import OpenAI from 'openai';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { MenuItem, ImageGenerationResponse } from '../../types';
import { createError } from '../middleware/errorHandler';
import { DBAService } from './DBAService';
import path from 'path';
import fs from 'fs/promises';
import { platform } from 'os';

export class ImageService {
  private openai: OpenAI | null;
  private uploadsDir: string;
  private dbaService: DBAService;
  private model: string;

  constructor() {
    // OpenAI API 키를 직접 설정 (환경변수 문제 해결)
    const apiKey = 'sk-proj-Z8HPSt_E9WpmFyCWhCaPvYtZ6j45fRVOsRzsAVYxtOPCqjuiSTXUGB5XiVDTnPLKy4FMCRi7tT3BlbkFJbjZMSbU9OUphRaE875tiK33uYyl9yW99F5Sgb7RKHYADlm5B7ROKEHnqeqXCLda4FcckAouJAA';
    
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      console.log('✅ OpenAI 클라이언트 초기화 완료 (직접 설정)');
    } else {
      this.openai = null;
      console.log('🔄 Mock 이미지 제공자 활성화 - OpenAI API 키 없음');
    }
    
    this.model = 'dall-e-3';
    this.uploadsDir = this.getCrossPlatformUploadsDir();
    this.dbaService = new DBAService();
    this.ensureUploadsDir();
  }

  private getCrossPlatformUploadsDir(): string {
    const isWindows = platform() === 'win32';
    const uploadsPath = isWindows ? 'uploads' : 'uploads';
    return path.join(process.cwd(), uploadsPath);
  }

  private async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
      console.log('✅ 업로드 디렉토리 접근 가능:', this.uploadsDir);
    } catch {
      console.log('📁 업로드 디렉토리 생성 중:', this.uploadsDir);
      await fs.mkdir(this.uploadsDir, { recursive: true });
      console.log('✅ 업로드 디렉토리 생성 완료');
    }
  }

  async generateTrayImage(items: MenuItem[], templateId: string = 'standard'): Promise<ImageGenerationResponse> {
    try {
      // OpenAI API 키가 없으면 Mock 이미지 생성
      if (!this.openai) {
        console.log('🎭 Mock 이미지 생성 시작:', items.map(item => item.name));
        return await this.generateMockTrayImage(items, templateId);
      }

      console.log('🍽️ 식판 이미지 생성 시작:', items.map(item => item.name));
      
      // 1. 개별 음식 이미지 생성 (OpenAI API 호출)
      const foodImages = await this.generateFoodImages(items);
      console.log(`✅ ${foodImages.length}개 음식 이미지 생성 완료`);
      
      // 2. 식판 템플릿에 배치
      const trayImage = await this.composeTrayImage(foodImages, templateId);
      console.log('🎨 식판 합성 완료');
      
      // 3. 파일 저장
      const filename = `tray_${uuidv4()}.png`;
      const filepath = path.join(this.uploadsDir, filename);
      
      await fs.writeFile(filepath, trayImage);
      console.log('💾 파일 저장 완료:', filename);
      
      // 4. DBA에 결과 저장
      await this.dbaService.saveResult(items, `/uploads/${filename}`);
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`,
        mock: false
      };

    } catch (error) {
      console.error('식판 이미지 생성 중 오류:', error);
      console.log('🔄 OpenAI API 호출 실패, Mock 이미지로 대체');
      
      // OpenAI API 호출 실패 시 Mock 이미지 생성
      try {
        return await this.generateMockTrayImage(items, templateId);
      } catch (mockError) {
        console.error('Mock 이미지 생성도 실패:', mockError);
        return {
          success: false,
          error: '이미지 생성에 실패했습니다. OpenAI API 오류: ' + (error instanceof Error ? error.message : 'Unknown error')
        };
      }
    }
  }

  async generateFoodPreview(itemName: string, category: string): Promise<ImageGenerationResponse> {
    try {
      // OpenAI API 키가 없으면 오류 반환
      if (!this.openai) {
        return {
          success: false,
          error: 'OpenAI API 키가 설정되지 않았습니다. .env 파일에 OPENAI_API_KEY를 설정해주세요.'
        };
      }

      const prompt = this.createFoodPrompt(itemName, category);
      
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      });

      if (!response.data || !response.data[0]?.url) {
        throw new Error('이미지 생성 응답이 없습니다.');
      }

      // 이미지 다운로드 및 저장
      const imageUrl = response.data[0].url;
      const imageBuffer = await this.downloadImage(imageUrl);
      
      const filename = `food_${uuidv4()}.png`;
      const filepath = path.join(this.uploadsDir, filename);
      
      await fs.writeFile(filepath, imageBuffer);
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`
      };

    } catch (error) {
      console.error('음식 미리보기 생성 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '미리보기 생성에 실패했습니다.'
      };
    }
  }

  private async generateImageWithTimeout(prompt: string, itemName: string, retries: number = 3): Promise<any> {
    const timeout = 30000; // 30초 타임아웃
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      console.log(`🌐 ${itemName} OpenAI API 요청 전송 중... (모델: ${this.model})`);
      const response = await this.openai!.images.generate({
        model: this.model,
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        style: "natural"
      }, { signal: controller.signal });
      
      clearTimeout(timeoutId);
      console.log(`✅ ${itemName} OpenAI API 응답 성공`);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.code === 429 && retries > 0) {
        console.log(`🔄 ${itemName} Rate limit, 재시도 중... (${retries}회 남음)`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
        return this.generateImageWithTimeout(prompt, itemName, retries - 1);
      }
      
      if (error.name === 'AbortError') {
        throw new Error(`${itemName} 이미지 생성 타임아웃 (${timeout/1000}초)`);
      }
      
      console.error(`❌ ${itemName} OpenAI API 오류:`, error);
      throw error;
    }
  }

  private async generateFoodImages(items: MenuItem[]): Promise<{ item: MenuItem; imageBuffer: Buffer }[]> {
    const foodImages: { item: MenuItem; imageBuffer: Buffer }[] = [];
    
    for (const item of items) {
      try {
        console.log(`🔄 ${item.name} 이미지 생성 중...`);
        
        // DBA에서 개별 음식 프롬프트 가져오기
        const prompt = this.getFoodPrompt(item.name, item.category);
        console.log(`📝 ${item.name} 프롬프트: ${prompt}`);
        
        if (!this.openai) {
          throw new Error('OpenAI API 키가 설정되지 않음');
        }

        console.log(`🚀 ${item.name} OpenAI API 호출 시작...`);
        const response = await this.generateImageWithTimeout(prompt, item.name);
        console.log(`📡 ${item.name} OpenAI API 응답 받음`);

        if (response.data && response.data[0]?.url) {
          console.log(`⬇️ ${item.name} 이미지 다운로드 시작: ${response.data[0].url}`);
          const imageBuffer = await this.downloadImage(response.data[0].url);
          foodImages.push({ item, imageBuffer });
          console.log(`✅ ${item.name} 이미지 생성 성공 (크기: ${imageBuffer.length} bytes)`);
        } else {
          throw new Error('OpenAI API 응답에 이미지 URL이 없습니다');
        }
      } catch (error) {
        console.error(`❌ ${item.name} OpenAI API 호출 실패:`, error);
        console.log(`🔄 ${item.name} 기본 이미지로 대체`);
        // 기본 이미지 사용
        const defaultImage = await this.createDefaultFoodImage(item.name);
        foodImages.push({ item, imageBuffer: defaultImage });
      }
    }
    
    return foodImages;
  }

  private getFoodPrompt(itemName: string, category: string): string {
    // DBA에서 개별 음식 프롬프트 가져오기
    const dbaPrompt = this.dbaService['foodPrompts']?.get(itemName);
    
    if (dbaPrompt) {
      return `A high-quality, appetizing photo of ${dbaPrompt}, professional food photography, natural lighting, Korean food style`;
    }
    
    // 기본 프롬프트
    const basePrompt = `A high-quality, appetizing photo of ${itemName}`;
    
    const categoryPrompts: { [key: string]: string } = {
      'main': 'as a main dish, beautifully presented on a plate',
      'side': 'as a side dish, colorful and well-arranged',
      'soup': 'as a soup, steaming and inviting',
      'dessert': 'as a dessert, sweet and appealing'
    };
    
    const categoryPrompt = categoryPrompts[category] || 'well-presented on a plate';
    
    return `${basePrompt}, ${categoryPrompt}, Korean food photography style, natural lighting, professional food photography`;
  }

  private createFoodPrompt(itemName: string, category: string): string {
    return this.getFoodPrompt(itemName, category);
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`이미지 다운로드 실패: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  private async createDefaultFoodImage(itemName: string): Promise<Buffer> {
    // 간단한 텍스트 기반 기본 이미지 생성
    const svg = `
      <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" font-family="Arial" font-size="24" text-anchor="middle" fill="#6c757d">
          ${itemName}
        </text>
      </svg>
    `;
    
    return Buffer.from(svg);
  }

  private async composeTrayImage(foodImages: { item: MenuItem; imageBuffer: Buffer }[], templateId: string): Promise<Buffer> {
    // 식판 템플릿 크기
    const trayWidth = 1200;
    const trayHeight = 800;
    
    // 식판 배경 생성 (흰색 배경)
    const trayBackground = await sharp({
      create: {
        width: trayWidth,
        height: trayHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    // 식판 테두리 추가
    const trayWithBorder = await sharp(trayBackground)
      .composite([{
        input: Buffer.from(`
          <svg width="${trayWidth}" height="${trayHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="${trayWidth}" height="${trayHeight}" 
                  fill="none" stroke="#e0e0e0" stroke-width="4"/>
            <rect x="20" y="20" width="${trayWidth-40}" height="${trayHeight-40}" 
                  fill="none" stroke="#f0f0f0" stroke-width="2"/>
          </svg>
        `),
        top: 0,
        left: 0
      }])
      .png()
      .toBuffer();

    // 음식 이미지를 식판에 배치
    const positions = this.getTrayPositions(templateId, foodImages.length);
    
    let composedImage = trayWithBorder;
    
    for (let i = 0; i < foodImages.length && i < positions.length; i++) {
      const { imageBuffer, item } = foodImages[i];
      const position = positions[i];
      
      console.log(`🎯 ${item.name}을 (${position.x}, ${position.y})에 배치`);
      
      // 이미지 리사이즈 및 둥근 모서리 처리
      const resizedImage = await sharp(imageBuffer)
        .resize(position.width, position.height, { fit: 'cover' })
        .png()
        .toBuffer();
      
      // 식판에 합성
      composedImage = await sharp(composedImage)
        .composite([{
          input: resizedImage,
          top: position.y,
          left: position.x
        }])
        .png()
        .toBuffer();
    }
    
    return composedImage;
  }

  private getTrayPositions(templateId: string, itemCount: number): Array<{ x: number; y: number; width: number; height: number }> {
    const positions: Array<{ x: number; y: number; width: number; height: number }> = [];
    
    if (templateId === 'standard') {
      // 표준 식판 레이아웃
      const basePositions = [
        { x: 100, y: 100, width: 300, height: 200 }, // 메인
        { x: 450, y: 100, width: 250, height: 200 }, // 반찬 1
        { x: 100, y: 350, width: 250, height: 150 }, // 반찬 2
        { x: 450, y: 350, width: 250, height: 150 }, // 국
        { x: 100, y: 550, width: 600, height: 120 }  // 후식
      ];
      
      positions.push(...basePositions.slice(0, Math.min(itemCount, basePositions.length)));
    } else {
      // 컴팩트 레이아웃
      const basePositions = [
        { x: 100, y: 100, width: 400, height: 300 }, // 메인
        { x: 100, y: 450, width: 600, height: 250 }  // 반찬
      ];
      
      positions.push(...basePositions.slice(0, Math.min(itemCount, basePositions.length)));
    }
    
    return positions;
  }

  async enhanceImage(imageUrl: string, enhancementType: string): Promise<ImageGenerationResponse> {
    try {
      // 이미지 경로에서 버퍼 읽기
      const imagePath = path.join(process.cwd(), imageUrl.replace('/uploads/', 'uploads/'));
      const imageBuffer = await fs.readFile(imagePath);
      
      let enhancedBuffer: Buffer;
      
      switch (enhancementType) {
        case 'sharpen':
          enhancedBuffer = await sharp(imageBuffer)
            .sharpen({ sigma: 1.5 })
            .png()
            .toBuffer();
          break;
        case 'brightness':
          enhancedBuffer = await sharp(imageBuffer)
            .modulate({ brightness: 1.2 })
            .png()
            .toBuffer();
          break;
        case 'contrast':
          enhancedBuffer = await sharp(imageBuffer)
            .linear(1.3, 0)
            .png()
            .toBuffer();
          break;
        default:
          enhancedBuffer = await sharp(imageBuffer)
            .sharpen()
            .modulate({ brightness: 1.1 })
            .linear(1.1, 0)
            .png()
            .toBuffer();
      }
      
      // 향상된 이미지 저장
      const filename = `enhanced_${uuidv4()}.png`;
      const filepath = path.join(this.uploadsDir, filename);
      
      await fs.writeFile(filepath, enhancedBuffer);
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`
      };

    } catch (error) {
      console.error('이미지 향상 중 오류:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '이미지 향상에 실패했습니다.'
      };
    }
  }

  async getImagePath(imageId: string): Promise<string | null> {
    try {
      const imagePath = path.join(this.uploadsDir, `${imageId}.png`);
      await fs.access(imagePath);
      return imagePath;
    } catch {
      return null;
    }
  }

  private async generateMockTrayImage(items: MenuItem[], templateId: string): Promise<ImageGenerationResponse> {
    try {
      console.log('🎭 Mock 식판 이미지 생성 중...');
      console.log('📁 업로드 디렉토리:', this.uploadsDir);
      
      // Mock 이미지 생성 (간단한 색상 블록)
      const width = 800;
      const height = 600;
      console.log('🎨 Mock 이미지 생성 시작...');
      
      const mockImage = await sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 } // 흰색 배경
        }
      })
      .composite([
        {
          input: {
            create: {
              width: 600,
              height: 400,
              channels: 3,
              background: { r: 240, g: 240, b: 240 } // 회색 식판
            }
          },
          top: 100,
          left: 100
        }
      ])
      .png()
      .toBuffer();

      console.log('🎨 Mock 이미지 생성 완료, 크기:', mockImage.length, 'bytes');

      // 파일 저장
      const filename = `mock_tray_${uuidv4()}.png`;
      const filepath = path.join(this.uploadsDir, filename);
      console.log('💾 파일 저장 경로:', filepath);
      
      await fs.writeFile(filepath, mockImage);
      console.log('💾 Mock 이미지 저장 완료:', filename);
      
      // DBA에 결과 저장
      console.log('💾 DBA에 결과 저장 중...');
      await this.dbaService.saveResult(items, `/uploads/${filename}`);
      console.log('💾 DBA 저장 완료');
      
      return {
        success: true,
        imageUrl: `/uploads/${filename}`,
        mock: true
      };

    } catch (error) {
      console.error('❌ Mock 이미지 생성 중 오류:', error);
      console.error('❌ 오류 스택:', error instanceof Error ? error.stack : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock 이미지 생성에 실패했습니다.'
      };
    }
  }
}
