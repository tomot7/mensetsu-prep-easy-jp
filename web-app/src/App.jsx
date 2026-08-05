import { useState, useMemo, useEffect, useRef } from 'react';
import questionsData from './questions.json';
import './App.css';

function App() {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(questionsData[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [printQueue, setPrintQueue] = useState([]); // 新規追加：印刷キュー
  const [isPrintMode, setIsPrintMode] = useState(false); // 印刷モードのON/OFF
  
  const categories = ['All', ...new Set(questionsData.map(q => q.category))];
  
  const filteredQuestions = useMemo(() => {
    if (filter === 'All') return questionsData;
    return questionsData.filter(q => q.category === filter);
  }, [filter]);

  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const exists = filteredQuestions.find(q => q.id === selectedId);
      if (!exists) {
        setSelectedId(filteredQuestions[0].id);
      }
    }
  }, [filter, filteredQuestions, selectedId]);

  // PC表示時：上下の方向キーで前後の設問に切り替え
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = filteredQuestions.findIndex(q => q.id === selectedId);
        if (idx < filteredQuestions.length - 1) {
          setSelectedId(filteredQuestions[idx + 1].id);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = filteredQuestions.findIndex(q => q.id === selectedId);
        if (idx > 0) {
          setSelectedId(filteredQuestions[idx - 1].id);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredQuestions, selectedId]);

  // サイドバーの選択中の項目を自動スクロールで表示
  useEffect(() => {
    const activeItem = document.querySelector('.question-list li.active');
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedId]);

  const selectedQuestion = useMemo(() => {
    return questionsData.find(q => q.id === selectedId) || questionsData[0];
  }, [selectedId]);

  // 印刷対象のリスト（選択されていればそれら、されていなければ現在開いている1問）
  const questionsToPrint = useMemo(() => {
    if (printQueue.length > 0) {
      // 元のデータの順序でソートして出力する
      return questionsData.filter(q => printQueue.includes(q.id));
    }
    return [selectedQuestion];
  }, [printQueue, selectedQuestion]);

  const handleSelectQuestion = (id) => {
    setSelectedId(id);
    setIsSidebarOpen(false);
  };

  const togglePrintQueue = (id, e) => {
    e.stopPropagation(); // 項目選択を防ぐ
    setPrintQueue(prev => {
      if (prev.includes(id)) {
        return prev.filter(qId => qId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleNext = () => {
    const currentIndex = filteredQuestions.findIndex(q => q.id === selectedId);
    if (currentIndex < filteredQuestions.length - 1) {
      setSelectedId(filteredQuestions[currentIndex + 1].id);
    }
  };

  const handlePrev = () => {
    const currentIndex = filteredQuestions.findIndex(q => q.id === selectedId);
    if (currentIndex > 0) {
      setSelectedId(filteredQuestions[currentIndex - 1].id);
    }
  };

  // スマートフォン用スワイプ操作（カード回転アニメーション付き）
  const touchRef = useRef({ startX: 0, startY: 0, isSwiping: null });
  const [swipeX, setSwipeX] = useState(0);
  const [isSwipeTransitioning, setIsSwipeTransitioning] = useState(false);

  const handleTouchStart = (e) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
    touchRef.current.isSwiping = null;
    setIsSwipeTransitioning(false);
  };

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    // 最初の動きで水平スワイプか縦スクロールかを判定
    if (touchRef.current.isSwiping === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchRef.current.isSwiping = Math.abs(dx) > Math.abs(dy);
      }
    }
    if (touchRef.current.isSwiping) {
      setSwipeX(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!touchRef.current.isSwiping) {
      setSwipeX(0);
      return;
    }
    if (Math.abs(swipeX) > 80) {
      // 閾値を超えた → カードを回転させながら画面外へ飛ばす
      const exitX = swipeX < 0 ? -window.innerWidth * 1.5 : window.innerWidth * 1.5;
      setIsSwipeTransitioning(true);
      setSwipeX(exitX);
      setTimeout(() => {
        if (exitX < 0) { handleNext(); } else { handlePrev(); }
        setSwipeX(0);
        setIsSwipeTransitioning(false);
      }, 280);
    } else {
      // 閾値未満 → バネのように元の位置へ戻す
      setIsSwipeTransitioning(true);
      setSwipeX(0);
      setTimeout(() => setIsSwipeTransitioning(false), 280);
    }
  };

  // スワイプ中のカード変形スタイル
  const cardSwipeStyle = swipeX !== 0 || isSwipeTransitioning ? {
    transform: `translateX(${swipeX}px) rotate(${swipeX * 0.06}deg)`,
    transition: isSwipeTransitioning ? 'transform 0.28s ease-out, opacity 0.28s ease-out' : 'none',
    opacity: Math.max(0, 1 - Math.abs(swipeX) / (window.innerWidth || 400)),
    transformOrigin: 'center 80%',
  } : {};

  return (
    <div className="layout">
      {/* スマホ用ヘッダー */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setIsSidebarOpen(true)}>
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h1>面接対策100題</h1>
      </div>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>

      {/* サイドバー */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>目次</h2>
            <button 
              className={`toggle-print-btn ${isPrintMode ? 'active' : ''}`}
              onClick={() => {
                setIsPrintMode(!isPrintMode);
                if (isPrintMode) setPrintQueue([]); // 閉じる時にクリア
              }}
              title="印刷モード切替"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
            </button>
          </div>
          <button className="close-btn" onClick={() => setIsSidebarOpen(false)}>✕</button>
        </div>
        
        <div className="filter-container">
          <select value={filter} onChange={e => setFilter(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'すべてのカテゴリ' : c}</option>)}
          </select>
          
          {/* 印刷モード時のみアクション領域を表示 */}
          {isPrintMode && (
            <div className="print-queue-actions">
              <span className="queue-count">
                {printQueue.length > 0 ? `📝 ${printQueue.length}問を選択中` : '📝 問題を選択してください'}
              </span>
              <button 
                className="queue-print-btn" 
                onClick={() => window.print()}
                title={printQueue.length === 0 ? "現在表示中の1問を印刷します" : "選択した問題を印刷します"}
              >
                印刷する
              </button>
            </div>
          )}
        </div>
        
        <ul className="question-list">
          {filteredQuestions.map(q => (
            <li 
              key={q.id} 
              className={selectedId === q.id ? 'active' : ''}
              onClick={() => handleSelectQuestion(q.id)}
              style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}
            >
              {isPrintMode && (
                <input 
                  type="checkbox" 
                  className="print-checkbox"
                  checked={printQueue.includes(q.id)}
                  onChange={(e) => togglePrintQueue(q.id, e)}
                  onClick={(e) => e.stopPropagation()}
                  title="印刷リストに追加/削除"
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="q-num">Q{q.id}.</span> 
                <span dangerouslySetInnerHTML={{ __html: q.q }} />
              </div>
            </li>
          ))}
        </ul>
      </aside>

      {/* メインコンテンツ */}
      <main className="main-content" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="card-wrapper" key={selectedQuestion.id} style={cardSwipeStyle}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div className="card-category" style={{ marginBottom: 0 }}>{selectedQuestion.category}</div>
          </div>
          
          <h2 className="main-q">
            <span className="q-label">Q{selectedQuestion.id}.</span> 
            <span dangerouslySetInnerHTML={{ __html: selectedQuestion.q }} />
          </h2>
          
          <div className="content-blocks">
            <div className="card-point">
              <strong>💡 ポイント:</strong>
              <p dangerouslySetInnerHTML={{ __html: selectedQuestion.p }} />
            </div>
            
            <div className="card-example">
              <strong>💬 回答例:</strong>
              <p dangerouslySetInnerHTML={{ __html: selectedQuestion.e }} />
            </div>
          </div>

          <div className="nav-buttons">
            <button 
              className="nav-btn prev-btn" 
              onClick={handlePrev}
              disabled={filteredQuestions.findIndex(q => q.id === selectedId) === 0}
            >
              ← 前へ
            </button>
            <button 
              className="nav-btn next-btn" 
              onClick={handleNext}
              disabled={filteredQuestions.findIndex(q => q.id === selectedId) === filteredQuestions.length - 1}
            >
              次へ →
            </button>
          </div>
        </div>
        
        {/* 印刷専用レイヤー（通常は非表示、印刷時のみ表示される） */}
        <div className="print-only-container">
          <div className="print-header">面接対策 選択リスト</div>
          {questionsToPrint.map(q => (
            <div className="print-card" key={q.id}>
              <div className="print-category">{q.category}</div>
              <h2 className="print-q">
                <span className="q-label">Q{q.id}.</span> 
                <span dangerouslySetInnerHTML={{ __html: q.q }} />
              </h2>
              <div className="print-point">
                <strong>💡 ポイント:</strong>
                <p dangerouslySetInnerHTML={{ __html: q.p }} />
              </div>
              <div className="print-example">
                <strong>💬 回答例:</strong>
                <p dangerouslySetInnerHTML={{ __html: q.e }} />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
