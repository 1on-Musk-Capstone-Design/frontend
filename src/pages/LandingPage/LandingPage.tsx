import { useEffect, useRef, useState } from 'react';
import styles from './LandingPage.module.css';
import { ArrowRight, Check, Sparkles, Users, MessageSquare, Layers, Zap, ChevronDown, Infinity, Globe, Shield, Clock, TrendingUp, HelpCircle, Star, Code, Database, GitBranch, Rocket, CheckCircle2, Loader } from 'lucide-react';

const LandingPage = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);

  // 랜딩 페이지에서 스크롤 활성화
  useEffect(() => {
    // 스크롤 활성화
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    
    const originalHtmlOverflow = html.style.overflow;
    const originalBodyOverflow = body.style.overflow;
    const originalHtmlHeight = html.style.height;
    const originalBodyHeight = body.style.height;
    const originalRootHeight = root ? root.style.height : '';
    const originalRootOverflow = root ? root.style.overflow : '';
    
    html.style.overflow = 'auto';
    body.style.overflow = 'auto';
    html.style.height = 'auto';
    body.style.height = 'auto';
    if (root) {
      root.style.height = 'auto';
      root.style.overflow = 'auto';
    }

    return () => {
      // 원래 상태로 복구
      html.style.overflow = originalHtmlOverflow;
      body.style.overflow = originalBodyOverflow;
      html.style.height = originalHtmlHeight;
      body.style.height = originalBodyHeight;
      if (root) {
        root.style.height = originalRootHeight;
        root.style.overflow = originalRootOverflow;
      }
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollPosition = window.scrollY + window.innerHeight / 3;
          
          sectionsRef.current.forEach((section, index) => {
            if (section) {
              const { offsetTop, offsetHeight } = section;
              if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                setCurrentSection(index);
              }
            }
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // 초기 실행

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (index: number) => {
    sectionsRef.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.landingPage}>
      {/* Hero Section */}
      <section 
        ref={(el) => (sectionsRef.current[0] = el)}
        className={styles.heroSection}
      >
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.heroBadge}>
              <Sparkles size={16} />
              <span>무한 캔버스 협업 플랫폼</span>
            </div>
            <h1 className={styles.heroTitle}>
              아이디어를 자유롭게
              <br />
              <span className={styles.heroTitleAccent}>함께 그려보세요</span>
            </h1>
            <p className={styles.heroDescription}>
              실시간 협업이 가능한 무한 캔버스에서 팀원들과 함께 아이디어를 공유하고,
              <br />
              클러스터링과 채팅 기능으로 더욱 효율적으로 작업하세요.
            </p>
            <div className={styles.heroButtons}>
              <a 
                href="https://on-it.kro.kr/" 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.primaryButton}
              >
                체험해보기
                <ArrowRight size={20} />
              </a>
              <button 
                onClick={() => scrollToSection(1)}
                className={styles.secondaryButton}
              >
                더 알아보기
              </button>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>∞</div>
                <div className={styles.statLabel}>무한 캔버스</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>실시간</div>
                <div className={styles.statLabel}>협업 지원</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statNumber}>AI</div>
                <div className={styles.statLabel}>클러스터링</div>
              </div>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.canvasPreview}>
              <div className={styles.canvasHeader}>
                <div className={styles.canvasHeaderLeft}>
                  <div className={styles.canvasLogo}>ON-IT</div>
                  <div className={styles.canvasProjectName}>새 프로젝트</div>
                </div>
                <div className={styles.canvasHeaderRight}>
                  <div className={styles.canvasAvatar}>U</div>
                  <div className={styles.canvasAvatar}>T</div>
                  <div className={styles.canvasAvatar}>+2</div>
                </div>
              </div>
              <div className={styles.canvasArea}>
                <div className={styles.canvasGrid}></div>
                <div className={styles.floatingCard} style={{ top: '15%', left: '10%' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardDot}></div>
                    <span className={styles.cardTitle}>프로젝트 아이디어</span>
                  </div>
                  <div className={styles.cardText}>무한 캔버스로 자유롭게 아이디어를 표현하세요</div>
                </div>
                <div className={styles.floatingCard} style={{ top: '35%', right: '15%' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardDot}></div>
                    <span className={styles.cardTitle}>팀 협업</span>
                  </div>
                  <div className={styles.cardText}>실시간으로 함께 작업하고 소통하세요</div>
                </div>
                <div className={styles.floatingCard} style={{ bottom: '20%', left: '25%' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardDot}></div>
                    <span className={styles.cardTitle}>AI 클러스터링</span>
                  </div>
                  <div className={styles.cardText}>관련 아이디어를 자동으로 그룹화합니다</div>
                </div>
                <div className={styles.floatingCard} style={{ top: '55%', left: '50%' }}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardDot}></div>
                    <span className={styles.cardTitle}>채팅 기능</span>
                  </div>
                  <div className={styles.cardText}>캔버스에서 바로 대화하세요</div>
                </div>
                <div className={styles.canvasConnection}></div>
              </div>
              <div className={styles.canvasSidebar}>
                <div className={styles.sidebarItem}>
                  <MessageSquare size={18} />
                  <span>채팅</span>
                </div>
                <div className={styles.sidebarItem}>
                  <Layers size={18} />
                  <span>클러스터</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.scrollIndicator} onClick={() => scrollToSection(1)}>
          <ChevronDown size={24} />
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={(el) => (sectionsRef.current[1] = el)}
        className={styles.featuresSection}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>주요 기능</h2>
            <p className={styles.sectionDescription}>
              강력한 협업 도구로 팀의 생산성을 높이세요
            </p>
          </div>

          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Layers size={32} />
              </div>
              <h3 className={styles.featureTitle}>무한 캔버스</h3>
              <p className={styles.featureDescription}>
                제한 없는 공간에서 자유롭게 아이디어를 펼쳐보세요. 
                드래그, 줌, 패닝으로 원하는 대로 탐색할 수 있습니다.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Users size={32} />
              </div>
              <h3 className={styles.featureTitle}>실시간 협업</h3>
              <p className={styles.featureDescription}>
                여러 사용자가 동시에 작업할 수 있습니다. 
                실시간으로 변경사항이 반영되어 팀원들과 즉시 소통하세요.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Zap size={32} />
              </div>
              <h3 className={styles.featureTitle}>자동 클러스터링</h3>
              <p className={styles.featureDescription}>
                관련된 아이디어를 자동으로 그룹화하여 
                더 체계적으로 관리할 수 있습니다.
              </p>
            </div>

            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <MessageSquare size={32} />
              </div>
              <h3 className={styles.featureTitle}>실시간 채팅</h3>
              <p className={styles.featureDescription}>
                캔버스에서 바로 대화할 수 있습니다. 
                아이디어를 공유하고 피드백을 주고받으세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section 
        ref={(el) => (sectionsRef.current[2] = el)}
        className={styles.showcaseSection}
      >
        <div className={styles.container}>
          <div className={styles.showcaseItem}>
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseBadge}>핵심 기능 1</div>
              <h2 className={styles.showcaseTitle}>무한 확장 가능한 캔버스</h2>
              <p className={styles.showcaseDescription}>
                전통적인 화이트보드의 한계를 뛰어넘는 무한 캔버스에서 
                아이디어를 자유롭게 배치하고 확장하세요. 
                줌 인/아웃과 패닝으로 원하는 만큼 탐색할 수 있습니다.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={20} />
                  <span>무제한 캔버스 공간</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>부드러운 줌 및 패닝</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>미니맵으로 전체 보기</span>
                </li>
              </ul>
            </div>
            <div className={styles.showcaseVisual}>
              <div className={styles.screenMockup}>
                <div className={styles.screenHeader}>
                  <div className={styles.screenDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className={styles.screenContent}>
                  <div className={styles.mockCanvas}>
                    <div className={styles.mockGrid}></div>
                    <div className={styles.mockTextCard} style={{ top: '10%', left: '10%' }}>
                      아이디어 1
                    </div>
                    <div className={styles.mockTextCard} style={{ top: '30%', right: '15%' }}>
                      아이디어 2
                    </div>
                    <div className={styles.mockTextCard} style={{ bottom: '20%', left: '25%' }}>
                      아이디어 3
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.arrowIndicator} style={{ top: '50%', right: '-40px' }}>
                <ArrowRight size={24} />
                <span>무한 확장</span>
              </div>
            </div>
          </div>

          <div className={styles.showcaseItem}>
            <div className={styles.showcaseVisual}>
              <div className={styles.screenMockup}>
                <div className={styles.screenHeader}>
                  <div className={styles.screenDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className={styles.screenContent}>
                  <div className={styles.mockCanvas}>
                    <div className={styles.mockGrid}></div>
                    <div className={styles.mockCluster} style={{ top: '20%', left: '20%' }}>
                      <div className={styles.clusterCard}>그룹 1</div>
                      <div className={styles.clusterCard}>그룹 2</div>
                      <div className={styles.clusterCard}>그룹 3</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.arrowIndicator} style={{ top: '50%', left: '-40px' }}>
                <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
                <span>자동 클러스터링</span>
              </div>
            </div>
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseBadge}>핵심 기능 2</div>
              <h2 className={styles.showcaseTitle}>스마트 클러스터링</h2>
              <p className={styles.showcaseDescription}>
                관련된 아이디어를 자동으로 그룹화하여 
                더 체계적으로 관리할 수 있습니다. 
                클러스터링 알고리즘으로 유사한 아이디어를 찾아줍니다.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={20} />
                  <span>자동 그룹화</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>클러스터 드래그 앤 드롭</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>레이아웃 자동 정렬</span>
                </li>
              </ul>
            </div>
          </div>

          <div className={styles.showcaseItem}>
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseBadge}>핵심 기능 3</div>
              <h2 className={styles.showcaseTitle}>실시간 협업</h2>
              <p className={styles.showcaseDescription}>
                여러 사용자가 동시에 작업할 수 있습니다. 
                실시간으로 변경사항이 반영되어 팀원들과 즉시 소통하세요.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={20} />
                  <span>실시간 동기화</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>참가자 커서 표시</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>실시간 채팅</span>
                </li>
              </ul>
            </div>
            <div className={styles.showcaseVisual}>
              <div className={styles.screenMockup}>
                <div className={styles.screenHeader}>
                  <div className={styles.screenDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                <div className={styles.screenContent}>
                  <div className={styles.mockCanvas}>
                    <div className={styles.mockGrid}></div>
                    <div className={styles.mockUserCursor} style={{ top: '30%', left: '40%' }}>
                      <div className={styles.cursorDot}></div>
                      <div className={styles.cursorLabel}>사용자 1</div>
                    </div>
                    <div className={styles.mockUserCursor} style={{ top: '50%', right: '30%' }}>
                      <div className={styles.cursorDot}></div>
                      <div className={styles.cursorLabel}>사용자 2</div>
                    </div>
                    <div className={styles.mockChatPanel}>
                      <div className={styles.chatMessage}>안녕하세요!</div>
                      <div className={styles.chatMessage}>좋은 아이디어네요</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.arrowIndicator} style={{ top: '50%', right: '-40px' }}>
                <ArrowRight size={24} />
                <span>실시간 동기화</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section 
        ref={(el) => (sectionsRef.current[3] = el)}
        className={styles.statsSection}
      >
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Infinity size={32} />
              </div>
              <div className={styles.statNumber}>무한</div>
              <div className={styles.statLabel}>캔버스 공간</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Users size={32} />
              </div>
              <div className={styles.statNumber}>실시간</div>
              <div className={styles.statLabel}>동시 협업</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Zap size={32} />
              </div>
              <div className={styles.statNumber}>자동</div>
              <div className={styles.statLabel}>클러스터링</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <MessageSquare size={32} />
              </div>
              <div className={styles.statNumber}>실시간</div>
              <div className={styles.statLabel}>채팅</div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section 
        ref={(el) => (sectionsRef.current[4] = el)}
        className={styles.useCasesSection}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>이런 분들께 추천합니다</h2>
            <p className={styles.sectionDescription}>
              다양한 팀과 프로젝트에서 활용할 수 있습니다
            </p>
          </div>

          <div className={styles.useCasesGrid}>
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>
                <Code size={40} />
              </div>
              <h3 className={styles.useCaseTitle}>개발 팀</h3>
              <p className={styles.useCaseDescription}>
                프로젝트 기획, 기능 명세, 아키텍처 설계를 
                시각적으로 공유하고 협업하세요.
              </p>
            </div>
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>
                <TrendingUp size={40} />
              </div>
              <h3 className={styles.useCaseTitle}>기획 팀</h3>
              <p className={styles.useCaseDescription}>
                아이디어 브레인스토밍, 로드맵 작성, 
                전략 수립을 한 곳에서 관리하세요.
              </p>
            </div>
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>
                <Users size={40} />
              </div>
              <h3 className={styles.useCaseTitle}>디자인 팀</h3>
              <p className={styles.useCaseDescription}>
                디자인 컨셉, 레이아웃 아이디어, 
                참고 자료를 체계적으로 정리하세요.
              </p>
            </div>
            <div className={styles.useCaseCard}>
              <div className={styles.useCaseIcon}>
                <Globe size={40} />
              </div>
              <h3 className={styles.useCaseTitle}>교육 기관</h3>
              <p className={styles.useCaseDescription}>
                학생들과 함께 아이디어를 공유하고 
                그룹 프로젝트를 효율적으로 진행하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section 
        ref={(el) => (sectionsRef.current[5] = el)}
        className={styles.techSection}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>강력한 기술 스택</h2>
            <p className={styles.sectionDescription}>
              최신 기술로 안정적이고 빠른 경험을 제공합니다
            </p>
          </div>

          <div className={styles.techGrid}>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>
                <Zap size={32} />
              </div>
              <h3 className={styles.techTitle}>실시간 동기화</h3>
              <p className={styles.techDescription}>
                WebSocket 기반의 실시간 통신으로 
                즉각적인 업데이트를 제공합니다.
              </p>
            </div>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>
                <Shield size={32} />
              </div>
              <h3 className={styles.techTitle}>안전한 인증</h3>
              <p className={styles.techDescription}>
                JWT 기반 인증 시스템으로 
                안전하게 데이터를 보호합니다.
              </p>
            </div>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>
                <Database size={32} />
              </div>
              <h3 className={styles.techTitle}>안정적인 저장</h3>
              <p className={styles.techDescription}>
                모든 작업이 자동으로 저장되어 
                데이터 손실 걱정 없이 사용하세요.
              </p>
            </div>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>
                <Clock size={32} />
              </div>
              <h3 className={styles.techTitle}>빠른 성능</h3>
              <p className={styles.techDescription}>
                최적화된 렌더링으로 
                부드럽고 빠른 사용자 경험을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CI/CD Section */}
      <section 
        ref={(el) => (sectionsRef.current[6] = el)}
        className={styles.cicdSection}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>자동화된 CI/CD 파이프라인</h2>
            <p className={styles.sectionDescription}>
              GitHub Actions를 통한 완전 자동화된 빌드 및 배포 시스템
            </p>
          </div>

          <div className={styles.cicdContainer}>
            {/* Frontend CI/CD */}
            <div className={styles.cicdCard}>
              <div className={styles.cicdHeader}>
                <div className={styles.cicdIcon}>
                  <Code size={32} />
                </div>
                <div>
                  <h3 className={styles.cicdTitle}>프론트엔드 CI/CD</h3>
                  <p className={styles.cicdSubtitle}>React + Vite 자동 배포</p>
                </div>
              </div>
              
              <div className={styles.pipelineSteps}>
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <GitBranch size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>코드 커밋 & 푸시</div>
                    <div className={styles.stepDescription}>main 브랜치에 코드 푸시</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <GitBranch size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>코드 체크아웃</div>
                    <div className={styles.stepDescription}>GitHub Actions에서 소스 코드 가져오기</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Loader size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Node.js 환경 설정</div>
                    <div className={styles.stepDescription}>Node.js 18 및 npm 캐시 설정</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Zap size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>의존성 설치</div>
                    <div className={styles.stepDescription}>npm ci로 빠르고 안정적인 설치</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Rocket size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>프로젝트 빌드</div>
                    <div className={styles.stepDescription}>Vite로 최적화된 프로덕션 빌드</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Globe size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>서버 배포</div>
                    <div className={styles.stepDescription}>rsync로 AWS 서버에 자동 배포</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
              </div>
            </div>

            {/* Backend CI/CD */}
            <div className={styles.cicdCard}>
              <div className={styles.cicdHeader}>
                <div className={styles.cicdIcon}>
                  <Database size={32} />
                </div>
                <div>
                  <h3 className={styles.cicdTitle}>백엔드 CI/CD</h3>
                  <p className={styles.cicdSubtitle}>Spring Boot + Gradle 자동 배포</p>
                </div>
              </div>
              
              <div className={styles.pipelineSteps}>
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <GitBranch size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>코드 커밋 & 푸시</div>
                    <div className={styles.stepDescription}>main/develop 브랜치에 코드 푸시</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <GitBranch size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>코드 체크아웃</div>
                    <div className={styles.stepDescription}>GitHub Actions에서 소스 코드 가져오기</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Code size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>JDK 21 설정</div>
                    <div className={styles.stepDescription}>Java 개발 환경 구성</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Zap size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>Gradle 빌드</div>
                    <div className={styles.stepDescription}>의존성 캐시 및 JAR 파일 생성</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <CheckCircle2 size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>테스트 실행</div>
                    <div className={styles.stepDescription}>자동화된 단위 테스트 수행</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Shield size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>SSH 배포</div>
                    <div className={styles.stepDescription}>JAR 파일 및 환경 변수 업로드</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
                
                <div className={styles.pipelineArrow}>
                  <ArrowRight size={20} />
                </div>
                
                <div className={styles.pipelineStep}>
                  <div className={styles.stepIcon}>
                    <Rocket size={20} />
                  </div>
                  <div className={styles.stepContent}>
                    <div className={styles.stepTitle}>애플리케이션 재시작</div>
                    <div className={styles.stepDescription}>헬스 체크 및 자동 재시작</div>
                  </div>
                  <CheckCircle2 size={20} className={styles.stepCheck} />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.cicdBenefits}>
            <div className={styles.benefitItem}>
              <Check size={24} />
              <span>코드 푸시 시 자동 배포</span>
            </div>
            <div className={styles.benefitItem}>
              <Check size={24} />
              <span>빌드 및 테스트 자동화</span>
            </div>
            <div className={styles.benefitItem}>
              <Check size={24} />
              <span>배포 검증 및 롤백 지원</span>
            </div>
            <div className={styles.benefitItem}>
              <Check size={24} />
              <span>안정적인 프로덕션 환경</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section 
        ref={(el) => (sectionsRef.current[7] = el)}
        className={styles.faqSection}
      >
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>자주 묻는 질문</h2>
            <p className={styles.sectionDescription}>
              궁금한 점을 확인해보세요
            </p>
          </div>

          <div className={styles.faqList}>
            <div className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <HelpCircle size={24} />
                <h3>무료로 사용할 수 있나요?</h3>
              </div>
              <div className={styles.faqAnswer}>
                네, 완전히 무료로 사용할 수 있습니다. 추가 비용 없이 모든 기능을 이용하실 수 있습니다.
              </div>
            </div>
            <div className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <HelpCircle size={24} />
                <h3>동시에 몇 명까지 협업할 수 있나요?</h3>
              </div>
              <div className={styles.faqAnswer}>
                제한 없이 여러 명이 동시에 협업할 수 있습니다. 실시간으로 모든 변경사항이 동기화됩니다.
              </div>
            </div>
            <div className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <HelpCircle size={24} />
                <h3>데이터는 어떻게 저장되나요?</h3>
              </div>
              <div className={styles.faqAnswer}>
                모든 작업은 자동으로 저장되며, 클라우드에 안전하게 보관됩니다. 언제든지 접속하여 이어서 작업할 수 있습니다.
              </div>
            </div>
            <div className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <HelpCircle size={24} />
                <h3>모바일에서도 사용할 수 있나요?</h3>
              </div>
              <div className={styles.faqAnswer}>
                현재는 데스크톱과 태블릿에 최적화되어 있으며, 모바일 지원은 준비 중입니다.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={(el) => (sectionsRef.current[8] = el)}
        className={styles.ctaSection}
      >
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <div className={styles.ctaBadge}>
              <Star size={20} />
              <span>무료로 시작하기</span>
            </div>
            <h2 className={styles.ctaTitle}>지금 바로 시작하세요</h2>
            <p className={styles.ctaDescription}>
              무료로 체험해보고 팀의 협업 방식을 혁신하세요
            </p>
            <a 
              href="https://on-it.kro.kr/" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ctaButton}
            >
              무료로 시작하기
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <h3 className={styles.footerTitle}>ON-IT</h3>
              <p className={styles.footerDescription}>
                무한 캔버스 협업 플랫폼으로<br />
                아이디어를 자유롭게 공유하세요
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>제품</h4>
                <a href="#features" className={styles.footerLink}>기능</a>
                <a href="#showcase" className={styles.footerLink}>데모</a>
                <a href="#pricing" className={styles.footerLink}>가격</a>
              </div>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>회사</h4>
                <a href="#about" className={styles.footerLink}>소개</a>
                <a href="#contact" className={styles.footerLink}>문의</a>
                <a href="#blog" className={styles.footerLink}>블로그</a>
              </div>
              <div className={styles.footerColumn}>
                <h4 className={styles.footerColumnTitle}>지원</h4>
                <a href="#faq" className={styles.footerLink}>FAQ</a>
                <a href="#docs" className={styles.footerLink}>문서</a>
                <a href="#support" className={styles.footerLink}>고객지원</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.footerCopyright}>
              © 2024 ON-IT. All rights reserved.
            </p>
            <div className={styles.footerLegal}>
              <a href="#privacy" className={styles.footerLink}>개인정보처리방침</a>
              <a href="#terms" className={styles.footerLink}>이용약관</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Navigation Dots */}
      <div className={styles.navDots}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
          <button
            key={index}
            className={`${styles.navDot} ${currentSection === index ? styles.active : ''}`}
            onClick={() => scrollToSection(index)}
            aria-label={`섹션 ${index + 1}로 이동`}
          />
        ))}
      </div>
    </div>
  );
};

export default LandingPage;

