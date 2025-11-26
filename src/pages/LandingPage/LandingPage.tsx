import React, { useEffect, useRef, useState } from 'react';
import styles from './LandingPage.module.css';
import { ArrowRight, Check, Sparkles, Users, MessageSquare, Layers, Zap, ChevronDown, Globe, Shield, Clock, TrendingUp, HelpCircle, Star, Code, Database, GitBranch, Rocket, CheckCircle2, Loader } from 'lucide-react';

const LandingPage = () => {
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const [frontendActiveStep, setFrontendActiveStep] = useState(0);
  const [backendActiveStep, setBackendActiveStep] = useState(0);

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

  // CI/CD 애니메이션
  useEffect(() => {
    const frontendSteps = 6; // 프론트엔드 스텝 수
    const backendSteps = 7; // 백엔드 스텝 수
    
    const frontendInterval = setInterval(() => {
      setFrontendActiveStep((prev) => (prev + 1) % frontendSteps);
    }, 2000);

    const backendInterval = setInterval(() => {
      setBackendActiveStep((prev) => (prev + 1) % backendSteps);
    }, 2000);

    return () => {
      clearInterval(frontendInterval);
      clearInterval(backendInterval);
    };
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
                실시간으로 변경사항이 반영되고, 채팅으로 팀원들과 즉시 소통하세요.
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
              <div className={styles.implementationDetails}>
                <h4 className={styles.implementationTitle}>구현 방법</h4>
                <div className={styles.implementationContent}>
                  <p>
                    <strong>격자 배경 및 좌표 변환:</strong> CSS의 linear-gradient로 무한 확장 가능한 격자 배경을 구현하고, 
                    논리적 좌표계(무한 공간)와 실제 좌표계(픽셀) 간 변환을 위해 변환 행렬을 사용합니다. 
                    줌 레벨(scale)과 오프셋(translate)을 기반으로 <code>실제 좌표 = (논리적 좌표 - offset) × scale</code> 공식을 적용합니다.
                  </p>
                  <p>
                    <strong>성능 최적화:</strong> requestAnimationFrame으로 부드러운 애니메이션을 구현하고, 
                    뷰포트 밖의 요소는 렌더링하지 않는 가시 영역(viewport culling) 기법을 적용하여 
                    수천 개의 아이디어가 있어도 성능 저하 없이 동작합니다.
                  </p>
                </div>
              </div>
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
              <div className={styles.implementationDetails}>
                <h4 className={styles.implementationTitle}>구현 방법</h4>
                <div className={styles.implementationContent}>
                  <p>
                    <strong>텍스트 임베딩 및 벡터화:</strong> SentenceTransformer 모델(all-MiniLM-L6-v2)을 사용하여 
                    각 텍스트를 384차원 벡터로 변환합니다. 이 모델은 문장의 의미를 벡터로 표현하여 
                    유사한 의미를 가진 텍스트들이 벡터 공간에서 가까운 위치에 배치되도록 합니다.
                  </p>
                  <p>
                    <strong>K-Means 클러스터링:</strong> 임베딩된 벡터들을 scikit-learn의 K-Means 알고리즘으로 클러스터링합니다. 
                    유클리드 거리를 계산하여 각 텍스트 벡터와 클러스터 중심점 간의 거리를 측정하고, 
                    거리가 가까운 벡터들을 같은 그룹으로 묶습니다. 각 클러스터의 대표 텍스트는 중심점과 가장 가까운 텍스트로 선택됩니다.
                  </p>
                  <p>
                    <strong>FastAPI 마이크로서비스:</strong> 클러스터링 로직을 독립적인 FastAPI 서버로 분리하여 
                    프론트엔드와 백엔드 간의 느슨한 결합을 구현했습니다. 모델은 서버 시작 시 한 번만 로드하여 
                    메모리 효율성을 높였습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.showcaseItem}>
            <div className={styles.showcaseContent}>
              <div className={styles.showcaseBadge}>핵심 기능 3</div>
              <h2 className={styles.showcaseTitle}>실시간 협업</h2>
              <p className={styles.showcaseDescription}>
                여러 사용자가 동시에 작업할 수 있습니다. 
                실시간으로 변경사항이 반영되고, 채팅으로 팀원들과 즉시 소통하세요.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={20} />
                  <span>실시간 동기화</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>실시간 채팅</span>
                </li>
                <li>
                  <Check size={20} />
                  <span>참가자 알림</span>
                </li>
              </ul>
              <div className={styles.implementationDetails}>
                <h4 className={styles.implementationTitle}>구현 방법</h4>
                <div className={styles.implementationContent}>
                  <p>
                    <strong>WebSocket 및 STOMP 프로토콜:</strong> 실시간 양방향 통신을 위해 WebSocket을 사용하고, 
                    메시징 프로토콜로 STOMP(Simple Text Oriented Messaging Protocol)를 채택했습니다. 
                    SockJS를 통해 WebSocket 연결 실패 시 HTTP 폴링으로 자동 전환되는 폴백 메커니즘을 구현했습니다.
                  </p>
                  <p>
                    <strong>토픽 기반 구독 및 이벤트 동기화:</strong> 각 워크스페이스별로 고유한 토픽을 생성하여 
                    관련된 사용자들만 해당 토픽을 구독하도록 했습니다. 캔버스의 아이디어 생성, 수정, 삭제 및 채팅 메시지를 
                    STOMP 메시지로 브로드캐스트하며, 각 클라이언트는 자신이 발생시킨 이벤트를 제외한 다른 사용자의 이벤트만 수신하여 
                    중복 업데이트를 방지합니다.
                  </p>
                  <p>
                    <strong>연결 관리:</strong> WebSocket 연결이 끊어졌을 때를 대비해 자동 재연결 메커니즘을 구현했습니다. 
                    지수 백오프(exponential backoff) 전략을 사용하여 재연결 시도 간격을 점진적으로 늘려 서버 부하를 줄이고, 
                    각 메시지에 고유한 ID와 타임스탬프를 부여하여 메시지 순서를 보장합니다.
                  </p>
                </div>
              </div>
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
                    <div className={styles.mockTextCard} style={{ top: '20%', left: '15%' }}>
                      아이디어 1
                    </div>
                    <div className={styles.mockTextCard} style={{ top: '40%', right: '20%' }}>
                      아이디어 2
                    </div>
                    <div className={styles.mockChatPanel}>
                      <div className={styles.chatHeader}>
                        <MessageSquare size={16} />
                        <span>채팅</span>
                        <div className={styles.chatBadge}>3</div>
                      </div>
                      <div className={styles.chatMessages}>
                        <div className={styles.chatMessage}>
                          <div className={styles.chatUserName}>김민수</div>
                          <div className={styles.chatText}>안녕하세요! 좋은 아이디어네요</div>
                        </div>
                        <div className={styles.chatMessage}>
                          <div className={styles.chatUserName}>이지은</div>
                          <div className={styles.chatText}>이 부분 더 자세히 설명해주세요</div>
                        </div>
                        <div className={styles.chatMessage}>
                          <div className={styles.chatUserName}>박준호</div>
                          <div className={styles.chatText}>실시간으로 잘 보이네요 👍</div>
                        </div>
                      </div>
                      <div className={styles.chatInput}>
                        <input type="text" placeholder="메시지 입력..." />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.arrowIndicator} style={{ top: '50%', right: '-40px' }}>
                <ArrowRight size={24} />
                <span>실시간 채팅</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Use Cases Section */}
      <section 
        ref={(el) => (sectionsRef.current[3] = el)}
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
        ref={(el) => (sectionsRef.current[4] = el)}
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
        ref={(el) => (sectionsRef.current[5] = el)}
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
                {[
                  { icon: GitBranch, title: '코드 커밋 & 푸시', desc: 'main 브랜치에 코드 푸시' },
                  { icon: GitBranch, title: '코드 체크아웃', desc: 'GitHub Actions에서 소스 코드 가져오기' },
                  { icon: Loader, title: 'Node.js 환경 설정', desc: 'Node.js 18 및 npm 캐시 설정' },
                  { icon: Zap, title: '의존성 설치', desc: 'npm ci로 빠르고 안정적인 설치' },
                  { icon: Rocket, title: '프로젝트 빌드', desc: 'Vite로 최적화된 프로덕션 빌드' },
                  { icon: Globe, title: '서버 배포', desc: 'rsync로 AWS 서버에 자동 배포' },
                ].map((step, index) => (
                  <React.Fragment key={index}>
                    <div 
                      className={`${styles.pipelineStep} ${frontendActiveStep === index ? styles.activeStep : ''}`}
                    >
                      <div className={styles.stepIcon}>
                        <step.icon size={20} />
                      </div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitle}>{step.title}</div>
                        <div className={styles.stepDescription}>{step.desc}</div>
                      </div>
                      <CheckCircle2 size={20} className={styles.stepCheck} />
                    </div>
                    {index < 5 && (
                      <div className={`${styles.pipelineArrow} ${frontendActiveStep === index ? styles.activeArrow : ''}`}>
                        <ArrowRight size={20} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
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
                {[
                  { icon: GitBranch, title: '코드 커밋 & 푸시', desc: 'main/develop 브랜치에 코드 푸시' },
                  { icon: GitBranch, title: '코드 체크아웃', desc: 'GitHub Actions에서 소스 코드 가져오기' },
                  { icon: Code, title: 'JDK 21 설정', desc: 'Java 개발 환경 구성' },
                  { icon: Zap, title: 'Gradle 빌드', desc: '의존성 캐시 및 JAR 파일 생성' },
                  { icon: CheckCircle2, title: '테스트 실행', desc: '자동화된 단위 테스트 수행' },
                  { icon: Shield, title: 'SSH 배포', desc: 'JAR 파일 및 환경 변수 업로드' },
                  { icon: Rocket, title: '애플리케이션 재시작', desc: '헬스 체크 및 자동 재시작' },
                ].map((step, index) => (
                  <React.Fragment key={index}>
                    <div 
                      className={`${styles.pipelineStep} ${backendActiveStep === index ? styles.activeStep : ''}`}
                    >
                      <div className={styles.stepIcon}>
                        <step.icon size={20} />
                      </div>
                      <div className={styles.stepContent}>
                        <div className={styles.stepTitle}>{step.title}</div>
                        <div className={styles.stepDescription}>{step.desc}</div>
                      </div>
                      <CheckCircle2 size={20} className={styles.stepCheck} />
                    </div>
                    {index < 6 && (
                      <div className={`${styles.pipelineArrow} ${backendActiveStep === index ? styles.activeArrow : ''}`}>
                        <ArrowRight size={20} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
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
        ref={(el) => (sectionsRef.current[6] = el)}
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
        ref={(el) => (sectionsRef.current[7] = el)}
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

