'use client';

import React, { useState } from 'react';
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
  getCCTVViewAngleClassName
} from '@/components/shared/styles';

export default function ComponentsStylePage() {
  const [activeSection, setActiveSection] = useState<string>('buttons');

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
  ];

  return (
    <div className="h-screen overflow-y-auto bg-[#161719] text-white">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">컴포넌트 스타일 관리</h1>
          <p className="text-gray-400">중복되는 컴포넌트 스타일을 한 곳에서 관리합니다.</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: PTZ 제어 버튼 (기본 상태)</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: PTZ 제어 버튼 (활성/누름 상태)</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: PTZ 프리셋 버튼 (원형)</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: 기본 CCTV 아이콘</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 활성 (Blue) CCTV 아이콘 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">활성 CCTV 아이콘 (Blue)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCCTVIconClassName('active')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-400" />
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVIconClassName } from '@/components/shared/styles';

<div className={getCCTVIconClassName('active')}>
  <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-400" />
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVIconClassName } from '@/components/shared/styles';\n\n<div className={getCCTVIconClassName('active')}>\n  <Icon icon="mdi:cctv" className="w-4 h-4 text-blue-400" />\n</div>`)}
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
                    <p className="text-xs mt-2">사용: 선택된/활성 CCTV 아이콘</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 추적 (Red) CCTV 아이콘 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">추적 CCTV 아이콘 (Red)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCCTVIconClassName('tracking')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-red-400" />
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVIconClassName } from '@/components/shared/styles';

<div className={getCCTVIconClassName('tracking')}>
  <Icon icon="mdi:cctv" className="w-4 h-4 text-red-400" />
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVIconClassName } from '@/components/shared/styles';\n\n<div className={getCCTVIconClassName('tracking')}>\n  <Icon icon="mdi:cctv" className="w-4 h-4 text-red-400" />\n</div>`)}
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
                    <p className="text-xs mt-2">사용: 추적 중인 CCTV 아이콘</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 경고 (Yellow) CCTV 아이콘 */}
            <div>
              <h2 className="text-xl font-semibold mb-4">경고 CCTV 아이콘 (Yellow)</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="mb-4">
                    <div className={getCCTVIconClassName('warning')}>
                      <Icon icon="mdi:cctv" className="w-4 h-4 text-yellow-400" />
                    </div>
                  </div>
                  <div className={getCardClassName()}>
                    <pre className="text-xs text-gray-300 overflow-x-auto">
                      <code>{`import { getCCTVIconClassName } from '@/components/shared/styles';

<div className={getCCTVIconClassName('warning')}>
  <Icon icon="mdi:cctv" className="w-4 h-4 text-yellow-400" />
</div>`}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(`import { getCCTVIconClassName } from '@/components/shared/styles';\n\n<div className={getCCTVIconClassName('warning')}>\n  <Icon icon="mdi:cctv" className="w-4 h-4 text-yellow-400" />\n</div>`)}
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
                    <p className="text-xs mt-2">사용: 경고/주의 CCTV 아이콘</p>
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
                  <h3 className="text-sm font-semibold mb-2 text-gray-400">스타일 정보</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>공통 스타일 파일에서 관리됩니다.</p>
                    <p className="text-xs">경로: components/shared/styles.ts</p>
                    <p className="text-xs mt-2">사용: CCTV 이름 라벨</p>
                    <p className="text-xs mt-1">Variant: default, active, tracking, warning</p>
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
      </div>
    </div>
  );
}

