import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LandingPage2.module.css';

const PAGES = [
  { id: 'cover', key: 'cover' },
  { id: 'overview', key: 'overview' },
  { id: 'v1', key: 'v1' },
  { id: 'features', key: 'features' },
  { id: 'voice', key: 'voice' },
  { id: 'ai', key: 'ai' },
  { id: 'nui', key: 'nui' },
  { id: 'platform', key: 'platform' },
  { id: 'tech', key: 'tech' },
  { id: 'timeline', key: 'timeline' },
  { id: 'outcomes', key: 'outcomes' },
  { id: 'cta', key: 'cta' },
];

const LandingPage2 = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 페이지 마운트 시 body 스크롤 비활성화
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const scrollToPage = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, PAGES.length - 1));
    setCurrentPage(clamped);
    pageRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // 스페이스 키로 다음 페이지
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.shiftKey) {
          scrollToPage(currentPage - 1);
        } else {
          scrollToPage(currentPage + 1);
        }
      }
      if (e.code === 'ArrowDown' || e.code === 'PageDown') {
        e.preventDefault();
        scrollToPage(currentPage + 1);
      }
      if (e.code === 'ArrowUp' || e.code === 'PageUp') {
        e.preventDefault();
        scrollToPage(currentPage - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, scrollToPage]);

  // 스크롤 시 현재 페이지 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportCenter = scrollTop + window.innerHeight / 2;

      for (let i = 0; i < PAGES.length; i++) {
        const page = pageRefs.current[i];
        if (page) {
          const { offsetTop, offsetHeight } = page;
          const pageCenter = offsetTop + offsetHeight / 2;
          if (viewportCenter >= offsetTop && viewportCenter < offsetTop + offsetHeight) {
            setCurrentPage(i);
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div ref={containerRef} className={styles.scrollContainer}>
        {/* Cover */}
        <div
          ref={(el) => (pageRefs.current[0] = el)}
          className={`${styles.page} ${styles.cover} ${currentPage === 0 ? styles.active : styles.blurred}`}
        >
          <div className={styles.subtitle}>Capstone Design 2025</div>
          <h1 className={styles.coverTitle}>ON-it v2</h1>
          <p className={styles.tagline}>AI 기반 업무 협업 플랫폼의 진화</p>
          <div className={styles.team}>Team 1on-Musk</div>
          <div className={styles.teamName}>김민재 외 3명</div>
        </div>

        {/* 01 Overview */}
        <div
          ref={(el) => (pageRefs.current[1] = el)}
          className={`${styles.page} ${currentPage === 1 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>01 / Overview</div>
          <h2 className={styles.pageTitle}>프로젝트 소개</h2>
          <p className={styles.paragraph}>
            <span className={styles.highlight}>ON-it</span>은 팀 업무 협업을 돕는 AI 기반 플랫폼입니다.
            v1에서 웹 기반 협업 도구를 구축했고, <span className={styles.highlight}>v2</span>에서는
            더 나은 사용자 경험과 다양한 플랫폼 지원을 목표로 합니다.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>3</div>
              <div className={styles.statLabel}>신규 핵심 기능</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>4</div>
              <div className={styles.statLabel}>지원 플랫폼</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>200K+</div>
              <div className={styles.statLabel}>컨텍스트 처리</div>
            </div>
          </div>
        </div>

        {/* 02 ON-it v1 */}
        <div
          ref={(el) => (pageRefs.current[2] = el)}
          className={`${styles.page} ${currentPage === 2 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>02 / ON-it v1</div>
          <h2 className={styles.pageTitle}>현재 구현 상황</h2>
          <p className={styles.paragraph}>ON-it v1에서 다음 기능을 구현했습니다:</p>
          <ul className={styles.featureList}>
            <li>웹 기반 실시간 협업 플랫폼</li>
            <li>AI 클러스터링을 활용한 문서 분류</li>
            <li>Java 기반 백엔드 시스템</li>
            <li>JavaScript 기반 프론트엔드</li>
            <li>팀 프로젝트 관리 기능</li>
          </ul>
          <div className={styles.techTags}>
            <span className={styles.techTag}>Java</span>
            <span className={styles.techTag}>JavaScript</span>
            <span className={styles.techTag}>Python</span>
            <span className={styles.techTag}>AI Clustering</span>
          </div>
        </div>

        {/* 03 신규 핵심 기능 */}
        <div
          ref={(el) => (pageRefs.current[3] = el)}
          className={`${styles.page} ${currentPage === 3 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>03 / ON-it v2 Features</div>
          <h2 className={styles.pageTitle}>신규 핵심 기능 3가지</h2>
          <div className={styles.grid3}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🎙️</div>
              <h3 className={styles.cardTitle}>음성 채팅</h3>
              <p className={styles.cardDesc}>실시간 음성 기반 커뮤니케이션</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>🤖</div>
              <h3 className={styles.cardTitle}>AI 에이전트</h3>
              <p className={styles.cardDesc}>아이디어 생성 및 문서 정리</p>
            </div>
            <div className={styles.card}>
              <div className={styles.cardIcon}>👋</div>
              <h3 className={styles.cardTitle}>NUI (MediaPipe)</h3>
              <p className={styles.cardDesc}>제스처 기반 자연스러운 인터페이스</p>
            </div>
          </div>
        </div>

        {/* 03-1 Voice Chat */}
        <div
          ref={(el) => (pageRefs.current[4] = el)}
          className={`${styles.page} ${currentPage === 4 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>03-1 / Voice Chat</div>
          <h2 className={styles.pageTitle}>음성 채팅 기능</h2>
          <p className={styles.paragraph}>
            팀원들과 실시간으로 음성으로 소통할 수 있는 기능을 추가합니다.
            텍스트 입력의 번거로움 없이 빠른 의사소통이 가능합니다.
          </p>
          <ul className={styles.featureList}>
            <li>WebRTC 기반 실시간 음성 통화</li>
            <li>음성-텍스트 변환 (STT) 지원</li>
            <li>노이즈 제거 및 음질 향상</li>
            <li>다중 참여자 음성 채널</li>
          </ul>
        </div>

        {/* 03-2 AI Agent */}
        <div
          ref={(el) => (pageRefs.current[5] = el)}
          className={`${styles.page} ${currentPage === 5 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>03-2 / AI Agent</div>
          <h2 className={styles.pageTitle}>AI 에이전트 기능</h2>
          <p className={styles.paragraph}>
            <span className={styles.highlight}>Kimi AI</span>를 활용하여 업무 생산성을 높이는
            지능형 에이전트 기능을 제공합니다.
          </p>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>💡 아이디어 생성</h3>
              <p className={styles.cardDesc}>브레인스토밍 세션 지원, 프로젝트 아이디어 제안, 트렌드 분석 기반 인사이트 제공</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📝 문서 정리</h3>
              <p className={styles.cardDesc}>회의록 자동 요약, 액션 아이템 추출, 문서 자동 분류 및 태깅</p>
            </div>
          </div>
        </div>

        {/* 03-3 NUI */}
        <div
          ref={(el) => (pageRefs.current[6] = el)}
          className={`${styles.page} ${currentPage === 6 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>03-3 / NUI</div>
          <h2 className={styles.pageTitle}>NUI (Natural User Interface)</h2>
          <p className={styles.paragraph}>
            <span className={styles.highlight}>MediaPipe</span>를 활용하여
            손동작으로 앱을 제어하는 직관적인 인터페이스를 구현합니다.
          </p>
          <ul className={styles.featureList}>
            <li>손동작 인식 기반 제스처 컨트롤</li>
            <li>프레젠테이션 모드 (슬라이드 넘기기)</li>
            <li>3D 공간에서의 문서 조작</li>
            <li>터치 없이 빠른 명령 실행</li>
          </ul>
        </div>

        {/* 04 Platform */}
        <div
          ref={(el) => (pageRefs.current[7] = el)}
          className={`${styles.page} ${currentPage === 7 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>04 / Platform</div>
          <h2 className={styles.pageTitle}>플랫폼 확장</h2>
          <p className={styles.paragraph}>
            웹에서 <span className={styles.highlight}>네이티브 앱</span>으로 확장하여 어디서나 ON-it을 사용할 수 있습니다.
          </p>
          <div className={styles.platforms}>
            <div className={styles.platform}>
              <div className={styles.platformIcon}>📱</div>
              <h3 className={styles.platformTitle}>Android</h3>
              <p className={styles.platformDesc}>Kotlin + Jetpack Compose</p>
            </div>
            <div className={styles.platform}>
              <div className={styles.platformIcon}>🍎</div>
              <h3 className={styles.platformTitle}>iOS</h3>
              <p className={styles.platformDesc}>Swift + SwiftUI</p>
            </div>
            <div className={styles.platform}>
              <div className={styles.platformIcon}>💻</div>
              <h3 className={styles.platformTitle}>Windows</h3>
              <p className={styles.platformDesc}>Electron / Tauri</p>
            </div>
            <div className={styles.platform}>
              <div className={styles.platformIcon}>🖥️</div>
              <h3 className={styles.platformTitle}>Mac</h3>
              <p className={styles.platformDesc}>SwiftUI / Electron</p>
            </div>
          </div>
        </div>

        {/* 05 Tech Stack */}
        <div
          ref={(el) => (pageRefs.current[8] = el)}
          className={`${styles.page} ${currentPage === 8 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>05 / Tech Stack</div>
          <h2 className={styles.pageTitle}>기술 스택</h2>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🎨 Frontend</h3>
              <p className={styles.cardDesc}>React Native (모바일), React / Next.js (웹), SwiftUI (iOS), Jetpack Compose (Android)</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>⚙️ Backend</h3>
              <p className={styles.cardDesc}>Spring Boot, WebSocket, Redis, PostgreSQL</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🤖 AI</h3>
              <p className={styles.cardDesc}>Kimi API, MediaPipe, Python ML Pipeline</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>☁️ Infrastructure</h3>
              <p className={styles.cardDesc}>AWS / GCP, Docker, Kubernetes, CI/CD</p>
            </div>
          </div>
        </div>

        {/* 06 Timeline */}
        <div
          ref={(el) => (pageRefs.current[9] = el)}
          className={`${styles.page} ${currentPage === 9 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>06 / Timeline</div>
          <h2 className={styles.pageTitle}>개발 일정</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineItem}>
              <div className={styles.timelinePhase}>Phase 1</div>
              <div className={styles.timelineContent}>
                <h4>설계 및 아키텍처 (4주)</h4>
                <p>API 설계, DB 스키마, UI/UX 디자인 시스템 구축</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelinePhase}>Phase 2</div>
              <div className={styles.timelineContent}>
                <h4>핵심 기능 개발 (8주)</h4>
                <p>음성 채팅, AI 에이전트, NUI 구현</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelinePhase}>Phase 3</div>
              <div className={styles.timelineContent}>
                <h4>플랫폼 확장 (6주)</h4>
                <p>iOS/Android/데스크톱 앱 개발 및 최적화</p>
              </div>
            </div>
            <div className={styles.timelineItem}>
              <div className={styles.timelinePhase}>Phase 4</div>
              <div className={styles.timelineContent}>
                <h4>테스트 및 배포 (4주)</h4>
                <p>통합 테스트, 버그 수정, 스토어 배포</p>
              </div>
            </div>
          </div>
        </div>

        {/* 07 Outcomes */}
        <div
          ref={(el) => (pageRefs.current[10] = el)}
          className={`${styles.page} ${currentPage === 10 ? styles.active : styles.blurred}`}
        >
          <div className={styles.sectionNum}>07 / Outcomes</div>
          <h2 className={styles.pageTitle}>기대 성과</h2>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📈 생산성 향상</h3>
              <p className={styles.cardDesc}>AI 에이전트를 통한 자동화로 회의 시간 30% 단축, 문서 정리 시간 50% 감소</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🌍 접근성 확대</h3>
              <p className={styles.cardDesc}>4개 플랫폼 지원으로 사용자 접근성 확대, 모바일 사용률 60% 증가 목표</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>🎯 UX 혁신</h3>
              <p className={styles.cardDesc}>NUI 도입으로 새로운 인터랙션 패턴 제시, 직관적인 사용자 경험 제공</p>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>📱 기술 역량</h3>
              <p className={styles.cardDesc}>풀스택 + AI + 크로스플랫폼 개발 역량 확보</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          ref={(el) => (pageRefs.current[11] = el)}
          className={`${styles.page} ${styles.finalCta} ${currentPage === 11 ? styles.active : styles.blurred}`}
        >
          <h2 className={styles.ctaTitle}>ON-it v2</h2>
          <p className={styles.ctaTagline}>
            언제 어디서나, 음성과 제스처로, AI와 함께하는<br />새로운 협업의 시작
          </p>
          <div className={styles.ctaStats}>
            <div className={styles.stat}>
              <div className={styles.ctaStatText}>감사합니다</div>
              <div className={styles.statLabel}>Q&A</div>
            </div>
          </div>
        </div>
      </div>

      {/* 페이지 인디케이터 */}
      <div className={styles.pageIndicator}>
        <span className={styles.pageCounter}>{currentPage + 1} / {PAGES.length}</span>
        <span className={styles.hint}>스페이스: 다음 페이지</span>
      </div>

      {/* 페이지 네비게이션 도트 */}
      <div className={styles.navDots}>
        {PAGES.map((_, index) => (
          <button
            key={index}
            className={`${styles.navDot} ${currentPage === index ? styles.navDotActive : ''}`}
            onClick={() => scrollToPage(index)}
            aria-label={`페이지 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage2;
