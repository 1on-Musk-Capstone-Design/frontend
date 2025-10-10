import apiClient from './apiClient.js';
import { API_ENDPOINTS } from '../config/api.js';

/**
 * 워크스페이스 관련 API 서비스
 */
export class WorkspaceService {
  /**
   * 워크스페이스 생성
   * @param {string} name - 워크스페이스 이름
   * @returns {Promise<Object>} 생성된 워크스페이스 정보
   */
  static async createWorkspace(name) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.WORKSPACES, {
        name: name.trim()
      });
      return response.data;
    } catch (error) {
      console.error('워크스페이스 생성 실패:', error);
      throw new Error(error.response?.data?.message || '워크스페이스 생성에 실패했습니다.');
    }
  }

  /**
   * 워크스페이스 목록 조회 (향후 구현)
   * @returns {Promise<Array>} 워크스페이스 목록
   */
  static async getWorkspaces() {
    try {
      // 현재 백엔드에 GET 엔드포인트가 없으므로 빈 배열 반환
      return [];
    } catch (error) {
      console.error('워크스페이스 목록 조회 실패:', error);
      throw new Error('워크스페이스 목록 조회에 실패했습니다.');
    }
  }

  /**
   * 워크스페이스 삭제 (향후 구현)
   * @param {number} workspaceId - 워크스페이스 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  static async deleteWorkspace(workspaceId) {
    try {
      // 현재 백엔드에 DELETE 엔드포인트가 없으므로 false 반환
      return false;
    } catch (error) {
      console.error('워크스페이스 삭제 실패:', error);
      throw new Error('워크스페이스 삭제에 실패했습니다.');
    }
  }
}

export default WorkspaceService;
