"use client";

import dynamic from "next/dynamic";

const KanbanBoard = dynamic(() => import("./KanbanBoard"), {
  ssr: false,
  loading: () => <p className="text-gray-500">불러오는 중...</p>,
});

export default function KanbanBoardClient() {
  return <KanbanBoard />;
}
