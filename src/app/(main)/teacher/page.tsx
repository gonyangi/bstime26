"use client";

import React, { useState, Suspense, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TEACHERS, PERIODS, PERIOD_KR, DAYS, DAY_KR } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { setTeacherSchedule, deleteTeacherSchedule } from '@/lib/mutations';
import { Trash2 } from 'lucide-react';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';


function TeacherSelector({
  currentTeacher,
  onSelectTeacher,
}: {
  currentTeacher: string;
  onSelectTeacher: (teacher: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 justify-center">
      {TEACHERS.map((teacher) => (
        <Button
          key={teacher}
          variant="outline"
          className={cn(
            'px-6 py-2 border-2 rounded-xl text-lg font-bold transition-all hover:bg-purple-50',
            currentTeacher === teacher
              ? 'border-purple-600 bg-purple-50 text-purple-700'
              : 'bg-white'
          )}
          onClick={() => onSelectTeacher(teacher)}
        >
          {teacher}
        </Button>
      ))}
    </div>
  );
}

function TeacherScheduleModal({
    isOpen,
    onClose,
    scheduleKey,
    currentValue,
    currentTeacher
} : {
    isOpen: boolean,
    onClose: () => void,
    scheduleKey: string | null,
    currentValue: string,
    currentTeacher: string,
}) {
    const [value, setValue] = useState('');
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const db = useFirestore();

    React.useEffect(() => {
        if(isOpen) setValue(currentValue);
    }, [isOpen, currentValue])

    const handleSave = () => {
        if(!scheduleKey) return;
        startTransition(async () => {
            try {
                await setTeacherSchedule(db, scheduleKey, value);
                toast({ title: '저장되었습니다.' });
                onClose();
            } catch (error) {
                console.error(error);
                toast({ title: '저장 실패', variant: 'destructive' });
            }
        });
    }
    
    if(!isOpen || !scheduleKey) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{currentTeacher} 수업 입력</DialogTitle>
                </DialogHeader>
                <Input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="학급명 입력 후 Enter"
                    className="text-2xl font-bold h-14"
                    onKeyDown={e => { if(e.key === 'Enter') handleSave() }}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>취소</Button>
                    <Button onClick={handleSave} disabled={isPending}>{isPending ? '저장 중' : '저장'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function TeacherTimetable({ currentTeacher }: { currentTeacher: string }) {
  const db = useFirestore();
  const { toast } = useToast();

  const dataRootPath = `artifacts/${appId}/public/data`;
  
  const { data: fixedDataRaw, loading: fixedLoading } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'fixedData')) : null, [db])
  );
  const fixedData = useMemo(() => fixedDataRaw ? Object.fromEntries(fixedDataRaw.map(d => [d.id, d.val])) : {}, [fixedDataRaw]);

  const { data: teacherSchedulesRaw, loading: schedulesLoading } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'teacherSchedules')) : null, [db])
  );
  const teacherSchedules = useMemo(() => teacherSchedulesRaw ? Object.fromEntries(teacherSchedulesRaw.map(d => [d.id, d.val])) : {}, [teacherSchedulesRaw]);

  const loading = fixedLoading || schedulesLoading;
  
  const [modalState, setModalState] = useState({isOpen: false, key: null as string | null, value: ''});
  
  if (loading) {
    return <Skeleton className="w-full h-[600px] rounded-2xl" />;
  }

  if (!currentTeacher) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border-2 border-dashed">
        <p className="text-gray-500 text-lg font-medium">교담 선생님을 선택해주세요.</p>
      </div>
    );
  }
  
  const handleDelete = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    try {
        await deleteTeacherSchedule(db, key);
        toast({ title: '삭제되었습니다.' });
    } catch (error) {
        console.error(error);
        toast({ title: '삭제 실패', variant: 'destructive' });
    }
  }

  return (
    <>
    <Card className="shadow-lg overflow-hidden border">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse min-w-[600px]">
            <thead className="bg-purple-600 text-white text-lg font-bold">
              <tr>
                <th className="p-3 w-20 sm:w-24">교시</th>
                {DAYS.map((day) => (
                  <th key={day} className="w-1/5">{DAY_KR[day]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-xl font-bold">
              {PERIODS.map((period) => (
                <tr key={period} className="border-b">
                  <td className="p-3 border font-bold bg-gray-50 text-gray-400 text-sm text-center h-16">{PERIOD_KR[period]}</td>
                  {DAYS.map((day) => {
                    const key = `${currentTeacher}-${day}-${period}`;
                    const schedule = teacherSchedules[key] || '';
                    
                    const isSportsDuplicate = currentTeacher === '스포츠강사' && fixedData[`playground-${day}-${period}`] === schedule && schedule !== '';

                    return (
                      <td key={day} 
                        className={cn(
                            "p-2 border h-16 text-center break-words leading-tight transition-colors relative group cursor-pointer hover:bg-gray-50",
                            isSportsDuplicate && 'bg-yellow-200'
                        )}
                        onClick={() => setModalState({isOpen: true, key, value: schedule})}
                      >
                        {schedule}
                        {schedule && 
                            <button className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => handleDelete(e, key)}>
                                <Trash2 size={16} />
                            </button>
                        }
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
     <p className="text-sm text-gray-400 mt-4 text-center">* 스포츠강사 조회 시 노란색 칸은 '운동장' 시간표와 일치하는 수업입니다.</p>
     <TeacherScheduleModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({isOpen: false, key: null, value: ''})}
        scheduleKey={modalState.key}
        currentValue={modalState.value}
        currentTeacher={currentTeacher}
    />
    </>
  );
}

function TeacherPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [currentTeacher, setCurrentTeacher] = useState(searchParams.get('teacher') || TEACHERS[0]);

    const handleSelectTeacher = (teacher: string) => {
        setCurrentTeacher(teacher);
        router.push(`/teacher?teacher=${teacher}`);
    };

    return (
        <section>
            <TeacherSelector currentTeacher={currentTeacher} onSelectTeacher={handleSelectTeacher} />
            <TeacherTimetable currentTeacher={currentTeacher} />
        </section>
    );
}

export default function TeacherPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-[700px]" />}>
            <TeacherPageContent />
        </Suspense>
    )
}
