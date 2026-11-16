"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  menuOpen: boolean;
  onToggleMenu: () => void;
}

interface Me {
  username: string;
  avatarUrl: string;
}

export default function Header({ menuOpen, onToggleMenu }: HeaderProps) {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/auth/me")
      .then((res) => (res.ok ? (res.json() as Promise<Me>) : null))
      .then((data) => {
        if (alive) setMe(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  async function logout() {
    await fetch("/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }

  return (
    <header className="flex h-14 items-center gap-3 border-b border-gray-200 bg-white px-4">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="메뉴 열기/닫기"
        aria-expanded={menuOpen}
        aria-controls="sidebar"
        className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
      >
        <span aria-hidden>☰</span>
      </button>
      <span className="text-lg font-semibold text-gray-900">
        할 일 + 계획 관리
      </span>
      {me && (
        <div className="ml-auto flex items-center gap-3 text-sm">
          {me.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatarUrl}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-gray-700">{me.username}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
