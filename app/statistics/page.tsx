'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface InsightCard {
  title: string;
  value: string;
  change: string;
  reason?: string;
  location?: string;
  timeRange?: string;
  impact?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count?: number;
}

interface Filter {
  id: string;
  label: string;
  type: 'period' | 'region' | 'type' | 'severity' | 'source' | 'detection';
  value: string;
  options?: string[];
}

interface TrendEvent {
  id: string;
  type: string;
  change: string;
  icon: string;
  color: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('overview');
  const [insight, setInsight] = useState<InsightCard | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [aiRecommendedFilters, setAiRecommendedFilters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 통계 카테고리
  const categories: Category[] = [
    { id: 'overview', name: '전체 사건 통계', icon: 'mdi:chart-box' },
    { id: 'type', name: '유형별 통계', icon: 'mdi:format-list-bulleted' },
    { id: 'region', name: '지역별 통계', icon: 'mdi:map' },
    { id: 'time', name: '시간대별 통계', icon: 'mdi:clock-outline' },
    { id: 'sensor', name: '센서/AI 감지 통계', icon: 'mdi:radar' },
    { id: 'response', name: '응답시간/처리시간', icon: 'mdi:timer' },
    { id: 'monthly', name: 'Monthly 종합 리포트', icon: 'mdi:file-document' },
    { id: 'heatmap', name: '고위험 구역 분석', icon: 'mdi:fire' },
  ];

  // 최근 증가 이벤트
  const trendEvents: TrendEvent[] = [
    { id: '1', type: '화재', change: '18% 증가', icon: 'mdi:fire', color: 'text-red-400' },
    { id: '2', type: '112 신고', change: '11% 증가', icon: 'mdi:phone', color: 'text-blue-400' },
    { id: '3', type: '배회 감지', change: '25% 증가', icon: 'mdi:eye', color: 'text-yellow-400' },
  ];

  // 가상 데이터
  const weeklyData = [
    { day: '월', count: 12 },
    { day: '화', count: 18 },
    { day: '수', count: 15 },
    { day: '목', count: 22 },
    { day: '금', count: 19 },
    { day: '토', count: 14 },
    { day: '일', count: 10 },
  ];

  const categoryData = [
    { category: '화재', count: 35, color: 'bg-red-500' },
    { category: '미아', count: 28, color: 'bg-yellow-500' },
    { category: '약자', count: 22, color: 'bg-blue-500' },
    { category: '배회', count: 15, color: 'bg-purple-500' },
  ];

  const maxCount = Math.max(...weeklyData.map(d => d.count));
  const totalCount = weeklyData.reduce((sum, d) => sum + d.count, 0);

  useEffect(() => {
    const query = searchParams.get('query');
    if (query) {
      setInput(query);
      handleQuery(query);
    }
  }, [searchParams]);

  const handleQuery = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    // AI 인사이트 생성
    if (lowerQuery.includes('화재') && (lowerQuery.includes('늘') || lowerQuery.includes('증가'))) {
      setInsight({
        title: '화재 발생 추이',
        value: '지난달 대비 화재 32% 증가',
        change: '+32%',
        reason: '강풍일 18건 중 12건 화재 발생',
        location: '동안구·비산동',
        timeRange: '20~22시 집중',
        impact: '관제 시간 증가: +11%',
      });
      setSelectedCategory('type');
      setAiRecommendedFilters(['강풍일 필터 추천', '화재 관련 통계 확인 추천']);
    } else if (lowerQuery.includes('112') && lowerQuery.includes('위험')) {
      setInsight({
        title: '112 신고 위험도 분석',
        value: '112 신고 중 High 184건, 전체의 12.4%',
        change: '12.4%',
        reason: '주요 원인: 배회 행동 감지 증가',
        location: '동안구·만안구',
        timeRange: '야간 시간대 집중',
        impact: '긴급 대응 필요',
      });
      setSelectedCategory('type');
      setFilters([
        { id: 'source', label: '출처', type: 'source', value: '112' },
        { id: 'severity', label: '우선순위', type: 'severity', value: 'High' },
      ]);
    } else {
      // 기본 인사이트
      setInsight({
        title: '전체 사건 통계',
        value: `이번주 총 ${totalCount}건 발생`,
        change: '일평균 ' + Math.round(totalCount / 7) + '건',
        reason: '주요 발생 유형: 화재, 미아, 약자',
        location: '전 지역',
        timeRange: '주간 집중',
        impact: '안정적 관리 중',
      });
    }
    
    setIsLoading(false);
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        setIsLoading(true);
        setTimeout(() => {
          handleQuery(input.trim());
        }, 500);
      }
    }
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // 카테고리별 차트 업데이트
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setFilters(prev => prev.map(f => f.id === filterId ? { ...f, value } : f));
  };

  return (
    <div className="flex flex-col h-screen bg-[#0f0f0f] overflow-hidden">
      {/* 상단 헤더 */}
      <header className="flex h-16 items-center justify-between bg-[#1a1a1a] border-b border-[#2a2a2a] px-6" style={{ borderWidth: '1px' }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-24 h-5 flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="CUVIA Logo" 
                className="h-5 w-auto object-contain"
              />
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Icon icon="mdi:chart-line" className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-semibold text-white">통계조회</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/agent-hub"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            Agent Hub
          </Link>
          <Link
            href="/"
            className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors text-sm"
          >
            대시보드
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* 좌측: 통계 카테고리 패널 */}
        <div className="w-64 flex-shrink-0 bg-[#1a1a1a] border-r border-[#2a2a2a] overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
              <Icon icon="mdi:view-dashboard-outline" className="w-4 h-4 text-blue-400" />
              <span>주요 카테고리</span>
            </div>
          </div>
          <div className="p-2 space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all border ${
                  selectedCategory === category.id
                    ? 'bg-blue-500/20 border-blue-500/50 text-white'
                    : 'border-transparent text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                }`}
                style={{ borderWidth: '1px' }}
              >
                <div className="flex items-center gap-3">
                  <Icon icon={category.icon} className="w-5 h-5" />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 중앙: 메인 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* 검색창 */}
          <div className="p-4 border-b border-[#2a2a2a] bg-[#1a1a1a]" style={{ borderWidth: '1px' }}>
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Icon icon="mdi:magnify" className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleInputKeyPress}
                  placeholder="통계를 조회하세요... (예: 요즘 화재가 늘었어?)"
                  className="w-full pl-12 pr-14 py-3 bg-[#0f0f0f] border border-[#2a2a2a] rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"
                  style={{ borderWidth: '1px' }}
                  disabled={isLoading}
                />
                {input && (
                  <button
                    onClick={() => {
                      setInput('');
                      setInsight(null);
                      setFilters([]);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#2a2a2a] rounded-full transition-colors"
                  >
                    <Icon icon="mdi:close" className="w-5 h-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* 상단: AI 인사이트 카드 */}
            {insight && (
              <div className="mb-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6" style={{ borderWidth: '1px' }}>
                <div className="flex items-start gap-3 mb-4">
                  <Icon icon="mdi:lightbulb-on" className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg mb-2">🔹 AI 인사이트</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-white font-medium">{insight.value}</div>
                      {insight.reason && (
                        <div className="text-gray-300">증가 원인: {insight.reason}</div>
                      )}
                      {insight.location && (
                        <div className="text-gray-300">주요 지역: {insight.location}</div>
                      )}
                      {insight.timeRange && (
                        <div className="text-gray-300">사고 시간대: {insight.timeRange}</div>
                      )}
                      {insight.impact && (
                        <div className="text-blue-400 font-medium">→ {insight.impact}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            )}

            {/* 중앙: 차트/그래프 영역 */}
            {insight && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 전체 사건 추이 */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-6">전체 사건 추이</h3>
                  <div className="flex items-end justify-between gap-2 h-48">
                    {weeklyData.map((data, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex items-end justify-center" style={{ height: '150px' }}>
                          <div
                            className="w-full bg-blue-500 rounded-t-lg transition-all duration-500 hover:bg-blue-400"
                            style={{
                              height: `${(data.count / maxCount) * 100}%`,
                              minHeight: '4px',
                            }}
                          />
                          <div className="absolute -bottom-6 text-xs text-gray-400">{data.count}</div>
                        </div>
                        <div className="text-sm text-gray-400 mt-8">{data.day}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 유형별 비율 */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
                  <h3 className="text-white font-semibold text-lg mb-6">유형별 비율</h3>
                  <div className="space-y-4">
                    {categoryData.map((data, index) => {
                      const maxCategoryCount = Math.max(...categoryData.map(d => d.count));
                      return (
                        <div key={index} className="flex items-center gap-4">
                          <div className="w-20 text-sm text-gray-400">{data.category}</div>
                          <div className="flex-1 relative">
                            <div className="h-8 bg-[#2a2a2a] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${data.color} rounded-full transition-all duration-500 flex items-center justify-end pr-3`}
                                style={{ width: `${(data.count / maxCategoryCount) * 100}%` }}
                              >
                                <span className="text-white text-xs font-medium">{data.count}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 하단: 최근 증가 이벤트 Top3 */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6" style={{ borderWidth: '1px' }}>
              <h3 className="text-white font-semibold text-lg mb-4">최근 증가 이벤트 Top3</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {trendEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 p-4 bg-[#242424] rounded-lg">
                    <Icon icon={event.icon} className={`w-6 h-6 ${event.color}`} />
                    <div>
                      <div className="text-white font-medium">{event.type}</div>
                      <div className={`text-sm ${event.color}`}>{event.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 필터/조건 패널 */}
        <div className="w-80 flex-shrink-0 bg-[#1a1a1a] border-l border-[#2a2a2a] overflow-y-auto" style={{ borderWidth: '1px' }}>
          <div className="p-4 border-b border-[#2a2a2a]" style={{ borderWidth: '1px' }}>
            <h2 className="text-white font-semibold text-sm mb-2">필터/조건</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* AI 추천 필터 */}
            {aiRecommendedFilters.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4" style={{ borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:robot" className="w-5 h-5 text-blue-400" />
                  <span className="text-white font-medium text-sm">AI 추천 필터</span>
                </div>
                <div className="space-y-2">
                  {aiRecommendedFilters.map((filter, index) => (
                    <div key={index} className="text-sm text-gray-300">{filter}</div>
                  ))}
                </div>
              </div>
            )}

            {/* 필수 필터 */}
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">기간</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>이번주</option>
                  <option>지난주</option>
                  <option>이번달</option>
                  <option>지난달</option>
                  <option>올해</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">지역</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                <option>전체</option>
                <option>동안구</option>
                <option>만안구</option>
                <option>비산동</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">사건 유형</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>화재</option>
                  <option>미아</option>
                  <option>약자</option>
                  <option>배회</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">심각도</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">출처</label>
                <select className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm" style={{ borderWidth: '1px' }}>
                  <option>전체</option>
                  <option>112</option>
                  <option>119</option>
                  <option>AI</option>
                  <option>NDMS</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
