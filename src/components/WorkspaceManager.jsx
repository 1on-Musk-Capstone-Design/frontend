import React, { useState, useEffect } from 'react';
import { WorkspaceService } from '../services/workspaceService.js';
import { HealthService } from '../services/healthService.js';

const WorkspaceManager = ({ onWorkspaceCreated }) => {
  const [workspaces, setWorkspaces] = useState([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // 서버 상태 확인
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const status = await HealthService.checkHealth();
        setServerStatus(status);
      } catch (error) {
        console.error('서버 상태 확인 실패:', error);
        setServerStatus(null);
      }
    };

    checkServerStatus();
  }, []);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      const workspace = await WorkspaceService.createWorkspace(newWorkspaceName);
      setWorkspaces(prev => [...prev, workspace]);
      setNewWorkspaceName('');
      setShowCreateForm(false);
      
      // 부모 컴포넌트에 워크스페이스 생성 알림
      if (onWorkspaceCreated) {
        onWorkspaceCreated(workspace);
      }
    } catch (error) {
      console.error('워크스페이스 생성 실패:', error);
      alert('워크스페이스 생성에 실패했습니다: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">워크스페이스 관리</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            serverStatus ? 'bg-green-500' : 'bg-red-500'
          }`}></div>
          <span className="text-sm text-gray-600">
            {serverStatus ? '서버 연결됨' : '서버 연결 안됨'}
          </span>
        </div>
      </div>

      {!showCreateForm ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              새로운 워크스페이스를 생성하여 협업을 시작하세요.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              워크스페이스 생성
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateWorkspace} className="space-y-4">
          <div>
            <label htmlFor="workspaceName" className="block text-sm font-medium text-gray-700 mb-2">
              워크스페이스 이름
            </label>
            <input
              type="text"
              id="workspaceName"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="워크스페이스 이름을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isCreating || !newWorkspaceName.trim()}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isCreating ? '생성 중...' : '생성'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewWorkspaceName('');
              }}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {workspaces.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">생성된 워크스페이스</h3>
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div key={workspace.workspaceId} className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{workspace.name}</p>
                    <p className="text-sm text-gray-600">
                      생성일: {new Date(workspace.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {workspace.workspaceId}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceManager;
