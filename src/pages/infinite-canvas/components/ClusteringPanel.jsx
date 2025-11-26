import React, { useState, useEffect } from 'react';
import { API_CONSTANTS } from '../constants';
import Modal from '../../../components/Modal/Modal';

const ClusteringPanel = ({ 
  onClusteringParamsChange, 
  onVisibilityChange, 
  onGridVisibilityChange,
  showGrid,
  showMinimap,
  onMinimapVisibilityChange,
  showCenterIndicator,
  onCenterIndicatorVisibilityChange,
  texts = [], // 텍스트 필드 데이터
  onUndoClustering, // 클러스터링 되돌리기 함수
  canUndoClustering = false // 되돌리기 가능 여부
}) => {
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clusteringResult, setClusteringResult] = useState(null);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 가시성 변경 시 부모에게 알림
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!isHidden);
    }
  }, [isHidden, onVisibilityChange]);
  const [clusteringParams, setClusteringParams] = useState({
    nClusters: 'auto', // 'auto' 또는 숫자
    minClusters: 2,
    maxClusters: 10,
    algorithm: 'kmeans', // 'kmeans', 'dbscan', 'hierarchical'
    distanceMetric: 'euclidean', // 'euclidean', 'manhattan', 'cosine'
    eps: 0.5, // DBSCAN용
    minSamples: 5, // DBSCAN용
    linkage: 'ward' // Hierarchical용
  });

  const handleParamChange = (key, value) => {
    const newParams = { ...clusteringParams, [key]: value };
    setClusteringParams(newParams);
    if (onClusteringParamsChange) {
      onClusteringParamsChange(newParams);
    }
  };

  const handleNumberChange = (key, value) => {
    const numValue = value === '' ? 0 : Number(value);
    if (!isNaN(numValue)) {
      handleParamChange(key, numValue);
    }
  };

  // 알고리즘 설명
  const getAlgorithmDescription = (algorithm) => {
    const descriptions = {
      kmeans: '데이터를 K개의 클러스터로 나누는 가장 일반적인 알고리즘',
      dbscan: '밀도 기반으로 클러스터를 찾는 알고리즘 (노이즈 처리 가능)',
      hierarchical: '계층적 구조로 클러스터를 형성하는 알고리즘'
    };
    return descriptions[algorithm] || '';
  };

  // 거리 측정 설명
  const getDistanceMetricDescription = (metric) => {
    const descriptions = {
      euclidean: '직선 거리 (가장 일반적인 거리 측정 방법)',
      manhattan: '맨해튼 거리 (격자 형태의 거리 측정)',
      cosine: '코사인 유사도 (벡터 간 각도 기반 측정)'
    };
    return descriptions[metric] || '';
  };

  // Linkage 설명
  const getLinkageDescription = (linkage) => {
    const descriptions = {
      ward: '클러스터 내 분산을 최소화하는 방법',
      complete: '두 클러스터 간 최대 거리를 사용',
      average: '두 클러스터 간 평균 거리를 사용',
      single: '두 클러스터 간 최소 거리를 사용'
    };
    return descriptions[linkage] || '';
  };

  // 클러스터링 실행 확인 모달 표시
  const handleRunClusteringClick = () => {
    // 텍스트 필드가 없으면 실행 불가
    if (!texts || texts.length === 0) {
      setError('클러스터링할 텍스트가 없습니다.');
      return;
    }

    // 텍스트 추출 (빈 텍스트 제외) - ID와 함께 저장
    const textData = texts
      .map(text => ({ id: text.id, text: text.text }))
      .filter(item => item.text && item.text.trim().length > 0);

    if (textData.length === 0) {
      setError('클러스터링할 텍스트가 없습니다.');
      return;
    }

    // 확인 모달 표시
    setShowConfirmModal(true);
  };

  // 클러스터링 실행
  const handleRunClustering = async () => {
    // 모달 닫기
    setShowConfirmModal(false);

    // 텍스트 필드가 없으면 실행 불가
    if (!texts || texts.length === 0) {
      setError('클러스터링할 텍스트가 없습니다.');
      return;
    }

    // 텍스트 추출 (빈 텍스트 제외) - ID와 함께 저장
    const textData = texts
      .map(text => ({ id: text.id, text: text.text }))
      .filter(item => item.text && item.text.trim().length > 0);

    if (textData.length === 0) {
      setError('클러스터링할 텍스트가 없습니다.');
      return;
    }

    const textContents = textData.map(item => item.text);
    const textIds = textData.map(item => item.id);

    // 클러스터 개수 결정
    let nClusters = clusteringParams.nClusters;
    if (nClusters === 'auto') {
      // 자동: 텍스트 개수의 제곱근 또는 min/max 범위 내
      const autoClusters = Math.ceil(Math.sqrt(textContents.length));
      nClusters = Math.max(
        clusteringParams.minClusters,
        Math.min(autoClusters, clusteringParams.maxClusters)
      );
    }

    // 최소 클러스터 개수 체크
    if (textContents.length < nClusters) {
      setError(`텍스트 개수(${textContents.length})가 클러스터 개수(${nClusters})보다 적습니다.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setClusteringResult(null);

    try {
      const response = await fetch(`${API_CONSTANTS.CLUSTERING_API_URL}/v1/cluster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texts: textContents,
          n_clusters: nClusters,
          return_visualization: true  // 시각화 데이터 받기
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setClusteringResult(result);
      
      // 부모 컴포넌트에 결과 전달 (텍스트 ID 매핑 포함)
      if (onClusteringParamsChange) {
        onClusteringParamsChange({
          ...clusteringParams,
          result: {
            ...result,
            textIds: textIds // 클러스터링에 사용된 텍스트 ID 순서
          }
        });
      }
    } catch (err) {
      console.error('Clustering error:', err);
      setError(err.message || '클러스터링 실행 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 클러스터링 패널 토글 버튼 */}
      {isHidden && (
        <button
          className="clusteringToggle"
          onClick={() => setIsHidden(false)}
          title="패널 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      )}

      {/* 클러스터링 패널 */}
      <div className={`clusteringPanel ${isHidden ? 'hidden' : ''}`}>
        {/* 헤더 */}
        <div className="clusteringHeader">
          <div className="clusteringHeaderTitle">
            <span className="clusteringHeaderText">클러스터링</span>
          </div>
          <button
            className="clusteringCloseButton"
            onClick={() => setIsHidden(true)}
            title="클러스터링 닫기"
          >
            ×
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="clusteringContent">
          {/* 클러스터 개수 섹션 */}
          <div className="clusteringSection">
            <div className="clusteringSectionHeader">
              <span>클러스터 개수</span>
            </div>
            <div className="clusteringSectionContent">
              <label className="clusteringCheckbox">
                <input
                  type="checkbox"
                  checked={clusteringParams.nClusters === 'auto'}
                  onChange={(e) => handleParamChange('nClusters', e.target.checked ? 'auto' : clusteringParams.minClusters)}
                />
                <span>자동 설정</span>
              </label>
              {clusteringParams.nClusters !== 'auto' && (
                <div className="clusteringInputGroup">
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={clusteringParams.nClusters}
                    onChange={(e) => handleNumberChange('nClusters', e.target.value)}
                    className="clusteringInput"
                  />
                </div>
              )}
              {clusteringParams.nClusters === 'auto' && (
                <div className="clusteringRangeGroup">
                  <div className="clusteringRangeItem">
                    <label>최소</label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={clusteringParams.minClusters}
                      onChange={(e) => handleNumberChange('minClusters', e.target.value)}
                      className="clusteringInput"
                    />
                  </div>
                  <div className="clusteringRangeItem">
                    <label>최대</label>
                    <input
                      type="number"
                      min="2"
                      max="50"
                      value={clusteringParams.maxClusters}
                      onChange={(e) => handleNumberChange('maxClusters', e.target.value)}
                      className="clusteringInput"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 알고리즘 섹션 */}
          <div className="clusteringSection">
            <div className="clusteringSectionHeader">
              <span>알고리즘</span>
            </div>
            <div className="clusteringSectionContent">
              <select
                value={clusteringParams.algorithm}
                onChange={(e) => handleParamChange('algorithm', e.target.value)}
                className="clusteringSelect"
              >
                <option value="kmeans">K-Means</option>
                <option value="dbscan">DBSCAN</option>
                <option value="hierarchical">Hierarchical</option>
              </select>
              <div className="clusteringDescription">
                {getAlgorithmDescription(clusteringParams.algorithm)}
              </div>
            </div>
          </div>

          {/* 거리 측정 방법 섹션 */}
          <div className="clusteringSection">
            <div className="clusteringSectionHeader">
              <span>거리 측정</span>
            </div>
            <div className="clusteringSectionContent">
              <select
                value={clusteringParams.distanceMetric}
                onChange={(e) => handleParamChange('distanceMetric', e.target.value)}
                className="clusteringSelect"
              >
                <option value="euclidean">Euclidean</option>
                <option value="manhattan">Manhattan</option>
                <option value="cosine">Cosine</option>
              </select>
              <div className="clusteringDescription">
                {getDistanceMetricDescription(clusteringParams.distanceMetric)}
              </div>
            </div>
          </div>

          {/* DBSCAN 파라미터 (DBSCAN 선택 시에만 표시) */}
          {clusteringParams.algorithm === 'dbscan' && (
            <>
              <div className="clusteringSection">
                <div className="clusteringSectionHeader">
                  <span>EPS</span>
                </div>
                <div className="clusteringSectionContent">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={clusteringParams.eps}
                    onChange={(e) => handleNumberChange('eps', e.target.value)}
                    className="clusteringInput"
                  />
                </div>
              </div>
              <div className="clusteringSection">
                <div className="clusteringSectionHeader">
                  <span>최소 샘플 수</span>
                </div>
                <div className="clusteringSectionContent">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={clusteringParams.minSamples}
                    onChange={(e) => handleNumberChange('minSamples', e.target.value)}
                    className="clusteringInput"
                  />
                </div>
              </div>
            </>
          )}

          {/* Hierarchical 파라미터 (Hierarchical 선택 시에만 표시) */}
          {clusteringParams.algorithm === 'hierarchical' && (
            <div className="clusteringSection">
              <div className="clusteringSectionHeader">
                <span>Linkage</span>
              </div>
              <div className="clusteringSectionContent">
                <select
                  value={clusteringParams.linkage}
                  onChange={(e) => handleParamChange('linkage', e.target.value)}
                  className="clusteringSelect"
                >
                  <option value="ward">Ward</option>
                  <option value="complete">Complete</option>
                  <option value="average">Average</option>
                  <option value="single">Single</option>
                </select>
                <div className="clusteringDescription">
                  {getLinkageDescription(clusteringParams.linkage)}
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div style={{
              padding: '12px',
              marginTop: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '12px'
            }}>
              {error}
            </div>
          )}

          {/* 클러스터링 결과 - 숨김 (캔버스에서만 표시) */}

          {/* 실행 버튼 */}
          <div className="clusteringActionArea">
            <button 
              className="clusteringRunButton" 
              onClick={handleRunClusteringClick}
              disabled={isLoading || !texts || texts.length === 0}
              style={{
                opacity: (isLoading || !texts || texts.length === 0) ? 0.5 : 1,
                cursor: (isLoading || !texts || texts.length === 0) ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? '클러스터링 중...' : '클러스터링 실행'}
            </button>
            
            {/* 되돌리기 버튼 */}
            {canUndoClustering && onUndoClustering && (
              <button 
                className="clusteringUndoButton" 
                onClick={onUndoClustering}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid #d0d0d0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1a1a1a',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f0f0'}
              >
                되돌리기
              </button>
            )}
          </div>
        </div>

        {/* 설정 섹션 */}
        <div className="clusteringSettingsSection">
          <div className="clusteringSectionHeader">
            <span>설정</span>
          </div>
          <div className="clusteringSettingsContent">
            {/* 격자 보기 */}
            <div className="clusteringSettingItem">
              <span className="clusteringSettingLabel">격자 보기</span>
              <label className="clusteringToggleSwitch">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => onGridVisibilityChange && onGridVisibilityChange(e.target.checked)}
                />
                <span className="clusteringToggleSlider"></span>
              </label>
            </div>

            {/* 맵 보기 */}
            <div className="clusteringSettingItem">
              <span className="clusteringSettingLabel">맵 보기</span>
              <label className="clusteringToggleSwitch">
                <input
                  type="checkbox"
                  checked={showMinimap}
                  onChange={(e) => onMinimapVisibilityChange && onMinimapVisibilityChange(e.target.checked)}
                />
                <span className="clusteringToggleSlider"></span>
              </label>
            </div>

            {/* 중앙 위치 보기 */}
            <div className="clusteringSettingItem">
              <span className="clusteringSettingLabel">중앙 위치 보기</span>
              <label className="clusteringToggleSwitch">
                <input
                  type="checkbox"
                  checked={showCenterIndicator}
                  onChange={(e) => onCenterIndicatorVisibilityChange && onCenterIndicatorVisibilityChange(e.target.checked)}
                />
                <span className="clusteringToggleSlider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 클러스터링 실행 확인 모달 */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)}>
        <div style={{ padding: '24px', maxWidth: '500px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0', 
            fontSize: '20px', 
            fontWeight: 600,
            color: '#1a1a1a'
          }}>
            클러스터링 실행 확인
          </h2>
          <p style={{ 
            margin: '0 0 24px 0', 
            fontSize: '14px', 
            lineHeight: '1.6',
            color: '#666'
          }}>
            클러스터링을 실행하면 현재 작성 중인 모든 아이디어가 중앙에 모여 
            유사한 내용끼리 그룹으로 묶입니다.
          </p>
          <p style={{ 
            margin: '0 0 24px 0', 
            fontSize: '14px', 
            lineHeight: '1.6',
            color: '#666',
            fontWeight: 500
          }}>
            이 작업은 참여 중인 다른 사용자들과 공유되며, 모든 사용자의 화면에 동일하게 표시됩니다.
            계속하시겠습니까?
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'flex-end' 
          }}>
            <button
              onClick={() => setShowConfirmModal(false)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#666',
                backgroundColor: '#f0f0f0',
                border: '1px solid #d0d0d0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#e0e0e0'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f0f0f0'}
            >
              취소
            </button>
            <button
              onClick={handleRunClustering}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#fff',
                backgroundColor: 'var(--theme-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--theme-primary-hover)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--theme-primary)'}
            >
              실행
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default ClusteringPanel;

