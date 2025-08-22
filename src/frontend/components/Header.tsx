import React from 'react';
import './Header.css';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">🍚</span>
          <h1 className="logo-text">RiceCake v2.0</h1>
        </div>
        
        <div className="header-subtitle">
          <p>학식 메뉴를 학교 식판 스타일 이미지로 즉시 변환</p>
        </div>
        
        <div className="header-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>즉시 생성</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <span>DBA 매칭</span>
          </div>
          <div className="feature">
            <span className="feature-icon">💾</span>
            <span>스마트 캐싱</span>
          </div>
        </div>
      </div>
    </header>
  );
};
