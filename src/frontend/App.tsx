import React, { useState } from 'react';
import { MenuInput } from './components/MenuInput';
import { TrayPreview } from './components/TrayPreview';
import { MenuHistory } from './components/MenuHistory';
import { Header } from './components/Header';
import { MenuItem } from '../types';
import './App.css';

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'history'>('input');

  const handleMenuSubmit = async (items: MenuItem[]) => {
    setMenuItems(items);
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items, templateId: 'standard' }),
      });

      const result = await response.json();
      
      if (result.success) {
        setGeneratedImage(result.data.imageUrl);
        setActiveTab('preview');
      } else {
        alert('이미지 생성에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMenu = () => {
    setMenuItems([]);
    setGeneratedImage(null);
    setActiveTab('input');
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => setActiveTab('input')}
          >
            📝 메뉴 입력
          </button>
          <button 
            className={`tab-button ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={!generatedImage}
          >
            🍽️ 식판 미리보기
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 메뉴 히스토리
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'input' && (
            <MenuInput 
              onSubmit={handleMenuSubmit}
              isLoading={isLoading}
              onNewMenu={handleNewMenu}
            />
          )}
          
          {activeTab === 'preview' && generatedImage && (
            <TrayPreview 
              imageUrl={generatedImage}
              menuItems={menuItems}
              onNewMenu={handleNewMenu}
            />
          )}
          
          {activeTab === 'history' && (
            <MenuHistory />
          )}
        </div>
      </main>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>🍚 식판 이미지를 생성하고 있습니다...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
