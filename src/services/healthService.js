import apiClient from './apiClient.js';
import { API_ENDPOINTS } from '../config/api.js';

/**
 * 헬스 체크 관련 API 서비스
 */
export class HealthService {
  /**
   * 서버 상태 확인
   * @returns {Promise<Object>} 서버 상태 정보
   */
  static async checkHealth() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HEALTH);
      return response.data;
    } catch (error) {
      console.error('헬스 체크 실패:', error);
      throw new Error('서버 상태 확인에 실패했습니다.');
    }
  }

  /**
   * Socket.IO 서버 상태 확인
   * @returns {Promise<Object>} Socket.IO 서버 상태
   */
  static async checkSocketHealth() {
    try {
      const healthData = await this.checkHealth();
      return healthData.socketIO || null;
    } catch (error) {
      console.error('Socket.IO 상태 확인 실패:', error);
      return null;
    }
  }
}

export default HealthService;
