import { useState } from "react";
import Sidebar from '../MainPage/components/Sidebar/Sidebar';

export default function SettingsPage() {
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [email] = useState("user@email.com");
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar: 고정폭, shrink-0, flex 내부 배치 */}
      <div className="w-64 flex-shrink-0 h-full">
        <Sidebar activeMenu="settings" />
      </div>
      {/* Main Content: flex-1, min-w-0, 내부 스크롤, 반응형 패딩 */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-10">
        <main className="w-full max-w-4xl text-left mx-0 flex flex-col gap-8">
          {/* 헤더 */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">설정</h1>
            <p className="mt-2 text-gray-500">프로필 정보와 계정 설정을 관리하세요.</p>
          </div>
          {/* 프로필 카드 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-4xl text-left">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">프로필 설정</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex flex-col items-center min-w-[100px] mb-4 md:mb-0">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-3xl text-gray-400 mb-2">
                  <span role="img" aria-label="avatar">👤</span>
                </div>
                <button className="text-xs text-green-600 hover:underline font-medium" type="button">사진 변경</button>
              </div>
              <div className="flex-1 flex flex-col gap-4 w-full">
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-700">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-900"
                    placeholder="닉네임을 입력하세요"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="block text-sm font-medium text-gray-700">한 줄 소개</label>
                  <input
                    type="text"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    className="w-full h-11 px-4 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition text-gray-900"
                    placeholder="자기소개를 입력하세요"
                  />
                </div>
              </div>
            </div>
          </section>
          {/* 알림 카드 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-4xl text-left">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">알림 설정</h3>
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-800">이메일 알림</span>
                <Toggle checked={emailNotif} onChange={setEmailNotif} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-800">마케팅 정보 수신</span>
                <Toggle checked={marketing} onChange={setMarketing} />
              </div>
            </div>
          </section>
          {/* 계정 카드 */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-4xl text-left">
            <h3 className="font-semibold text-lg mb-4 border-b pb-2">계정 관리</h3>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <input
                  type="text"
                  value={email}
                  readOnly
                  className="w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <button
                type="button"
                className="h-11 px-6 rounded-lg border border-green-500 text-green-600 font-medium hover:bg-green-50 transition"
              >
                계정 전환
              </button>
            </div>
          </section>
          {/* Danger Zone */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full max-w-4xl text-left mt-8">
            <button
              type="button"
              className="w-full h-11 rounded-lg bg-red-50 text-red-500 font-semibold hover:bg-red-100 transition"
            >
              로그아웃
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}
