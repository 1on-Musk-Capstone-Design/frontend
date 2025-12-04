import { useState, useEffect } from "react";
import { User, AlignLeft, Mail, Bell, Shield } from "lucide-react";
import Sidebar from '../MainPage/components/Sidebar/Sidebar';

export default function SettingsPage() {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [marketing, setMarketing] = useState(false);

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
  const loadUser = () => {
    try {
      const name = localStorage.getItem("userName") || "";
      const mail = localStorage.getItem("userEmail") || "";
      // 일부 환경에서 accessToken의 페이로드에서 사진 URL을 가져올 수 있으나, 현재 저장되지 않았으므로 폴백 유지
      const storedPhoto = localStorage.getItem("userPhotoURL");

      setNickname(name || "사용자");
      setEmail(mail || "");
      setPhotoURL(storedPhoto && storedPhoto.trim() !== "" ? storedPhoto : null);
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
    <div className="flex min-h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar activeMenu="settings" />
      </div>
      {/* Main */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {/* Header */}
        <div className="px-6 md:px-8 lg:px-10 py-8 bg-white border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900">설정</h1>
          <p className="mt-2 text-gray-500">프로필 정보와 계정 설정을 관리하세요.</p>
        </div>

        {/* Content Grid */}
        <main className="px-6 md:px-8 lg:px-10 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left: Profile Summary Card (1 col) */}
            <section className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                  <button className="mt-4 inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium" type="button">사진 변경</button>
                </div>
              </div>
            </section>

            {/* Right: Details (2 cols) */}
            <div className="md:col-span-2 flex flex-col gap-6">
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
                    <button type="button" className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition">변경사항 저장</button>
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
        </main>
      </div>
    </div>
  );
}
