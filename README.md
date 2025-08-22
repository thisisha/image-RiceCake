# 🍚 RiceCake v2.0 - 학식 메뉴 이미지 변환 서비스

## 📋 한 줄 요약
학식 메뉴 텍스트를 **학교 식판 스타일 이미지**로 즉시 바꿔주는 서비스

## 🔄 작동 방식 (3-Step)
1. **사용자 입력**: 메뉴 텍스트 입력
2. **DBA 매칭**: 대표 프롬프트/레퍼런스로 매칭 & 캐시 확인
3. **이미지 생성**: 생성형 AI로 이미지 생성 후 **식판 템플릿**에 자동 배치

## 💡 필요성 & 효과

### 👨‍🎓 학생
- 메뉴를 보고 **바로 판단** (직관성·접근성↑)
- 시각적 이해도 향상

### 🏫 학교
- **DP/촬영 인력 0**
- 메뉴 변경도 **즉시 반영**
- **음식 낭비 감소**

### 🚀 확장성
- 교내 전 식당 → 병원/군부대 급식까지 확장 가능

## 🎯 사용 경험
1. 메뉴 입력
2. "그림으로 보기" 클릭
3. 식판 이미지 바로 출력
4. 같은 조합은 **즉시 캐시 응답**

## 🛠️ 기술 스택
- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express
- **AI**: OpenAI DALL-E API
- **Database**: Redis (캐싱)
- **Image Processing**: Sharp.js

## 🚀 시작하기

### 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 배포

#### Vercel 배포 (권장)

1. **GitHub에 프로젝트 푸시**
```bash
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

2. **Vercel 연결**
   - [Vercel](https://vercel.com)에 로그인
   - "New Project" 클릭
   - GitHub 저장소 연결
   - 환경변수 설정 (OpenAI API 키 등)
   - "Deploy" 클릭

#### 환경변수 설정

Vercel 대시보드에서 다음 환경변수를 설정하세요:

```env
OPENAI_API_KEY=your_openai_api_key_here
REDIS_URL=your_redis_url_here
NODE_ENV=production
```

## 📁 프로젝트 구조
```
src/
├── frontend/       # React 프론트엔드
│   ├── components/ # React 컴포넌트
│   └── App.tsx    # 메인 앱 컴포넌트
├── backend/        # Node.js 백엔드
│   ├── services/   # AI 서비스, 캐싱 등
│   ├── routes/     # API 라우트
│   └── index.ts    # 서버 진입점
└── types/          # TypeScript 타입 정의
```

## 🌐 라이브 데모

프로젝트가 배포되면 여기에 링크가 추가됩니다.
