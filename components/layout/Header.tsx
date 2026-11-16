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
    <header className="flex h-16 items-center gap-3 border-b border-hairline bg-canvas px-4 md:h-20 md:px-8">
      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="메뉴 열기/닫기"
        aria-expanded={menuOpen}
        aria-controls="sidebar"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-strong text-ink md:hidden"
      >
        <span aria-hidden>☰</span>
      </button>
      <span className="text-display-sm font-bold text-primary">
        할 일 + 계획 관리
      </span>
      {me && (
        <div className="ml-auto flex items-center gap-2 rounded-full border border-hairline py-1 pl-1 pr-1 text-sm shadow-float sm:pl-3">
          <span className="hidden font-semibold text-ink sm:inline">{me.username}</span>
          {me.avatarUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={me.avatarUrl}
              alt=""
              className="h-8 w-8 rounded-full"
            />
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-full px-3 py-1.5 font-medium text-ink hover:bg-surface-soft"
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}
