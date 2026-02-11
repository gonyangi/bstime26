import { School } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b-4 border-primary p-4 shadow-sm text-center no-print sticky top-0 z-40">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 flex items-center justify-center gap-3">
          <School className="w-8 h-8 text-primary" />
          봉선초등학교 특별실·시간표 관리
        </h1>
      </div>
    </header>
  );
}
