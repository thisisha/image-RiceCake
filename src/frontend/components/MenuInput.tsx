import React, { useState } from 'react';
import { MenuItem } from '../../types';
import './MenuInput.css';

interface MenuInputProps {
  onSubmit: (items: MenuItem[]) => void;
  isLoading: boolean;
  onNewMenu: () => void;
}

export const MenuInput: React.FC<MenuInputProps> = ({ onSubmit, isLoading, onNewMenu }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([
    { id: '1', name: '', category: 'main' as const },
    { id: '2', name: '', category: 'side' as const },
    { id: '3', name: '', category: 'side' as const },
    { id: '4', name: '', category: 'soup' as const }
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState('standard');

  const handleItemChange = (id: string, field: keyof MenuItem, value: string) => {
    setMenuItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const addMenuItem = () => {
    const newItem: MenuItem = {
      id: Date.now().toString(),
      name: '',
      category: 'side'
    };
    setMenuItems(prev => [...prev, newItem]);
  };

  const removeMenuItem = (id: string) => {
    if (menuItems.length > 1) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = menuItems.filter(item => item.name.trim() !== '');
    
    if (validItems.length === 0) {
      alert('최소 하나의 메뉴 아이템을 입력해주세요.');
      return;
    }

    onSubmit(validItems);
  };

  const quickMenuTemplates = [
    {
      name: '김치찌개 세트',
      items: [
        { name: '김치찌개', category: 'main' as const },
        { name: '제육볶음', category: 'side' as const },
        { name: '김치', category: 'side' as const },
        { name: '미역국', category: 'soup' as const }
      ]
    },
    {
      name: '비빔밥 세트',
      items: [
        { name: '비빔밥', category: 'main' as const },
        { name: '된장국', category: 'soup' as const },
        { name: '김치', category: 'side' as const },
        { name: '시금치나물', category: 'side' as const }
      ]
    },
    {
      name: '돈까스 세트',
      items: [
        { name: '돈까스', category: 'main' as const },
        { name: '우동', category: 'side' as const },
        { name: '김치', category: 'side' as const },
        { name: '깍두기', category: 'side' as const }
      ]
    }
  ];

  const loadQuickMenu = (template: typeof quickMenuTemplates[0]) => {
    const items = template.items.map((item, index) => ({
      id: (index + 1).toString(),
      name: item.name,
      category: item.category
    }));
    setMenuItems(items);
  };

  return (
    <div className="menu-input">
      <div className="input-section">
        <h2>🍽️ 메뉴 입력</h2>
        <p className="input-description">
          오늘의 학식 메뉴를 입력하고 "그림으로 보기" 버튼을 클릭하세요!
        </p>

        <div className="quick-menu-section">
          <h3>🚀 빠른 메뉴 템플릿</h3>
          <div className="quick-menu-buttons">
            {quickMenuTemplates.map((template, index) => (
              <button
                key={index}
                className="quick-menu-button"
                onClick={() => loadQuickMenu(template)}
                type="button"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="menu-form">
          <div className="form-group">
            <label>식판 템플릿:</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="template-select"
            >
              <option value="standard">표준 식판</option>
              <option value="compact">컴팩트 식판</option>
            </select>
          </div>

          <div className="menu-items">
            <h3>📋 메뉴 아이템</h3>
            {menuItems.map((item, index) => (
              <div key={item.id} className="menu-item-row">
                <div className="item-number">{index + 1}</div>
                <input
                  type="text"
                  placeholder="음식 이름 (예: 김치찌개)"
                  value={item.name}
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                  className="item-name-input"
                  required
                />
                <select
                  value={item.category}
                  onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                  className="item-category-select"
                >
                  <option value="main">메인 요리</option>
                  <option value="side">반찬</option>
                  <option value="soup">국/탕</option>
                  <option value="dessert">후식</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeMenuItem(item.id)}
                  className="remove-item-button"
                  disabled={menuItems.length <= 1}
                >
                  ❌
                </button>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={addMenuItem}
              className="add-item-button"
            >
              ➕ 메뉴 추가
            </button>
            
            <button
              type="submit"
              className="generate-button"
              disabled={isLoading}
            >
              {isLoading ? '🔄 생성 중...' : '🎨 그림으로 보기'}
            </button>
          </div>
        </form>
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>💡 사용 팁</h3>
          <ul>
            <li>메인 요리는 1개만 입력하세요</li>
            <li>반찬은 여러 개 추가할 수 있습니다</li>
            <li>같은 메뉴 조합은 즉시 캐시에서 불러옵니다</li>
            <li>AI가 자동으로 식판에 배치합니다</li>
          </ul>
        </div>

        <div className="info-card">
          <h3>🎯 DBA 매칭</h3>
          <p>
            대표 프롬프트/레퍼런스로 메뉴를 매칭하여 
            일관된 품질의 이미지를 제공합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
