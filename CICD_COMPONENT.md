# CI/CD 컴포넌트 코드 (복붙 가능)

## 📋 필요한 Import

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Database, 
  GitBranch, 
  Loader, 
  Zap, 
  Rocket, 
  Globe, 
  CheckCircle2, 
  Shield, 
  Check,
  ArrowRight 
} from 'lucide-react';
```

---

## 🎨 CSS 스타일 (LandingPage.module.css에서 추출)

```css
/* 공통 스타일 (필요한 경우) */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.sectionHeader {
  text-align: center;
  margin-bottom: 80px;
}

.sectionTitle {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 16px 0;
  color: #111827;
  letter-spacing: -0.02em;
}

.sectionDescription {
  font-size: 1.25rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.6;
}

/* CI/CD Section */
.cicdSection {
  padding: 120px 40px;
  background: white;
}

.cicdContainer {
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin-top: 60px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
}

.cicdCard {
  background: #f9fafb;
  border: 2px solid #f3f4f6;
  border-radius: 20px;
  padding: 32px;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
}

.cicdCard:hover {
  border-color: #01CD15;
  box-shadow: 0 12px 24px rgba(1, 205, 21, 0.15);
  transform: translateY(-4px);
}

.cicdHeader {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;
}

.cicdIcon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #01CD15 0%, #1e7b0b 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.cicdTitle {
  font-size: 1.375rem;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #111827;
}

.cicdSubtitle {
  font-size: 0.95rem;
  color: #6b7280;
  margin: 0;
}

.pipelineSteps {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  flex: 1;
  padding: 8px 0;
  align-items: flex-start;
  justify-content: center;
}

/* 프론트엔드: 3개 + 3개 두 줄 - 3번째 화살표(인덱스 2) 후 줄바꿈 */
.cicdCard:first-child .pipelineArrow:nth-child(6) {
  flex-basis: 100%;
  width: 100%;
  height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  visibility: hidden;
}

/* 백엔드: 4개 + 3개 두 줄 - 4번째 화살표(인덱스 3) 후 줄바꿈 */
.cicdCard:last-child .pipelineArrow:nth-child(8) {
  flex-basis: 100%;
  width: 100%;
  height: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  visibility: hidden;
}

.pipelineStep {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  background: white;
  border-radius: 12px;
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
  flex-shrink: 0;
  min-width: 160px;
  max-width: 180px;
  text-align: center;
  position: relative;
}

.pipelineStep:hover {
  border-color: #01CD15;
  background: #f0fdf4;
}

.pipelineStep.activeStep {
  border-color: #01CD15;
  background: linear-gradient(135deg, rgba(1, 205, 21, 0.15) 0%, rgba(1, 205, 21, 0.05) 100%);
  box-shadow: 0 4px 16px rgba(1, 205, 21, 0.3);
  transform: scale(1.05);
  animation: pulseStep 0.6s ease-in-out;
}

@keyframes pulseStep {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1.05);
  }
}

.pipelineStep.activeStep .stepIcon {
  background: linear-gradient(135deg, #01CD15 0%, #1e7b0b 100%);
  color: white;
  transform: scale(1.1);
}

.pipelineStep.activeStep .stepTitle {
  color: #01CD15;
  font-weight: 700;
}

.stepIcon {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, rgba(1, 205, 21, 0.1) 0%, rgba(1, 205, 21, 0.05) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #01CD15;
  flex-shrink: 0;
}

.stepIcon svg {
  width: 26px;
  height: 26px;
}

.stepContent {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stepTitle {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 6px 0;
  line-height: 1.3;
}

.stepDescription {
  font-size: 0.8125rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.stepCheck {
  color: #01CD15;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  position: absolute;
  top: 8px;
  right: 8px;
}

.pipelineArrow {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
  margin: 0 8px;
  transition: all 0.3s ease;
}

.pipelineArrow svg {
  width: 20px;
  height: 20px;
}

.pipelineArrow.activeArrow {
  color: #01CD15;
  transform: scale(1.2);
  animation: pulseArrow 0.6s ease-in-out;
}

@keyframes pulseArrow {
  0%, 100% {
    transform: scale(1.2);
  }
  50% {
    transform: scale(1.4);
  }
}

.cicdBenefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-top: 60px;
  padding: 40px;
  background: linear-gradient(135deg, rgba(1, 205, 21, 0.05) 0%, rgba(1, 205, 21, 0.02) 100%);
  border-radius: 16px;
  border: 2px solid rgba(1, 205, 21, 0.1);
}

.benefitItem {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.benefitItem svg {
  color: #01CD15;
  flex-shrink: 0;
}
```

---

## ⚙️ 애니메이션 로직 (useState & useEffect)

```tsx
// 컴포넌트 내부에 추가
const [frontendActiveStep, setFrontendActiveStep] = useState(0);
const [backendActiveStep, setBackendActiveStep] = useState(0);

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
```

---

## 🎨 JSX 컴포넌트 코드

```tsx
{/* CI/CD Section */}
<section className={styles.cicdSection}>
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
```

---

## 📝 전체 독립 컴포넌트 (복붙해서 바로 사용 가능)

```tsx
import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Database, 
  GitBranch, 
  Loader, 
  Zap, 
  Rocket, 
  Globe, 
  CheckCircle2, 
  Shield, 
  Check,
  ArrowRight 
} from 'lucide-react';
import styles from './CICDSection.module.css'; // CSS 파일 경로

const CICDSection = () => {
  const [frontendActiveStep, setFrontendActiveStep] = useState(0);
  const [backendActiveStep, setBackendActiveStep] = useState(0);

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

  return (
    <section className={styles.cicdSection}>
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
  );
};

export default CICDSection;
```

---

## 🎯 사용 방법

1. **CSS 파일 생성**: 위의 CSS 코드를 `CICDSection.module.css` 파일로 저장
2. **컴포넌트 파일 생성**: 위의 전체 독립 컴포넌트 코드를 `CICDSection.tsx` 파일로 저장
3. **필요한 경우 추가 스타일**: `.container`, `.sectionHeader`, `.sectionTitle`, `.sectionDescription` 스타일이 필요하면 추가

---

## ✨ 주요 기능

- **자동 애니메이션**: 2초마다 다음 스텝으로 자동 전환
- **활성화 효과**: 현재 스텝이 강조 표시 (초록색 테두리, 그림자, 스케일)
- **화살표 애니메이션**: 활성 스텝 사이의 화살표가 펄스 효과
- **반응형 디자인**: 모바일에서도 잘 보이도록 flex-wrap 사용
- **호버 효과**: 카드와 스텝에 마우스 오버 시 효과

---

**작성일**: 2024년 12월
**버전**: 1.0

