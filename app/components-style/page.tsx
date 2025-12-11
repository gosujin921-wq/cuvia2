'use client';

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { 
  getTabButtonClassName,
  getPrimaryButtonClassName,
  getSecondaryButtonClassName,
  getIconButtonClassName,
  getCardClassName,
  getInputClassName,
  getCCTVIconClassName,
  getPTZButtonClassName,
  getPTZPresetButtonClassName,
  getCCTVLabelClassName,
  getCCTVBadgeClassName,
  getCCTVViewAngleClassName,
  colorPalette,
  fontSizes,
  fontWeights,
  buttonStyles as initialButtonStyles,
  cardStyles as initialCardStyles,
  inputStyles as initialInputStyles,
  cctvIconStyles as initialCctvIconStyles,
  cctvLabelStyles as initialCctvLabelStyles,
  cctvBadgeStyles as initialCctvBadgeStyles,
  ptzButtonStyles as initialPtzButtonStyles
} from '@/components/shared/styles';

// 스타일 타입 정의
type ButtonStyles = typeof initialButtonStyles;
type CardStyles = typeof initialCardStyles;
type InputStyles = typeof initialInputStyles;
type CctvIconStyles = typeof initialCctvIconStyles;
type CctvLabelStyles = typeof initialCctvLabelStyles;
type CctvBadgeStyles = typeof initialCctvBadgeStyles;
type PtzButtonStyles = typeof initialPtzButtonStyles;

export default function ComponentsStylePage() {
  const [activeSection, setActiveSection] = useState<string>('buttons');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // 스타일 state
  const [buttonStyles, setButtonStyles] = useState<ButtonStyles>(initialButtonStyles);
  const [cardStyles, setCardStyles] = useState<CardStyles>(initialCardStyles);
  const [inputStyles, setInputStyles] = useState<InputStyles>(initialInputStyles);
  const [cctvIconStyles, setCctvIconStyles] = useState<CctvIconStyles>(initialCctvIconStyles);
  const [cctvLabelStyles, setCctvLabelStyles] = useState<CctvLabelStyles>(initialCctvLabelStyles);
  const [cctvBadgeStyles, setCctvBadgeStyles] = useState<CctvBadgeStyles>(initialCctvBadgeStyles);
  const [ptzButtonStyles, setPtzButtonStyles] = useState<PtzButtonStyles>(initialPtzButtonStyles);

  // 헬퍼 함수들 (동적 스타일 사용)
  const getPrimaryButtonClassName = () => {
    return `${buttonStyles.primary.base} ${buttonStyles.primary.active} flex items-center justify-center`.trim();
  };

  const getSecondaryButtonClassName = () => {
    return `${buttonStyles.secondary.base} ${buttonStyles.secondary.inactive} flex items-center justify-center`.trim();
  };

  const getIconButtonClassName = (isActive: boolean = false) => {
    const base = buttonStyles.icon.base;
    const state = isActive ? buttonStyles.icon.active : buttonStyles.icon.inactive;
    return `${base} ${state}`.trim();
  };

  const getCardClassName = (variant: 'default' | 'compact' = 'default') => {
    return cardStyles[variant];
  };

  const getInputClassName = () => {
    return inputStyles.default;
  };

  const getCCTVIconClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
    return cctvIconStyles[variant];
  };

  const getCCTVLabelClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
    const base = cctvLabelStyles.base;
    const border = cctvLabelStyles[variant];
    return `${base} ${border}`.trim();
  };

  const getCCTVBadgeClassName = (variant: 'default' | 'tracking' = 'default') => {
    const base = cctvBadgeStyles.base;
    const color = cctvBadgeStyles[variant];
    return `${base} ${color}`.trim();
  };

  const getPTZButtonClassName = (isActive: boolean = false) => {
    const base = ptzButtonStyles.base;
    const state = isActive ? ptzButtonStyles.active : ptzButtonStyles.default;
    return `${base} ${state}`.trim();
  };

  const getPTZPresetButtonClassName = (isActive: boolean = false) => {
    const base = ptzButtonStyles.preset.base;
    const state = isActive ? ptzButtonStyles.preset.active : ptzButtonStyles.preset.default;
    return `${base} ${state}`.trim();
  };

  // 파일 저장 함수
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 스타일 파일 내용 생성
      const fileContent = `// 공통 컴포넌트 스타일 정의
// 이 파일을 수정하면 모든 컴포넌트에 일괄 적용됩니다.

// 컬러 팔레트
export const colorPalette = {
  // 배경 컬러
  background: {
    primary: '#161719',
    secondary: '#0f0f0f',
    tertiary: '#1a1a1a',
    hover: '#2a2a2a',
    border: '#31353a',
    card: '#36383B',
  },
  // 텍스트 컬러
  text: {
    primary: 'white',
    secondary: 'gray-300',
    tertiary: 'gray-400',
    muted: 'gray-500',
    disabled: 'gray-600',
  },
  // 액센트 컬러
  accent: {
    blue: {
      light: 'blue-400',
      base: 'blue-500',
      dark: 'blue-600',
      darker: 'blue-700',
    },
    red: {
      light: 'red-400',
      base: 'red-500',
      dark: 'red-600',
    },
    yellow: {
      light: 'yellow-400',
      base: 'yellow-500',
    },
    green: {
      base: 'green-600',
      dark: 'green-700',
    },
    purple: {
      light: 'purple-400',
      base: 'purple-500',
      dark: 'purple-600',
      darker: 'purple-700',
    },
    indigo: {
      base: 'indigo-600',
      dark: 'indigo-700',
    },
  },
};

// 폰트 사이즈
export const fontSizes = {
  xs: 'text-xs',      // 12px
  sm: 'text-sm',      // 14px
  base: 'text-base',   // 16px
  lg: 'text-lg',      // 18px
  xl: 'text-xl',      // 20px
  '2xl': 'text-2xl',  // 24px
  '3xl': 'text-3xl',  // 30px
};

// 폰트 웨이트
export const fontWeights = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const buttonStyles = {
  primary: {
    base: ${JSON.stringify(buttonStyles.primary.base)},
    active: ${JSON.stringify(buttonStyles.primary.active)},
    inactive: ${JSON.stringify(buttonStyles.primary.inactive)},
  },
  secondary: {
    base: ${JSON.stringify(buttonStyles.secondary.base)},
    active: ${JSON.stringify(buttonStyles.secondary.active)},
    inactive: ${JSON.stringify(buttonStyles.secondary.inactive)},
  },
  icon: {
    base: ${JSON.stringify(buttonStyles.icon.base)},
    active: ${JSON.stringify(buttonStyles.icon.active)},
    inactive: ${JSON.stringify(buttonStyles.icon.inactive)},
  },
};

export const cardStyles = {
  default: ${JSON.stringify(cardStyles.default)},
  compact: ${JSON.stringify(cardStyles.compact)},
};

export const inputStyles = {
  default: ${JSON.stringify(inputStyles.default)},
};

export const cctvIconStyles = {
  default: ${JSON.stringify(cctvIconStyles.default)},
  active: ${JSON.stringify(cctvIconStyles.active)},
  tracking: ${JSON.stringify(cctvIconStyles.tracking)},
  warning: ${JSON.stringify(cctvIconStyles.warning)},
};

export const cctvLabelStyles = {
  base: ${JSON.stringify(cctvLabelStyles.base)},
  default: ${JSON.stringify(cctvLabelStyles.default)},
  active: ${JSON.stringify(cctvLabelStyles.active)},
  tracking: ${JSON.stringify(cctvLabelStyles.tracking)},
  warning: ${JSON.stringify(cctvLabelStyles.warning)},
};

export const cctvBadgeStyles = {
  base: ${JSON.stringify(cctvBadgeStyles.base)},
  default: ${JSON.stringify(cctvBadgeStyles.default)},
  tracking: ${JSON.stringify(cctvBadgeStyles.tracking)},
};

export const cctvViewAngleStyles = {
  container: 'absolute pointer-events-none',
  svg: 'absolute top-0 left-0',
};

export const ptzButtonStyles = {
  base: ${JSON.stringify(ptzButtonStyles.base)},
  default: ${JSON.stringify(ptzButtonStyles.default)},
  active: ${JSON.stringify(ptzButtonStyles.active)},
  preset: {
    base: ${JSON.stringify(ptzButtonStyles.preset.base)},
    default: ${JSON.stringify(ptzButtonStyles.preset.default)},
    active: ${JSON.stringify(ptzButtonStyles.preset.active)},
  },
};

// 헬퍼 함수들
export const getTabButtonClassName = (isActive: boolean) => {
  const base = buttonStyles.primary.base;
  const state = isActive ? buttonStyles.primary.active : buttonStyles.primary.inactive;
  const borderStyle = isActive ? '' : 'border border-[#2a2a2a]';
  return \`\${base} \${state} \${borderStyle}\`.trim();
};

export const getPrimaryButtonClassName = () => {
  return \`\${buttonStyles.primary.base} \${buttonStyles.primary.active} flex items-center justify-center\`.trim();
};

export const getSecondaryButtonClassName = () => {
  return \`\${buttonStyles.secondary.base} \${buttonStyles.secondary.inactive} flex items-center justify-center\`.trim();
};

export const getIconButtonClassName = (isActive: boolean = false) => {
  const base = buttonStyles.icon.base;
  const state = isActive ? buttonStyles.icon.active : buttonStyles.icon.inactive;
  return \`\${base} \${state}\`.trim();
};

export const getCardClassName = (variant: 'default' | 'compact' = 'default') => {
  return cardStyles[variant];
};

export const getInputClassName = () => {
  return inputStyles.default;
};

export const getCCTVIconClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
  return cctvIconStyles[variant];
};

export const getCCTVLabelClassName = (variant: 'default' | 'active' | 'tracking' | 'warning' = 'default') => {
  const base = cctvLabelStyles.base;
  const border = cctvLabelStyles[variant];
  return \`\${base} \${border}\`.trim();
};

export const getCCTVBadgeClassName = (variant: 'default' | 'tracking' = 'default') => {
  const base = cctvBadgeStyles.base;
  const color = cctvBadgeStyles[variant];
  return \`\${base} \${color}\`.trim();
};

export const getCCTVViewAngleClassName = () => {
  return cctvViewAngleStyles.container;
};

export const getPTZButtonClassName = (isActive: boolean = false) => {
  const base = ptzButtonStyles.base;
  const state = isActive ? ptzButtonStyles.active : ptzButtonStyles.default;
  return \`\${base} \${state}\`.trim();
};

export const getPTZPresetButtonClassName = (isActive: boolean = false) => {
  const base = ptzButtonStyles.preset.base;
  const state = isActive ? ptzButtonStyles.preset.active : ptzButtonStyles.preset.default;
  return \`\${base} \${state}\`.trim();
};
`;

      const response = await fetch('/api/styles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: fileContent }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => {
          setSaveStatus('idle');
          // 페이지 새로고침하여 변경사항 반영
          window.location.reload();
        }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving styles:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('코드가 클립보드에 복사되었습니다.');
  };

  const sections = [
    { id: 'buttons', name: '버튼', icon: 'mdi:button-cursor' },
    { id: 'ptz-buttons', name: 'PTZ 버튼', icon: 'mdi:arrow-all' },
    { id: 'cards', name: '카드/박스', icon: 'mdi:card' },
    { id: 'inputs', name: '입력 필드', icon: 'mdi:text-box' },
    { id: 'cctv-icons', name: 'CCTV 아이콘', icon: 'mdi:cctv' },
    { id: 'colors', name: '컬러 팔레트', icon: 'mdi:palette' },
    { id: 'fonts', name: '폰트', icon: 'mdi:format-font' },
  ];

  return (
    <div className="h-screen overflow-y-auto bg-[#161719] text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">컴포넌트 스타일 관리</h1>
            <p className="text-gray-400">중복되는 컴포넌트 스타일을 한 곳에서 관리합니다.</p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="text-green-400 text-sm">저장 완료!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-400 text-sm">저장 실패</span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save" className="w-4 h-4" />
                  저장
                </>
              )}
            </button>
          </div>
        </div>

        {/* 섹션 네비게이션 */}
        <div className="flex gap-2 mb-8 border-b border-[#31353a] pb-4">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`${getTabButtonClassName(activeSection === section.id)} flex items-center gap-2`}
              style={{ borderWidth: activeSection === section.id ? '0' : '1px' }}
            >
              <Icon icon={section.icon} className="w-4 h-4" />
              {section.name}
            </button>
          ))}
        </div>

        {/* 버튼 섹션 */}
        {activeSection === 'buttons' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Primary 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getPrimaryButtonClassName()}>
                      Primary 버튼
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPrimaryButtonClassName } from '@/components/shared/styles';

<button className={getPrimaryButtonClassName()}>
  버튼 텍스트
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPrimaryButtonClassName } from '@/components/shared/styles';\n\n<button className={getPrimaryButtonClassName()}>\n  버튼 텍스트\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={buttonStyles.primary.base}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          primary: { ...buttonStyles.primary, base: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={buttonStyles.primary.active}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          primary: { ...buttonStyles.primary, active: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Inactive</label>
                      <input
                        type="text"
                        value={buttonStyles.primary.inactive}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          primary: { ...buttonStyles.primary, inactive: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Secondary 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getSecondaryButtonClassName()}>
                      Secondary 버튼
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getSecondaryButtonClassName } from '@/components/shared/styles';

<button className={getSecondaryButtonClassName()}>
  버튼 텍스트
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getSecondaryButtonClassName } from '@/components/shared/styles';\n\n<button className={getSecondaryButtonClassName()}>\n  버튼 텍스트\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={buttonStyles.secondary.base}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          secondary: { ...buttonStyles.secondary, base: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={buttonStyles.secondary.active}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          secondary: { ...buttonStyles.secondary, active: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Inactive</label>
                      <input
                        type="text"
                        value={buttonStyles.secondary.inactive}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          secondary: { ...buttonStyles.secondary, inactive: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">아이콘 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getIconButtonClassName()}>
                      <Icon icon="mdi:plus" className="w-5 h-5" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getIconButtonClassName } from '@/components/shared/styles';

<button className={getIconButtonClassName()}>
  <Icon icon="mdi:plus" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getIconButtonClassName } from '@/components/shared/styles';\n\n<button className={getIconButtonClassName()}>\n  <Icon icon="mdi:plus" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={buttonStyles.icon.base}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          icon: { ...buttonStyles.icon, base: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={buttonStyles.icon.active}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          icon: { ...buttonStyles.icon, active: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Inactive</label>
                      <input
                        type="text"
                        value={buttonStyles.icon.inactive}
                        onChange={(e) => setButtonStyles({
                          ...buttonStyles,
                          icon: { ...buttonStyles.icon, inactive: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PTZ 버튼 섹션 */}
        {activeSection === 'ptz-buttons' && (
          <div className="space-y-8">
            {/* 기본 PTZ 버튼 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 PTZ 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getPTZButtonClassName()}>
                      <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZButtonClassName } from '@/components/shared/styles';

<button className={getPTZButtonClassName()}>
  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZButtonClassName } from '@/components/shared/styles';\n\n<button className={getPTZButtonClassName()}>\n  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.base}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          base: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.default}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.active}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          active: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 활성 PTZ 버튼 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">활성 PTZ 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <button className={getPTZButtonClassName(true)}>
                      <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZButtonClassName } from '@/components/shared/styles';

<button className={getPTZButtonClassName(true)}>
  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZButtonClassName } from '@/components/shared/styles';\n\n<button className={getPTZButtonClassName(true)}>\n  <Icon icon="mdi:chevron-up" className="w-5 h-5 mx-auto" />\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.base}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          base: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.default}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.active}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          active: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PTZ 프리셋 버튼 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">PTZ 프리셋 버튼</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 flex gap-2">
                    <button className={getPTZPresetButtonClassName()}>
                      1
                    </button>
                    <button className={getPTZPresetButtonClassName(true)}>
                      2
                    </button>
                    <button className={getPTZPresetButtonClassName()}>
                      3
                    </button>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getPTZPresetButtonClassName } from '@/components/shared/styles';

<button className={getPTZPresetButtonClassName()}>
  1
</button>
<button className={getPTZPresetButtonClassName(true)}>
  2
</button>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getPTZPresetButtonClassName } from '@/components/shared/styles';\n\n<button className={getPTZPresetButtonClassName()}>\n  1\n</button>\n<button className={getPTZPresetButtonClassName(true)}>\n  2\n</button>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집 (Preset)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Preset Base</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.preset.base}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          preset: { ...ptzButtonStyles.preset, base: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Preset Default</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.preset.default}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          preset: { ...ptzButtonStyles.preset, default: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Preset Active</label>
                      <input
                        type="text"
                        value={ptzButtonStyles.preset.active}
                        onChange={(e) => setPtzButtonStyles({
                          ...ptzButtonStyles,
                          preset: { ...ptzButtonStyles.preset, active: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 카드 섹션 */}
        {activeSection === 'cards' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 카드</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCardClassName()}>
                      <h3 className="text-white font-semibold mb-2">카드 제목</h3>
                      <p className="text-gray-400 text-sm">카드 내용입니다.</p>
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCardClassName } from '@/components/shared/styles';

<div className={getCardClassName()}>
  카드 내용
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCardClassName } from '@/components/shared/styles';\n\n<div className={getCardClassName()}>\n  카드 내용\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={cardStyles.default}
                        onChange={(e) => setCardStyles({
                          ...cardStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Compact</label>
                      <input
                        type="text"
                        value={cardStyles.compact}
                        onChange={(e) => setCardStyles({
                          ...cardStyles,
                          compact: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 입력 필드 섹션 */}
        {activeSection === 'inputs' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 입력 필드</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="입력하세요..."
                      className={getInputClassName()}
                    />
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getInputClassName } from '@/components/shared/styles';

<input 
  type="text" 
  className={getInputClassName()}
  placeholder="입력하세요..."
/>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getInputClassName } from '@/components/shared/styles';\n\n<input \n  type="text" \n  className={getInputClassName()}\n  placeholder="입력하세요..."\n/>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={inputStyles.default}
                        onChange={(e) => setInputStyles({
                          ...inputStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CCTV 아이콘 섹션 */}
        {activeSection === 'cctv-icons' && (
          <div className="space-y-8">
            {/* 기본 (Gray) CCTV 아이콘 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">기본 CCTV 아이콘 (Gray)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCCTVIconClassName('default')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVIconClassName } from '@/components/shared/styles';

<div className={getCCTVIconClassName('default')}>
  <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVIconClassName } from '@/components/shared/styles';\n\n<div className={getCCTVIconClassName('default')}>\n  <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={cctvIconStyles.default}
                        onChange={(e) => setCctvIconStyles({
                          ...cctvIconStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={cctvIconStyles.active}
                        onChange={(e) => setCctvIconStyles({
                          ...cctvIconStyles,
                          active: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tracking</label>
                      <input
                        type="text"
                        value={cctvIconStyles.tracking}
                        onChange={(e) => setCctvIconStyles({
                          ...cctvIconStyles,
                          tracking: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Warning</label>
                      <input
                        type="text"
                        value={cctvIconStyles.warning}
                        onChange={(e) => setCctvIconStyles({
                          ...cctvIconStyles,
                          warning: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CCTV 라벨 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">CCTV 라벨</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 relative">
                    <div className={getCCTVIconClassName('default')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className={getCCTVLabelClassName('default')}>
                      CCTV-7
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVLabelClassName } from '@/components/shared/styles';

<div className={getCCTVLabelClassName('default')}>
  CCTV-7
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVLabelClassName } from '@/components/shared/styles';\n\n<div className={getCCTVLabelClassName('default')}>\n  CCTV-7\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-4 text-gray-400">스타일 편집</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Base</label>
                      <input
                        type="text"
                        value={cctvLabelStyles.base}
                        onChange={(e) => setCctvLabelStyles({
                          ...cctvLabelStyles,
                          base: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Default</label>
                      <input
                        type="text"
                        value={cctvLabelStyles.default}
                        onChange={(e) => setCctvLabelStyles({
                          ...cctvLabelStyles,
                          default: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Active</label>
                      <input
                        type="text"
                        value={cctvLabelStyles.active}
                        onChange={(e) => setCctvLabelStyles({
                          ...cctvLabelStyles,
                          active: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Tracking</label>
                      <input
                        type="text"
                        value={cctvLabelStyles.tracking}
                        onChange={(e) => setCctvLabelStyles({
                          ...cctvLabelStyles,
                          tracking: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Warning</label>
                      <input
                        type="text"
                        value={cctvLabelStyles.warning}
                        onChange={(e) => setCctvLabelStyles({
                          ...cctvLabelStyles,
                          warning: e.target.value
                        })}
                        className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] text-white text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CCTV 뱃지 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">CCTV 뱃지 (클러스터)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 relative inline-block">
                    <div className={getCCTVIconClassName('default')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className={`${getCCTVBadgeClassName('default')} absolute -top-[18px] -right-[18px]`}>
                      3
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVBadgeClassName } from '@/components/shared/styles';

<div className="relative">
  <div className={getCCTVIconClassName('default')}>
    <Icon icon="mdi:cctv" />
  </div>
  <div className={\`\${getCCTVBadgeClassName('default')} absolute -top-[18px] -right-[18px]\`}>
    3
  </div>
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVBadgeClassName, getCCTVIconClassName } from '@/components/shared/styles';\n\n<div className="relative">\n  <div className={getCCTVIconClassName('default')}>\n    <Icon icon="mdi:cctv" />\n  </div>\n  <div className={\`\${getCCTVBadgeClassName('default')} absolute -top-[18px] -right-[18px]\`}>\n    3\n  </div>\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: 클러스터 뱃지 (여러 CCTV 표시)</p>
                    <p className="text-xs mt-1">Variant: default, tracking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CCTV 각도 (시야각) */}
            <div>
              <h2 className="text-xl font-semibold mb-4">CCTV 각도 (시야각)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4 relative" style={{ width: '120px', height: '120px' }}>
                    <div className={getCCTVIconClassName('default')} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className={getCCTVViewAngleClassName()} style={{ width: '120px', height: '120px', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 90 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" className="absolute top-0 left-0">
                        <path
                          d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
                          fill="rgba(59, 130, 246, 0.2)"
                          stroke="rgba(59, 130, 246, 0.6)"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVViewAngleClassName } from '@/components/shared/styles';

<div 
  className={getCCTVViewAngleClassName()}
  style={{ 
    width: '120px', 
    height: '120px', 
    left: '50%', 
    top: '50%', 
    transform: 'translate(-50%, -50%)',
    zIndex: 90 
  }}
>
  <svg width="120" height="120" viewBox="0 0 120 120" className="absolute top-0 left-0">
    <path
      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"
      fill="rgba(59, 130, 246, 0.2)"
      stroke="rgba(59, 130, 246, 0.6)"
      strokeWidth="2"
    />
  </svg>
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVViewAngleClassName } from '@/components/shared/styles';\n\n<div \n  className={getCCTVViewAngleClassName()}\n  style={{ \n    width: '120px', \n    height: '120px', \n    left: '50%', \n    top: '50%', \n    transform: 'translate(-50%, -50%)',\n    zIndex: 90 \n  }}\n>\n  <svg width="120" height="120" viewBox="0 0 120 120" className="absolute top-0 left-0">\n    <path\n      d="M 60 60 L 60 10 A 50 50 0 0 1 110 60 Z"\n      fill="rgba(59, 130, 246, 0.2)"\n      stroke="rgba(59, 130, 246, 0.6)"\n      strokeWidth="2"\n    />\n  </svg>\n</div>`)}
                      className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                    >
                      코드 복사
                    </button>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: CCTV 시야각 표시</p>
                    <p className="text-xs mt-1">SVG는 별도로 구현 필요</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 컬러 팔레트 섹션 */}
        {activeSection === 'colors' && (
          <div className="space-y-8">
            {/* 배경 컬러 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">배경 컬러</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colorPalette.background).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div 
                      className="w-full h-20 rounded mb-2"
                      style={{ backgroundColor: value }}
                    />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 텍스트 컬러 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">텍스트 컬러</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colorPalette.text).map(([key, value]) => {
                  const bgColor = value === 'white' ? '#ffffff' : '#1a1a1a';
                  const textColorClass = value === 'white' ? 'text-white' : value === 'gray-300' ? 'text-gray-300' : value === 'gray-400' ? 'text-gray-400' : value === 'gray-500' ? 'text-gray-500' : 'text-gray-600';
                  return (
                    <div key={key} className={getCardClassName()}>
                      <div className="w-full h-20 rounded mb-2 bg-[#1a1a1a] flex items-center justify-center border border-[#31353a]">
                        <span className={`${textColorClass} text-sm font-semibold`}>
                          샘플 텍스트
                        </span>
                      </div>
                      <div className="text-sm">
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono">{value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 액센트 컬러 - Blue */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Blue</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.blue).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액센트 컬러 - Red */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Red</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.red).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액센트 컬러 - Yellow */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Yellow</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.yellow).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액센트 컬러 - Green */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Green</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.green).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액센트 컬러 - Purple */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Purple</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.purple).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 액센트 컬러 - Indigo */}
            <div>
              <h2 className="text-xl font-semibold mb-4">액센트 컬러 - Indigo</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(colorPalette.accent.indigo).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className={`w-full h-20 rounded mb-2 bg-${value}`} />
                    <div className="text-sm">
                      <div className="text-white font-semibold mb-1">{key}</div>
                      <div className="text-gray-400 text-xs font-mono">{value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 폰트 섹션 */}
        {activeSection === 'fonts' && (
          <div className="space-y-8">
            {/* 폰트 사이즈 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">폰트 사이즈</h2>
              <div className="space-y-4">
                {Object.entries(fontSizes).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono mb-2">{value}</div>
                        <div className={`${value} text-white`}>
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 폰트 웨이트 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">폰트 웨이트</h2>
              <div className="space-y-4">
                {Object.entries(fontWeights).map(([key, value]) => (
                  <div key={key} className={getCardClassName()}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-semibold mb-1">{key}</div>
                        <div className="text-gray-400 text-xs font-mono mb-2">{value}</div>
                        <div className={`${value} text-white text-lg`}>
                          The quick brown fox jumps over the lazy dog
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 폰트 조합 예시 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">폰트 조합 예시</h2>
              <div className={getCardClassName()}>
                <div className="space-y-3">
                  <div className={`${fontSizes.xs} ${fontWeights.normal} text-white`}>
                    Extra Small (xs) - Normal Weight
                  </div>
                  <div className={`${fontSizes.sm} ${fontWeights.medium} text-white`}>
                    Small (sm) - Medium Weight
                  </div>
                  <div className={`${fontSizes.base} ${fontWeights.semibold} text-white`}>
                    Base (base) - Semibold Weight
                  </div>
                  <div className={`${fontSizes.lg} ${fontWeights.bold} text-white`}>
                    Large (lg) - Bold Weight
                  </div>
                  <div className={`${fontSizes.xl} ${fontWeights.bold} text-white`}>
                    Extra Large (xl) - Bold Weight
                  </div>
                  <div className={`${fontSizes['2xl']} ${fontWeights.bold} text-white`}>
                    2XL (2xl) - Bold Weight
                  </div>
                  <div className={`${fontSizes['3xl']} ${fontWeights.bold} text-white`}>
                    3XL (3xl) - Bold Weight
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

