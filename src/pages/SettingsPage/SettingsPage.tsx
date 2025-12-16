import { useState, useEffect, useRef } from "react";
import { User, AlignLeft, Mail, Bell, Shield } from "lucide-react";
import Sidebar from '../MainPage/components/Sidebar/Sidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import Toast, { ToastType } from '../../components/Toast/Toast';

export default function SettingsPage() {
  // 초기 상태를 localStorage에서 먼저 읽어오기 (즉시 표시)
  const getInitialUserData = () => {
    if (typeof window === 'undefined') {
      return { name: '', email: '', photo: null }
    }
    const name = localStorage.getItem('userName') || ''
    const email = localStorage.getItem('userEmail') || ''
    const photo = localStorage.getItem('userPhotoURL')
    return {
      name,
      email,
      photo: photo && photo.trim() !== '' ? photo : null
    }
  }

  const initialData = getInitialUserData()
  const [nickname, setNickname] = useState(initialData.name);
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState(initialData.email);
  const [photoURL, setPhotoURL] = useState<string | null>(initialData.photo);
  const [imageError, setImageError] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <div
      className={`w-11 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-200 ${
        checked ? "bg-green-500" : "bg-gray-300"
      }`}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      tabIndex={0}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onChange(!checked)}
    >
      <div
        className={`w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </div>
  );

  // 사용자 데이터 동기화: Google OAuth 로그인 후 로컬 스토리지에 저장된 정보를 초기값으로 사용
  // userName, userEmail은 CallbackPage에서 저장됨. photoURL은 없을 수 있어 폴백 처리.
  // 비동기 로드 대비해 로딩 플래그와 옵셔널 체이닝 적용
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadUser = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        // Sidebar와 동일한 방식으로 /v1/users/me 에서 사용자 정보 조회
        const res = await axios.get(`${API_BASE_URL}/v1/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data: any = res.data || {};
        const name = (data.name as string) || localStorage.getItem('userName') || '';
        const mail = (data.email as string) || localStorage.getItem('userEmail') || '';
        const photo = (data.profileImage as string) || localStorage.getItem('userPhotoURL') || '';

        setNickname(name || '사용자');
        setEmail(mail || '');
        setPhotoURL(photo && photo.trim() !== '' ? photo : null);

        // 로컬 저장 (사이드바와 동일하게 다른 페이지에서도 사용)
        if (name) localStorage.setItem('userName', name);
        if (mail) localStorage.setItem('userEmail', mail);
        if (photo) localStorage.setItem('userPhotoURL', photo);
      } else {
        // 토큰이 없으면 localStorage 기반 폴백
        const name = localStorage.getItem("userName") || "";
        const mail = localStorage.getItem("userEmail") || "";
        const storedPhoto = localStorage.getItem("userPhotoURL");
        setNickname(name || "사용자");
        setEmail(mail || "");
        setPhotoURL(storedPhoto && storedPhoto.trim() !== "" ? storedPhoto : null);
      }
    } catch (e) {
      // 안전하게 폴백
      setNickname("사용자");
      setEmail("");
      setPhotoURL(null);
    } finally {
      setIsUserLoading(false);
    }
  };

  // 마운트 시 및 토큰 변경 시 재로딩 (토큰이 바뀌면 사용자 정보도 바뀔 수 있음)
  // 단, StrictMode 환경에서도 안전하게 동작
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadUser();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Toast 알림 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar activeMenu="settings" />
      </div>
      {/* Main */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header (fixed within main column) */}
        <div className="bg-white border-b border-gray-200 px-6 md:px-8 lg:px-10 py-8">
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="mt-2 text-gray-500">프로필 정보와 계정 설정을 관리하세요.</p>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
          <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Profile Summary Card */}
            <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Cover */}
              <div className="h-32 bg-gradient-to-r from-emerald-200 to-teal-300" />
              {/* Content */}
              <div className="p-6 text-center">
                <div className="flex flex-col items-center -mt-12">
                  {isUserLoading ? (
                    <div className="w-28 h-28 rounded-full bg-white shadow ring-2 ring-white flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin" />
                    </div>
                  ) : photoURL && !imageError ? (
                    <img
                      src={photoURL}
                      alt="프로필 이미지"
                      className="w-28 h-28 rounded-full bg-white shadow ring-2 ring-white object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-28 h-28 rounded-full bg-white shadow ring-2 ring-white flex items-center justify-center text-4xl text-gray-400">
                      <span role="img" aria-label="avatar">👤</span>
                    </div>
                  )}
                  <div className="space-y-1 mt-3">
                    <div className="text-xl font-bold text-gray-900">{nickname || '닉네임'}</div>
                    <div className="text-sm text-gray-500">{bio || '한 줄 소개를 설정하세요'}</div>
                  </div>
                  <button
                    className="mt-4 inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    사진 변경
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // 파일 크기 제한 (5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        setToast({ message: '이미지 크기는 5MB 이하여야 합니다.', type: 'error' });
                        e.target.value = '';
                        return;
                      }

                      // 파일 타입 확인
                      if (!file.type.startsWith('image/')) {
                        setToast({ message: '이미지 파일만 업로드할 수 있습니다.', type: 'error' });
                        e.target.value = '';
                        return;
                      }

                      try {
                        // 파일을 Data URL(blob)로 읽어서 바로 저장/전송에 사용
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result as string;
                          setPhotoURL(result);
                          setImageError(false);
                        };
                        reader.onerror = () => {
                          setImageError(true);
                          setToast({ message: '이미지를 불러오는 중 오류가 발생했습니다.', type: 'error' });
                        };
                        reader.readAsDataURL(file);
                      } catch {
                        setImageError(true);
                        setToast({ message: '이미지를 불러오는 중 오류가 발생했습니다.', type: 'error' });
                      } finally {
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Details Stack */}
            {/* Profile Edit */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><User size={18} className="text-gray-700" /> 기본 정보</h3>
                <div className="border-b border-gray-100 mb-4" />
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700">닉네임</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><User size={16} /></span>
                      <input
                        type="text"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition text-gray-900"
                        placeholder="닉네임을 입력하세요"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700">한 줄 소개</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><AlignLeft size={16} /></span>
                      <input
                        type="text"
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 transition text-gray-900"
                        placeholder="자기소개를 입력하세요"
                      />
                    </div>
                  </div>
                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={async () => {
                        try {
                          const accessToken = localStorage.getItem('accessToken');
                          if (!accessToken) {
                            setToast({ message: '로그인이 필요합니다.', type: 'warning' });
                            return;
                          }

                          const trimmed = (nickname || '').trim();
                          const nameToStore = trimmed.length > 0 ? trimmed : '사용자';

                          const updateData: any = {
                            name: nameToStore
                          };

                          // 프로필 이미지는 Data URL 또는 기존 URL을 그대로 전달
                          if (photoURL && photoURL.trim() !== '') {
                            updateData.profileImage = photoURL;
                          }

                          await axios.patch(
                            `${API_BASE_URL}/v1/users/me`,
                            updateData,
                            {
                              headers: {
                                'Authorization': `Bearer ${accessToken}`
                              }
                            }
                          );

                          // localStorage에도 저장
                          localStorage.setItem('userName', nameToStore);
                          if (photoURL && photoURL.trim() !== '') {
                            localStorage.setItem('userPhotoURL', photoURL);
                          }

                          // 변경 사항을 다른 컴포넌트에 즉시 반영하기 위해 커스텀 이벤트 디스패치
                          window.dispatchEvent(new Event('user-profile-updated'));
                          
                          setToast({ message: '프로필이 성공적으로 업데이트되었습니다.', type: 'success' });
                        } catch (err: any) {
                          console.error('프로필 저장 실패', err);
                          if (err?.response?.status === 401 || err?.response?.status === 403) {
                            setToast({ message: '인증이 만료되었습니다. 다시 로그인해주세요.', type: 'error' });
                            setTimeout(() => {
                              localStorage.removeItem('accessToken');
                              localStorage.removeItem('refreshToken');
                              window.location.href = '/auth';
                            }, 2000);
                          } else {
                            const errorMessage = err?.response?.data || err?.message || '프로필 저장 중 오류가 발생했습니다.';
                            setToast({ message: errorMessage, type: 'error' });
                          }
                        }
                      }}
                    >
                      변경사항 저장
                    </button>
                  </div>
                </div>
              </section>

              {/* Account & Preferences */}
              <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-left">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2"><Bell size={18} className="text-gray-700" /> 계정 및 알림</h3>
                <div className="border-b border-gray-100 mb-4" />
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b border-dotted border-gray-200 pb-4">
                    <span className="text-gray-800 flex items-center gap-2"><Bell size={16} className="text-gray-500" /> 이메일 알림</span>
                    <Toggle checked={emailNotif} onChange={setEmailNotif} />
                  </div>
                  <div className="flex items-center justify-between border-b border-dotted border-gray-200 pb-4">
                    <span className="text-gray-800 flex items-center gap-2"><Shield size={16} className="text-gray-500" /> 마케팅 정보 수신</span>
                    <Toggle checked={marketing} onChange={setMarketing} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2"><Mail size={16} className="text-gray-500" /> 이메일</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Mail size={16} /></span>
                      <input
                        type="text"
                        value={email}
                        readOnly
                        className="w-full h-11 pl-9 pr-4 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button type="button" className="h-10 px-4 rounded-lg border border-emerald-400 text-emerald-600 font-medium hover:bg-emerald-50 transition">계정 전환</button>
                    <button type="button" className="text-red-500 text-sm hover:underline">로그아웃</button>
                  </div>
                </div>
              </section>
          </div>
        </div>
      </div>
    </div>
  );
}
