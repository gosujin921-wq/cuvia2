'use client';

import { Icon } from '@iconify/react';
import { useState, useEffect } from 'react';

// 데이터 타입 정의
interface CctvConnectionStatus {
  cameraId: string;
  name: string;
  status: 'normal' | 'delay' | 'error';
  latency: number | null;
}

interface MonitoringSpot {
  spotId: string;
  spotName: string;
  streamUrl?: string;
  thumbnails?: string[]; // 여러 썸네일 (2-3개)
  fps: number;
  status: 'normal' | 'delay' | 'disconnected';
  autoSequence: boolean;
  environment?: 'normal' | 'night' | 'fog' | 'rain'; // 환경 상태
}

interface CctvStatus {
  totalRate: number; // 전체 CCTV 가동률 (%)
  totalCount: number; // CCTV 총 개수
  normalCount: number; // 정상 장비 수
  errorCount: number; // 장애 장비 수
  delayCount: number; // 지연 발생 장비 수
  connectionList: CctvConnectionStatus[];
  monitoringSpots: MonitoringSpot[];
}

interface SensorData {
  pm25: { value: number; level: 'good' | 'normal' | 'bad' };
  pm10: { value: number; level: 'good' | 'normal' | 'bad' };
  temperature: { value: number; level: 'good' | 'normal' | 'bad' };
  humidity: { value: number; level: 'good' | 'normal' | 'bad' };
  rainfall: { value: number; level: 'good' | 'normal' | 'bad' };
  windSpeed: { value: number; level: 'good' | 'normal' | 'bad' };
  lastUpdate: string; // timestamp
}

interface InfrastructureStatus {
  waterLeakage: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  powerSupply: { status: 'normal' | 'warning' | 'error'; lastUpdate: string };
  streetLightRate: number; // 가로등 점등률 (%)
  iotSensorRate: number; // 공공 IoT 센서 가동률 (%)
  alert: boolean;
  alertMessage?: string;
}

const RightPanel = () => {
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [spotThumbnailIndices, setSpotThumbnailIndices] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [sensorValues, setSensorValues] = useState({
    pm25: 38,
    pm10: 72,
    temperature: 11,
    humidity: 62,
    rainfall: 0.3,
    windSpeed: 1.2,
  });

  // CCTV 스트리밍 자동 순환 (5초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStreamIndex((prev) => {
        const autoSequenceSpots = cctvStatus.monitoringSpots.filter(spot => spot.autoSequence);
        if (autoSequenceSpots.length === 0) return prev;
        return (prev + 1) % autoSequenceSpots.length;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 각 지점별 썸네일 롤링 (5초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotThumbnailIndices((prev) => {
        const newIndices: Record<string, number> = {};
        cctvStatus.monitoringSpots.forEach((spot) => {
          if (spot.thumbnails && spot.thumbnails.length > 0) {
            const currentIndex = prev[spot.spotId] || 0;
            newIndices[spot.spotId] = (currentIndex + 1) % spot.thumbnails.length;
          }
        });
        return newIndices;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // 페이지 자동 순환 (10초 간격)
  useEffect(() => {
    const totalPages = Math.ceil(cctvStatus.monitoringSpots.length / 2);
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 센서 값 실시간 업데이트 애니메이션 (2초 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorValues((prev) => ({
        pm25: Math.max(0, prev.pm25 + (Math.random() - 0.5) * 4),
        pm10: Math.max(0, prev.pm10 + (Math.random() - 0.5) * 6),
        temperature: prev.temperature + (Math.random() - 0.5) * 0.5,
        humidity: Math.max(0, Math.min(100, prev.humidity + (Math.random() - 0.5) * 2)),
        rainfall: Math.max(0, prev.rainfall + (Math.random() - 0.5) * 0.2),
        windSpeed: Math.max(0, prev.windSpeed + (Math.random() - 0.5) * 0.3),
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 1) CCTV 운영 현황 데이터
  const cctvStatus: CctvStatus = {
    totalRate: 96.1,
    totalCount: 1240,
    normalCount: 1192,
    errorCount: 48,
    delayCount: 12,
    connectionList: [
      { cameraId: '001', name: '001-중앙로교차로', status: 'normal', latency: null },
      { cameraId: '017', name: '017-안양4지구', status: 'delay', latency: 350 },
      { cameraId: '033', name: '033-병목지점 2', status: 'error', latency: null },
      { cameraId: '078', name: '078-중앙시장 입구', status: 'normal', latency: null },
      { cameraId: '102', name: '102-평촌역 출입구', status: 'normal', latency: null },
      { cameraId: '156', name: '156-비산동 골목', status: 'delay', latency: 280 },
    ],
    monitoringSpots: [
      { 
        spotId: '1', 
        spotName: '중앙역 출입구 2번', 
        fps: 29, 
        status: 'delay', 
        autoSequence: true,
        thumbnails: [
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=150&fit=crop',
        ],
        environment: 'normal',
      },
      { 
        spotId: '2', 
        spotName: '경찰서 앞', 
        fps: 30, 
        status: 'normal', 
        autoSequence: true,
        thumbnails: [
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
        ],
        environment: 'night',
      },
      { 
        spotId: '3', 
        spotName: '평촌대로 교차로', 
        fps: 28, 
        status: 'normal', 
        autoSequence: true,
        thumbnails: [
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=150&fit=crop',
        ],
        environment: 'fog',
      },
      { 
        spotId: '4', 
        spotName: '터널 입구', 
        fps: 30, 
        status: 'normal', 
        autoSequence: false,
        thumbnails: [
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=200&h=150&fit=crop',
        ],
        environment: 'normal',
      },
      { 
        spotId: '5', 
        spotName: '안양역 광장', 
        fps: 27, 
        status: 'delay', 
        autoSequence: true,
        thumbnails: [
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
          'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=200&h=150&fit=crop',
        ],
        environment: 'rain',
      },
      { 
        spotId: '6', 
        spotName: '중앙시장 입구', 
        fps: 30, 
        status: 'normal', 
        autoSequence: false,
        thumbnails: [
          'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=200&h=150&fit=crop',
        ],
        environment: 'normal',
      },
    ],
  };

  // level을 한글로 변환
  const getLevelText = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return '양호';
      case 'normal':
        return '보통';
      case 'bad':
        return '나쁨';
    }
  };

  // 센서 값에 따른 level 계산
  const getPm25Level = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 15) return 'good';
    if (value <= 35) return 'normal';
    return 'bad';
  };

  const getPm10Level = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 30) return 'good';
    if (value <= 80) return 'normal';
    return 'bad';
  };

  const getTemperatureLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value >= 18 && value <= 26) return 'good';
    if (value >= 10 && value <= 30) return 'normal';
    return 'bad';
  };

  const getHumidityLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value >= 40 && value <= 60) return 'good';
    if (value >= 30 && value <= 70) return 'normal';
    return 'bad';
  };

  const getRainfallLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 0.5) return 'good';
    if (value <= 2.0) return 'normal';
    return 'bad';
  };

  const getWindSpeedLevel = (value: number): 'good' | 'normal' | 'bad' => {
    if (value <= 2.0) return 'good';
    if (value <= 5.0) return 'normal';
    return 'bad';
  };

  // 2) 실시간 환경 센서 모니터링 데이터
  const sensorData: SensorData = {
    pm25: { value: sensorValues.pm25, level: getPm25Level(sensorValues.pm25) },
    pm10: { value: sensorValues.pm10, level: getPm10Level(sensorValues.pm10) },
    temperature: { value: sensorValues.temperature, level: getTemperatureLevel(sensorValues.temperature) },
    humidity: { value: sensorValues.humidity, level: getHumidityLevel(sensorValues.humidity) },
    rainfall: { value: sensorValues.rainfall, level: getRainfallLevel(sensorValues.rainfall) },
    windSpeed: { value: sensorValues.windSpeed, level: getWindSpeedLevel(sensorValues.windSpeed) },
    lastUpdate: new Date().toISOString(),
  };

  // 3) 도시 기반시설 운영 상태 데이터
  const infrastructureStatus: InfrastructureStatus = {
    waterLeakage: { status: 'error', lastUpdate: new Date().toISOString() },
    powerSupply: { status: 'normal', lastUpdate: new Date().toISOString() },
    streetLightRate: 92,
    iotSensorRate: 95.5,
    alert: true,
    alertMessage: '상수도 누수 감지',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return 'text-green-400';
      case 'delay':
      case 'warning':
      case 'normal':
        return 'text-yellow-400';
      case 'error':
      case 'bad':
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
      case 'good':
        return 'mdi:check-circle';
      case 'delay':
      case 'warning':
      case 'normal':
        return 'mdi:alert-circle';
      case 'error':
      case 'bad':
      case 'disconnected':
        return 'mdi:alert';
      default:
        return 'mdi:help-circle';
    }
  };

  const getLevelColor = (level: 'good' | 'normal' | 'bad') => {
    switch (level) {
      case 'good':
        return 'text-green-400';
      case 'normal':
        return 'text-yellow-400';
      case 'bad':
        return 'text-red-400';
    }
  };

  const getEnvironmentLabel = (env?: 'normal' | 'night' | 'fog' | 'rain') => {
    switch (env) {
      case 'night':
        return '야간';
      case 'fog':
        return '안개';
      case 'rain':
        return '우천';
      default:
        return '정상';
    }
  };

  const getEnvironmentColor = (env?: 'normal' | 'night' | 'fog' | 'rain') => {
    switch (env) {
      case 'night':
        return 'text-blue-400';
      case 'fog':
        return 'text-gray-400';
      case 'rain':
        return 'text-cyan-400';
      default:
        return 'text-green-400';
    }
  };

  return (
    <div className="w-96 bg-[#161719] border-l border-[#31353a] flex flex-col h-full overflow-hidden" style={{ borderWidth: '1px' }}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1) CCTV 운영 현황 */}
        <div className="space-y-2.5">
          <h3 className="text-white font-semibold text-sm">CCTV 운영 현황</h3>
          
          {/* 전체 요약 데이터 */}
          <div className="space-y-3">
            {/* 정상/장애/지연 장비 수 (색있는 불릿) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">정상 장비 수</span>
                <span className="text-green-400 text-xs font-medium">{cctvStatus.normalCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">장애 장비 수</span>
                <span className="text-red-400 text-xs font-medium">{cctvStatus.errorCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">지연 발생 장비 수</span>
                <span className="text-yellow-400 text-xs font-medium">{cctvStatus.delayCount}</span>
              </div>
            </div>

            {/* 전체 CCTV 가동률과 CCTV 총 개수 (큰 숫자 스코어 스타일) */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1">전체 CCTV 가동률</div>
                <div className="text-white text-2xl font-bold">
                  {cctvStatus.totalRate}
                  <span className="text-xl">%</span>
                </div>
              </div>
              <div className="w-px h-12 bg-[#31353a]" />
              <div className="flex-1">
                <div className="text-gray-400 text-xs mb-1">CCTV 총 개수</div>
                <div className="text-white text-2xl font-bold">
                  {cctvStatus.totalCount.toLocaleString()}
                  <span className="text-xl">대</span>
                </div>
              </div>
            </div>
          </div>

          {/* CCTV 연결 상태 리스트 */}
          <div className="bg-[#36383B] border border-[#31353a] p-3" style={{ borderWidth: '1px' }}>
            {/* 동(구역)명과 더보기 버튼 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white text-sm font-medium">비산동</span>
              <button className="p-1 hover:bg-[#161719] transition-colors" aria-label="더보기">
                <Icon icon="mdi:chevron-right" className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* CCTV 가동률 */}
            <div className="mb-4">
              <div className="text-gray-400 text-xs mb-1">CCTV 가동률</div>
              <div className="text-white text-2xl font-bold mb-2">
                {cctvStatus.totalRate}
                <span className="text-xl">%</span>
              </div>
              {/* 진행 바 */}
              <div className="w-full h-2 bg-[#161719]">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${cctvStatus.totalRate}%` }}
                />
              </div>
            </div>

            {/* 상태 원형 표시 (정상, 지연, 장애) */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">정상</span>
                <span className="text-green-400 text-xs font-medium">{cctvStatus.normalCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-yellow-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">지연</span>
                <span className="text-yellow-400 text-xs font-medium">{cctvStatus.delayCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-red-500" style={{ borderRadius: '50%' }} />
                <span className="text-gray-400 text-xs">장애</span>
                <span className="text-red-400 text-xs font-medium">{cctvStatus.errorCount}</span>
              </div>
            </div>
          </div>

          {/* 주요 감시 지점별 영상 스트리밍 상태 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-gray-400 text-xs">주요 감시 지점 (자동 순차)</div>
              <div className="text-gray-500 text-xs">
                {currentPage + 1}/{Math.ceil(cctvStatus.monitoringSpots.length / 2)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {cctvStatus.monitoringSpots.slice(currentPage * 2, (currentPage + 1) * 2).map((spot) => {
                const currentThumbnailIndex = spotThumbnailIndices[spot.spotId] || 0;
                const currentThumbnails = spot.thumbnails || [];
                const currentThumbnail = currentThumbnails[currentThumbnailIndex];
                const currentTime = new Date().toLocaleTimeString('ko-KR', {
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                  hour12: true 
                });

                return (
                  <div
                    key={spot.spotId}
                    className="bg-[#36383B] border border-[#31353a] p-3 space-y-1.5"
                    style={{ borderWidth: '1px' }}
                  >
                      {/* 장소 이름과 LIVE 인디케이터 (우측 정렬) */}
                      <div className="flex items-center justify-between">
                        <span className="text-white text-xs font-medium">{spot.spotName}</span>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-red-500" />
                          <span className="text-red-500 text-xs font-medium">LIVE</span>
                        </div>
                      </div>

                      {/* Spot ID */}
                      <div className="text-gray-400 text-xs">SPOT-{spot.spotId.padStart(3, '0')}</div>

                      {/* 상태 배지 (캡슐 형태) */}
                      <div className="flex items-center gap-1.5">
                        {spot.status === 'normal' ? (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs" style={{ borderRadius: '9999px' }}>정상</span>
                        ) : spot.status === 'delay' ? (
                          <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs" style={{ borderRadius: '9999px' }}>지연</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs" style={{ borderRadius: '9999px' }}>연결끊김</span>
                        )}
                      </div>

                      {/* 타임스탬프와 FPS (같은 줄, 양끝 정렬) */}
                      <div className="flex items-center justify-between">
                        <div className="text-gray-500 text-xs">{currentTime}</div>
                        <div className="text-gray-400 text-xs">{spot.fps} FPS</div>
                      </div>
                    </div>
                  );
                })}
              {/* 빈 슬롯 채우기 (2개 미만일 경우) */}
              {Array.from({ length: 2 - Math.min(2, cctvStatus.monitoringSpots.length - currentPage * 2) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="bg-[#36383B]/30 border border-[#31353a]/30 p-3"
                  style={{ borderWidth: '1px' }}
                />
              ))}
            </div>

            {/* 페이지네이션 점 (원형) */}
            <div className="flex justify-center gap-1.5 mt-2.5">
              {Array.from({ length: Math.ceil(cctvStatus.monitoringSpots.length / 2) }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx)}
                  className={`w-1.5 h-1.5 transition-colors ${
                    currentPage === idx ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                  style={{ borderRadius: '50%' }}
                  aria-label={`페이지 ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 2) 실시간 환경 센서 모니터링 */}
        <div className="space-y-2.5">
          <h3 className="text-white font-semibold text-sm">실시간 환경 센서 모니터링</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {/* PM2.5 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:air-filter" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">PM2.5</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.pm25.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.pm25.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm25.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* PM10 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-dust" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">PM10</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.pm10.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.pm10.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.pm10.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">㎍/m³</span>
              </div>
            </div>

            {/* 온도 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:thermometer" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">온도</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.temperature.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.temperature.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.temperature.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">°C</span>
              </div>
            </div>

            {/* 습도 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:water-percent" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">습도</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.humidity.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.humidity.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.humidity.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">%</span>
              </div>
            </div>

            {/* 강수량 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-rainy" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">강수량</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.rainfall.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.rainfall.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.rainfall.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">mm</span>
              </div>
            </div>

            {/* 풍속 */}
            <div className="bg-[#36383B] p-3 border border-[#31353a]" style={{ borderWidth: '1px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1">
                  <Icon icon="mdi:weather-windy" className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">풍속</span>
                </div>
                <span className={`text-xs ${getLevelColor(sensorData.windSpeed.level)} transition-colors duration-300`}>
                  {getLevelText(sensorData.windSpeed.level)}
                </span>
              </div>
              <div className="text-white text-base font-semibold transition-all duration-300">
                {sensorData.windSpeed.value.toFixed(1)}
                <span className="text-gray-400 text-xs ml-0.5">m/s</span>
              </div>
            </div>
          </div>
          <div className="text-gray-500 text-xs text-right">
            마지막 업데이트: {new Date(sensorData.lastUpdate).toLocaleTimeString('ko-KR')}
          </div>
        </div>

        {/* 3) 도시 기반시설 운영 상태 */}
        <div className="space-y-2.5">
          <h3 className="text-white font-semibold text-sm">도시 기반시설 운영 상태</h3>
          
          {/* 장애 알림 (최상단) */}
          {infrastructureStatus.alert && infrastructureStatus.alertMessage && (
            <div className="bg-red-500/20 border border-red-500/50 p-3" style={{ borderWidth: '1px' }}>
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                <Icon icon="mdi:alert" className="w-4 h-4" />
                <span>{infrastructureStatus.alertMessage}</span>
              </div>
            </div>
          )}

          <div className="bg-[#36383B] border border-[#31353a] p-3 space-y-1.5" style={{ borderWidth: '1px' }}>
            {/* 상수도 누수 상태 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon
                  icon={getStatusIcon(infrastructureStatus.waterLeakage.status)}
                  className={`w-3.5 h-3.5 ${getStatusColor(infrastructureStatus.waterLeakage.status)}`}
                />
                <span className="text-white">상수도 누수 상태</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-xs ${
                  infrastructureStatus.waterLeakage.status === 'normal' 
                    ? 'bg-green-500/20 text-green-400' 
                    : infrastructureStatus.waterLeakage.status === 'warning' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-red-500/20 text-red-400'
                }`} style={{ borderRadius: '9999px' }}>
                  {infrastructureStatus.waterLeakage.status === 'normal' ? '정상' : 
                   infrastructureStatus.waterLeakage.status === 'warning' ? '경고' : '장애'}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(infrastructureStatus.waterLeakage.lastUpdate).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            </div>

            {/* 전력 공급 상태 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Icon
                  icon={getStatusIcon(infrastructureStatus.powerSupply.status)}
                  className={`w-3.5 h-3.5 ${getStatusColor(infrastructureStatus.powerSupply.status)}`}
                />
                <span className="text-white">전력 공급 상태</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-0.5 text-xs ${
                  infrastructureStatus.powerSupply.status === 'normal' 
                    ? 'bg-green-500/20 text-green-400' 
                    : infrastructureStatus.powerSupply.status === 'warning' 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'bg-red-500/20 text-red-400'
                }`} style={{ borderRadius: '9999px' }}>
                  {infrastructureStatus.powerSupply.status === 'normal' ? '정상' : 
                   infrastructureStatus.powerSupply.status === 'warning' ? '경고' : '장애'}
                </span>
                <span className="text-gray-500 text-xs">
                  {new Date(infrastructureStatus.powerSupply.lastUpdate).toLocaleTimeString('ko-KR')}
                </span>
              </div>
            </div>

            {/* 가로등 점등률 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white">가로등 점등률</span>
              <span className="text-white text-xs">{infrastructureStatus.streetLightRate}%</span>
            </div>

            {/* 공공 IoT 센서 가동률 */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-white">공공 IoT 센서 가동률</span>
              <span className="text-white text-xs">{infrastructureStatus.iotSensorRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
