# ON-IT 오프닝 씬에 필요한 에셋 및 이미지

## 📦 필수 에셋

### 1. **맥북 3D 모델** (필수)
- **파일 형식**: GLTF (.gltf) 또는 GLB (.glb) - GLB 권장 (단일 파일)
- **위치**: `/public/assets/macbook.glb`
- **요구사항**:
  - 맥북 형태의 3D 모델
  - 텍스처 포함 (선택사항)
  - 폴리곤 수: 5,000-20,000 (성능 고려)
  - 스케일: 실제 크기 기준 (코드에서 0.01로 조정)

**추천 다운로드 사이트:**
- [Sketchfab](https://sketchfab.com) - 무료/유료 모델
- [Poly Haven](https://polyhaven.com/models) - 무료 모델
- [TurboSquid](https://www.turbosquid.com) - 유료 고품질 모델
- [Free3D](https://free3d.com) - 무료 모델

**검색 키워드:**
- "MacBook Pro 3D model"
- "laptop 3D model gltf"
- "MacBook GLB"

**대체 방안:**
- 모델이 없을 경우 코드에서 기본 박스로 대체됨
- 간단한 맥북 형태를 Blender로 직접 제작 가능

---

### 2. **마우스 커서 아이콘** (선택사항)
- **현재**: 이모지(👆) 사용 중
- **대체 옵션**:
  - SVG 아이콘
  - PNG 이미지 (투명 배경)
  - CSS로 커스텀 커서 제작

**위치**: `/public/assets/cursor-icon.svg` 또는 `.png`

**추천 사이트:**
- [Flaticon](https://www.flaticon.com)
- [Icons8](https://icons8.com)
- [Font Awesome](https://fontawesome.com)

---

## 🎨 선택적 에셋

### 3. **로고 이미지** (선택사항)
- **현재**: 텍스트로 "on-it" 표시
- **대체**: 로고 이미지 사용 가능
- **위치**: `/public/assets/on-it-logo.png` 또는 `.svg`

### 4. **배경 텍스처** (선택사항)
- **현재**: 코드로 격자 생성
- **대체**: 고품질 격자 텍스처 이미지
- **위치**: `/public/assets/grid-texture.png`

### 5. **음향 효과** (선택사항)
- 공이 떨어지는 소리
- 바닥에 닿는 소리
- 클릭 소리
- 전환 소리
- 회전 소리

**위치**: `/public/assets/sounds/`
- `ball-drop.mp3`
- `ball-bounce.mp3`
- `click.mp3`
- `transition.mp3`
- `rotate.mp3`

**추천 사이트:**
- [Freesound](https://freesound.org) - 무료 사운드
- [Zapsplat](https://www.zapsplat.com) - 무료 사운드
- [Mixkit](https://mixkit.co) - 무료 사운드

---

## 📁 디렉토리 구조

프로젝트에 다음 디렉토리 구조를 생성하세요:

```
public/
├── assets/
│   ├── macbook.glb          (필수)
│   ├── cursor-icon.svg      (선택)
│   ├── on-it-logo.png       (선택)
│   ├── grid-texture.png     (선택)
│   └── sounds/              (선택)
│       ├── ball-drop.mp3
│       ├── ball-bounce.mp3
│       ├── click.mp3
│       ├── transition.mp3
│       └── rotate.mp3
└── opening-scene.html
```

---

## 🔧 모델 스케일 조정 가이드

맥북 모델을 로드한 후, 모델의 크기에 따라 스케일을 조정해야 할 수 있습니다.

**코드에서 조정할 부분:**
```javascript
macbookModel.scale.set(0.01, 0.01, 0.01); // 이 값을 조정
```

**조정 방법:**
1. 모델이 너무 크면: 값을 줄이기 (예: 0.005)
2. 모델이 너무 작으면: 값을 늘리기 (예: 0.02)

---

## 🎬 애니메이션 타이밍 조정

현재 애니메이션 타이밍은 코드에서 조정 가능합니다:

```javascript
// 공이 떨어지는 속도
ballVelocity += 0.2; // 중력 (값이 클수록 빠름)

// 화면 전환 속도
transitionProgress += 0.02; // 값이 클수록 빠름

// 회전 속도
rotationProgress += 0.01; // 값이 클수록 빠름
macbookRotation += 0.02; // 회전 속도
```

---

## 🚀 빠른 시작 가이드

1. **맥북 모델 다운로드**
   - 위 추천 사이트에서 GLB 형식의 맥북 모델 다운로드
   - `/public/assets/` 폴더에 `macbook.glb`로 저장

2. **모델 테스트**
   - `opening-scene.html` 파일을 브라우저에서 열기
   - 개발자 도구 콘솔에서 에러 확인
   - 모델이 제대로 로드되는지 확인

3. **스케일 조정**
   - 모델 크기가 적절한지 확인
   - 필요시 코드에서 스케일 값 조정

4. **애니메이션 조정**
   - 원하는 속도에 맞게 타이밍 조정

---

## 💡 팁

- **모델 최적화**: 큰 모델은 Blender에서 최적화하여 파일 크기 줄이기
- **텍스처**: 모델에 텍스처가 포함되어 있으면 더 현실적으로 보임
- **라이트**: 현재 설정된 라이트로 충분하지만, 필요시 추가 조정 가능
- **성능**: 모델이 너무 복잡하면 성능 저하 가능, 폴리곤 수 확인

---

## 📝 체크리스트

- [ ] 맥북 3D 모델 다운로드 및 저장
- [ ] 모델이 제대로 로드되는지 테스트
- [ ] 모델 스케일 조정
- [ ] 애니메이션 타이밍 확인
- [ ] (선택) 마우스 커서 아이콘 추가
- [ ] (선택) 로고 이미지 추가
- [ ] (선택) 음향 효과 추가

---

**작성일**: 2024년 12월
**버전**: 1.0


