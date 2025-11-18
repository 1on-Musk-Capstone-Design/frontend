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

  return (
    <>
      {/* 클러스터링 패널 토글 버튼 */}
      {isHidden && (
        <button
          className="clusteringToggle"
          onClick={() => setIsHidden(false)}
          title="클러스터링 열기"
        >
          &gt;&gt;
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

