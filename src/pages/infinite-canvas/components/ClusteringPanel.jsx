import React, { useState } from 'react';

const ClusteringPanel = ({ onClusteringParamsChange }) => {
  const [isHidden, setIsHidden] = useState(false);
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

  return (
    <>
      {/* 클러스터링 패널 토글 버튼 */}
      {isHidden && (
        <button
          className="clusteringToggle"
          onClick={() => setIsHidden(false)}
          title="클러스터링 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
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

          {/* 실행 버튼 */}
          <div className="clusteringActionArea">
            <button className="clusteringRunButton" onClick={() => onClusteringParamsChange && onClusteringParamsChange(clusteringParams)}>
              클러스터링 실행
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClusteringPanel;

