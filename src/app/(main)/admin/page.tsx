import DataTools from "@/components/admin/DataTools";
import StatusView from "@/components/admin/StatusView";

export default function AdminPage() {
  return (
    <div className="text-left bg-white p-6 rounded-xl shadow border-t-8 border-amber-500">
      <div className="admin-controls bg-slate-50 p-6 rounded-xl mb-8 border border-slate-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">⚙️ 시스템 관리자 도구</h2>
        <DataTools />
      </div>
      <StatusView />
    </div>
  );
}
