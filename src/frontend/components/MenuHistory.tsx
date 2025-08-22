import React, { useState, useEffect } from 'react';
import './MenuHistory.css';

interface HistoryItem {
  id: string;
  date: string;
  items: string[];
  imageUrl: string;
}

export const MenuHistory: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/menu/history');
      const result = await response.json();
      
      if (result.success) {
        setHistory(result.data);
      } else {
        console.error('히스토리 조회 실패:', result.error);
      }
    } catch (error) {
      console.error('히스토리 조회 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleItemClick = (item: HistoryItem) => {
    setSelectedItem(selectedItem?.id === item.id ? null : item);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 메뉴를 삭제하시겠습니까?')) {
      return;
    }

    try {
      // 실제 구현에서는 삭제 API 호출
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleRecreate = (item: HistoryItem) => {
    // 새 메뉴 생성 페이지로 이동 (실제 구현에서는 상태 관리)
    alert('새 메뉴 생성 페이지로 이동합니다.');
  };

  if (isLoading) {
    return (
      <div className="menu-history loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>히스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-history">
      <div className="history-header">
        <h2>📚 메뉴 히스토리</h2>
        <p className="history-description">
          이전에 생성한 학식 메뉴들을 확인하고 재사용할 수 있습니다.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">📭</div>
          <h3>아직 생성된 메뉴가 없습니다</h3>
          <p>첫 번째 학식 메뉴를 만들어보세요!</p>
        </div>
      ) : (
        <div className="history-content">
          <div className="history-list">
            <h3>📅 최근 메뉴 ({history.length}개)</h3>
            
            {history.map((item) => (
              <div 
                key={item.id} 
                className={`history-item ${selectedItem?.id === item.id ? 'expanded' : ''}`}
                onClick={() => handleItemClick(item)}
              >
                <div className="item-header">
                  <div className="item-info">
                    <div className="item-date">{formatDate(item.date)}</div>
                    <div className="item-count">{item.items.length}개 메뉴</div>
                  </div>
                  
                  <div className="item-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRecreate(item);
                      }}
                      className="recreate-button"
                    >
                      🔄 재생성
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="delete-button"
                    >
                      🗑️ 삭제
                    </button>
                  </div>
                </div>

                <div className="item-preview">
                  <div className="menu-items-preview">
                    {item.items.slice(0, 3).map((menuItem, index) => (
                      <span key={index} className="menu-item-tag">
                        {menuItem}
                      </span>
                    ))}
                    {item.items.length > 3 && (
                      <span className="menu-item-more">
                        +{item.items.length - 3}개 더
                      </span>
                    )}
                  </div>
                  
                  <div className="item-thumbnail">
                    <img 
                      src={item.imageUrl} 
                      alt="메뉴 미리보기" 
                      className="thumbnail-image"
                    />
                  </div>
                </div>

                {selectedItem?.id === item.id && (
                  <div className="item-details">
                    <div className="full-menu-list">
                      <h4>📋 전체 메뉴</h4>
                      <div className="menu-grid">
                        {item.items.map((menuItem, index) => (
                          <div key={index} className="menu-item-detail">
                            <span className="item-number">#{index + 1}</span>
                            <span className="item-name">{menuItem}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="detail-actions">
                      <button 
                        onClick={() => handleRecreate(item)}
                        className="detail-recreate-button"
                      >
                        🎨 이 메뉴로 새로 만들기
                      </button>
                      
                      <button 
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = item.imageUrl;
                          a.download = `ricecake_${item.id}.png`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }}
                        className="detail-download-button"
                      >
                        💾 이미지 다운로드
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="history-sidebar">
            <div className="stats-card">
              <h3>📊 통계</h3>
              <div className="stat-item">
                <span className="stat-label">총 메뉴:</span>
                <span className="stat-value">{history.length}개</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">이번 주:</span>
                <span className="stat-value">
                  {history.filter(item => {
                    const itemDate = new Date(item.date);
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return itemDate > weekAgo;
                  }).length}개
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">이번 달:</span>
                <span className="stat-value">
                  {history.filter(item => {
                    const itemDate = new Date(item.date);
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return itemDate > monthAgo;
                  }).length}개
                </span>
              </div>
            </div>

            <div className="tips-card">
              <h3>💡 팁</h3>
              <ul>
                <li>자주 사용하는 메뉴는 재생성하여 시간을 절약하세요</li>
                <li>히스토리에서 영감을 얻어 새로운 메뉴를 만들어보세요</li>
                <li>좋아하는 메뉴는 이미지로 저장해두세요</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
