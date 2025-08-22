import React, { useState } from 'react';
import { MenuItem } from '../../types';
import './TrayPreview.css';

interface TrayPreviewProps {
  imageUrl: string;
  menuItems: MenuItem[];
  onNewMenu: () => void;
}

export const TrayPreview: React.FC<TrayPreviewProps> = ({ imageUrl, menuItems, onNewMenu }) => {
  const [enhancementType, setEnhancementType] = useState('general');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ricecake_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드에 실패했습니다.');
    }
  };

  const handleEnhance = async () => {
    setIsEnhancing(true);
    
    try {
      const response = await fetch('/api/image/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          imageUrl, 
          enhancementType 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setEnhancedImageUrl(result.data.enhancedUrl);
      } else {
        alert('이미지 개선에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('이미지 개선 오류:', error);
      alert('이미지 개선 중 오류가 발생했습니다.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'main': '🍖',
      'side': '🥗',
      'soup': '🥣',
      'dessert': '🍰'
    };
    return icons[category] || '🍽️';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: string } = {
      'main': '메인 요리',
      'side': '반찬',
      'soup': '국/탕',
      'dessert': '후식'
    };
    return names[category] || '음식';
  };

  return (
    <div className="tray-preview">
      <div className="preview-header">
        <h2>🍽️ 식판 미리보기</h2>
        <p className="preview-description">
          AI가 생성한 학교 식판 스타일 이미지입니다.
        </p>
      </div>

      <div className="preview-content">
        <div className="image-section">
          <div className="image-container">
            <img 
              src={enhancedImageUrl || imageUrl} 
              alt="학식 식판" 
              className="tray-image"
            />
            
            {enhancedImageUrl && (
              <div className="enhancement-badge">
                ✨ 개선됨
              </div>
            )}
          </div>

          <div className="image-actions">
            <button 
              onClick={handleDownload}
              className="download-button"
            >
              💾 다운로드
            </button>
            
            <div className="enhancement-controls">
              <select
                value={enhancementType}
                onChange={(e) => setEnhancementType(e.target.value)}
                className="enhancement-select"
              >
                <option value="general">일반 개선</option>
                <option value="sharpen">선명도 향상</option>
                <option value="brightness">밝기 조정</option>
                <option value="contrast">대비 조정</option>
              </select>
              
              <button
                onClick={handleEnhance}
                disabled={isEnhancing}
                className="enhance-button"
              >
                {isEnhancing ? '🔄 개선 중...' : '✨ 이미지 개선'}
              </button>
            </div>
          </div>
        </div>

        <div className="menu-summary">
          <h3>📋 메뉴 구성</h3>
          <div className="menu-items-grid">
            {menuItems.map((item, index) => (
              <div key={item.id} className="menu-item-card">
                <div className="item-icon">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-category">
                    {getCategoryName(item.category)}
                  </div>
                </div>
                <div className="item-number">#{index + 1}</div>
              </div>
            ))}
          </div>

          <div className="menu-stats">
            <div className="stat-item">
              <span className="stat-label">총 메뉴:</span>
              <span className="stat-value">{menuItems.length}개</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">메인 요리:</span>
              <span className="stat-value">
                {menuItems.filter(item => item.category === 'main').length}개
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">반찬:</span>
              <span className="stat-value">
                {menuItems.filter(item => item.category === 'side').length}개
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="preview-footer">
        <button 
          onClick={onNewMenu}
          className="new-menu-button"
        >
          🆕 새 메뉴 만들기
        </button>
        
        <div className="share-section">
          <h4>📤 공유하기</h4>
          <div className="share-buttons">
            <button className="share-button kakao">
              카카오톡
            </button>
            <button className="share-button instagram">
              인스타그램
            </button>
            <button className="share-button twitter">
              트위터
            </button>
          </div>
        </div>
      </div>

      <div className="info-cards">
        <div className="info-card">
          <h4>🎨 AI 생성</h4>
          <p>
            OpenAI DALL-E 3를 사용하여 각 음식을 개별적으로 생성하고, 
            식판 템플릿에 자동으로 배치했습니다.
          </p>
        </div>
        
        <div className="info-card">
          <h4>💾 스마트 캐싱</h4>
          <p>
            같은 메뉴 조합은 DBA에서 즉시 찾아 제공하여 
            빠른 응답 속도를 보장합니다.
          </p>
        </div>
        
        <div className="info-card">
          <h4>🔧 이미지 개선</h4>
          <p>
            선명도, 밝기, 대비 등을 조정하여 
            더욱 매력적인 이미지로 개선할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};
