/**
 * 간단한 패킹 알고리즘
 * 큰 아이템부터 빈 공간에 채워 넣는 방식
 */

/**
 * 빈 공간을 나타내는 클래스
 */
class EmptySpace {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // 이 공간에 아이템이 들어갈 수 있는지 확인
  canFit(itemWidth, itemHeight, margin) {
    return this.width >= itemWidth + margin * 2 && 
           this.height >= itemHeight + margin * 2;
  }

  // 아이템을 배치한 후 남은 공간들을 반환
  placeItem(itemX, itemY, itemWidth, itemHeight, margin) {
    const spaces = [];
    
    // 아이템의 실제 배치 영역 (여백 포함)
    const itemRight = itemX + itemWidth + margin;
    const itemBottom = itemY + itemHeight + margin;
    
    // 오른쪽 공간 (아이템 오른쪽에 남은 공간)
    const rightWidth = this.x + this.width - itemRight;
    if (rightWidth > margin) {
      spaces.push(new EmptySpace(
        itemRight,
        this.y,
        rightWidth,
        this.height
      ));
    }
    
    // 아래 공간 (아이템 아래에 남은 공간)
    // 아이템의 왼쪽부터 원래 공간의 오른쪽까지 (오른쪽 공간과 겹치지 않도록)
    const bottomHeight = this.y + this.height - itemBottom;
    if (bottomHeight > margin) {
      const bottomWidth = itemRight - this.x; // 아이템의 오른쪽까지
      if (bottomWidth > margin) {
        spaces.push(new EmptySpace(
          this.x,
          itemBottom,
          bottomWidth,
          bottomHeight
        ));
      }
    }
    
    return spaces;
  }
}

/**
 * 간단한 패킹 알고리즘
 * 큰 아이템부터 빈 공간에 채워 넣기
 * 
 * @param {Array} items - 배치할 아이템 배열 [{width, height, id, ...}]
 * @param {Object} options - 옵션
 * @param {number} options.margin - 아이템 간 여백
 * @returns {Array} 배치된 아이템 배열 [{id, x, y, width, height, ...}]
 */
export function simplePacking(items, options = {}) {
  const { margin = 20 } = options;

  if (!items || items.length === 0) {
    return [];
  }

  // 1. 아이템을 크기 순으로 정렬 (큰 것부터)
  const sortedItems = [...items].sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaB - areaA; // 큰 면적부터
  });

  // 2. 기준 크기 계산
  // 세로가 가장 긴 아이템의 높이를 기준 높이로
  const maxHeight = Math.max(...sortedItems.map(item => item.height));
  // 가로가 가장 긴 아이템의 너비를 기준 너비로
  const maxWidth = Math.max(...sortedItems.map(item => item.width));
  
  // 초기 컨테이너 크기 (기준 크기로 시작, 필요시 확장)
  let containerWidth = maxWidth;
  let containerHeight = maxHeight;

  // 3. 빈 공간 리스트 초기화
  let emptySpaces = [new EmptySpace(0, 0, containerWidth, containerHeight)];
  const placedItems = [];

  // 4. 각 아이템을 배치
  sortedItems.forEach(item => {
    const itemWidth = item.width + margin * 2;
    const itemHeight = item.height + margin * 2;

    // 가장 적합한 빈 공간 찾기 (가장 작은 공간부터 시도)
    emptySpaces.sort((a, b) => {
      const areaA = a.width * a.height;
      const areaB = b.width * b.height;
      return areaA - areaB; // 작은 공간부터
    });

    let bestSpace = null;
    let bestSpaceIndex = -1;

    for (let i = 0; i < emptySpaces.length; i++) {
      const space = emptySpaces[i];
      if (space.canFit(item.width, item.height, margin)) {
        bestSpace = space;
        bestSpaceIndex = i;
        break;
      }
    }

    // 적합한 공간을 찾지 못한 경우 컨테이너 확장
    if (!bestSpace) {
      // 공간이 부족하면 컨테이너 확장
      // 정사각형에 가깝게 유지하면서 확장
      const currentAspectRatio = containerWidth / containerHeight;
      
      if (currentAspectRatio < 1.0) {
        // 세로로 길면 가로로 확장
        containerWidth += maxWidth;
        // 기존 빈 공간들도 확장
        emptySpaces.forEach(space => {
          if (space.x + space.width === containerWidth - maxWidth) {
            space.width += maxWidth;
          }
        });
        // 새로운 빈 공간 추가
        emptySpaces.push(new EmptySpace(
          containerWidth - maxWidth,
          0,
          maxWidth,
          containerHeight
        ));
      } else {
        // 가로로 길면 세로로 확장
        containerHeight += maxHeight;
        // 기존 빈 공간들도 확장
        emptySpaces.forEach(space => {
          if (space.y + space.height === containerHeight - maxHeight) {
            space.height += maxHeight;
          }
        });
        // 새로운 빈 공간 추가
        emptySpaces.push(new EmptySpace(
          0,
          containerHeight - maxHeight,
          containerWidth,
          maxHeight
        ));
      }

      // 다시 적합한 공간 찾기
      emptySpaces.sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        return areaA - areaB;
      });

      for (let i = 0; i < emptySpaces.length; i++) {
        const space = emptySpaces[i];
        if (space.canFit(item.width, item.height, margin)) {
          bestSpace = space;
          bestSpaceIndex = i;
          break;
        }
      }
    }

    // 여전히 찾지 못하면 강제로 배치 (컨테이너 확장)
    if (!bestSpace) {
      // 더 큰 공간 확보
      containerWidth += maxWidth;
      containerHeight += maxHeight;
      bestSpace = new EmptySpace(0, 0, containerWidth, containerHeight);
      bestSpaceIndex = emptySpaces.length;
      emptySpaces.push(bestSpace);
    }

    // 아이템 배치
    const itemX = bestSpace.x + margin;
    const itemY = bestSpace.y + margin;

    placedItems.push({
      ...item,
      x: itemX,
      y: itemY
    });

    // 빈 공간 업데이트
    emptySpaces.splice(bestSpaceIndex, 1);
    const newSpaces = bestSpace.placeItem(itemX, itemY, itemWidth, itemHeight, margin);
    emptySpaces.push(...newSpaces);

    // 너무 작은 빈 공간 제거 (최소 아이템 크기 + 여백보다 작은 공간)
    const minItemWidth = Math.min(...sortedItems.map(i => i.width));
    const minItemHeight = Math.min(...sortedItems.map(i => i.height));
    const minSpaceWidth = minItemWidth + margin * 2;
    const minSpaceHeight = minItemHeight + margin * 2;
    
    emptySpaces = emptySpaces.filter(space => 
      space.width >= minSpaceWidth && space.height >= minSpaceHeight
    );

    // 겹치는 빈 공간 병합은 생략 (성능상 복잡도 증가)
  });

  return placedItems;
}

/**
 * 클러스터 내 텍스트들을 간단한 패킹 알고리즘으로 배치
 * 
 * @param {Array} items - 배치할 텍스트 아이템 배열
 * @param {number} centerX - 클러스터 중심 X 좌표
 * @param {number} centerY - 클러스터 중심 Y 좌표
 * @param {number} margin - 텍스트 간 여백
 * @returns {Array} 배치된 텍스트 배열
 */
export function packClusterTextsSimple(items, centerX, centerY, margin = 20) {
  // 패킹할 아이템 준비
  const packingItems = items.map(item => ({
    id: item.text.id,
    width: item.size.width,
    height: item.size.height,
    text: item.text,
    originalItem: item
  }));

  // 간단한 패킹 실행
  const packed = simplePacking(packingItems, {
    margin: margin
  });

  // 배치된 아이템들을 중심점 기준으로 정렬
  if (packed.length > 0) {
    // 전체 영역의 중심 계산
    const minX = Math.min(...packed.map(p => p.x));
    const maxX = Math.max(...packed.map(p => p.x + p.width));
    const minY = Math.min(...packed.map(p => p.y));
    const maxY = Math.max(...packed.map(p => p.y + p.height));

    const packedCenterX = (minX + maxX) / 2;
    const packedCenterY = (minY + maxY) / 2;

    // 중심점을 목표 중심점으로 이동
    const offsetX = centerX - packedCenterX;
    const offsetY = centerY - packedCenterY;

    const adjustedPacked = packed.map(p => ({
      ...p,
      x: p.x + offsetX,
      y: p.y + offsetY
    }));

    // 최종 겹침 검증 및 조정
    const finalPacked = [];
    for (let i = 0; i < adjustedPacked.length; i++) {
      const current = adjustedPacked[i];
      let adjustedX = current.x;
      let adjustedY = current.y;
      let hasOverlap = true;
      let attempts = 0;
      const maxAttempts = 100;

      while (hasOverlap && attempts < maxAttempts) {
        hasOverlap = false;

        // 이미 배치된 아이템들과 확인
        for (const existing of finalPacked) {
          const xOverlap = !(adjustedX + current.width + margin <= existing.x || 
                           existing.x + existing.width + margin <= adjustedX);
          const yOverlap = !(adjustedY + current.height + margin <= existing.y || 
                           existing.y + existing.height + margin <= adjustedY);

          if (xOverlap && yOverlap) {
            hasOverlap = true;
            // 아래로 이동
            adjustedY = existing.y + existing.height + margin;
            break;
          }
        }

        if (!hasOverlap) {
          break;
        }
        attempts++;
      }

      finalPacked.push({
        ...current,
        x: adjustedX,
        y: adjustedY
      });
    }

    return finalPacked;
  }

  return packed;
}

