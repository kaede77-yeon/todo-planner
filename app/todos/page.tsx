import KanbanBoardClient from "@/components/todos/KanbanBoardClient";

export default function TodosPage() {
  return (
    <div>
      <h1 className="mb-4 text-display-xl">할 일</h1>
      <KanbanBoardClient />
    </div>
  );
}
