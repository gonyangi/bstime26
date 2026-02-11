"use client";

import React, { useState, Suspense, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CLASSES, PERIODS, PERIOD_KR, DAYS, DAY_KR, ROOMS } from '@/lib/constants';
import { Printer, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import PrintView from '@/components/PrintView';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { setSubject, deleteSubject } from '@/lib/mutations';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';

function ClassGrid({
  currentClass,
  onSelectClass,
}: {
  currentClass: string;
  onSelectClass: (cls: string) => void;
}) {
  return (
    <Card className="mb-4 shadow border border-green-100">
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 text-xl">학급 선택</h3>
          <PrintView>
            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md">
              <Printer className="mr-2 h-4 w-4" /> 전학급 인쇄/PDF
            </Button>
          </PrintView>
        </div>
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1">
          {CLASSES.map((cls) => (
            <Button
              key={cls}
              onClick={() => onSelectClass(cls)}
              variant="outline"
              className={cn(
                'p-2 text-sm font-medium transition-all',
                currentClass === cls
                  ? 'border-green-600 bg-green-50 text-green-700 font-bold shadow-sm'
                  : 'bg-white hover:border-green-500'
              )}
            >
              {cls}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SubjectModal({
    isOpen,
    onClose,
    subjectKey,
    currentValue,
    currentClass
} : {
    isOpen: boolean,
    onClose: () => void,
    subjectKey: string | null,
    currentValue: string,
    currentClass: string,
}) {
    const [value, setValue] = useState('');
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const db = useFirestore();

    React.useEffect(() => {
        if(isOpen) setValue(currentValue);
    }, [isOpen, currentValue])

    const handleSave = () => {
        if(!subjectKey) return;
        startTransition(async () => {
            try {
                await setSubject(db, subjectKey, value);
                toast({ title: '저장되었습니다.' });
                onClose();
            } catch (error) {
                console.error(error);
                toast({ title: '저장 실패', variant: 'destructive' });
            }
        });
    }
    
    if(!isOpen || !subjectKey) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>과목 입력</DialogTitle>
                </DialogHeader>
                <p className="text-lg text-gray-500 mb-2 font-bold">{currentClass} 학급 교과목</p>
                <Input
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder="과목 입력 후 Enter"
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

function ClassTimetable({ currentClass }: { currentClass: string }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const dataRootPath = `artifacts/${appId}/public/data`;
  
  const { data: fixedDataRaw, loading: fixedLoading } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'fixedData')) : null, [db])
  );
  const fixedData = useMemo(() => fixedDataRaw ? Object.fromEntries(fixedDataRaw.map(d => [d.id, d.val])) : {}, [fixedDataRaw]);

  const { data: classSubjectsRaw, loading: subjectsLoading } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'classSubjects')) : null, [db])
  );
  const classSubjects = useMemo(() => classSubjectsRaw ? Object.fromEntries(classSubjectsRaw.map(d => [d.id, d.val])) : {}, [classSubjectsRaw]);

  const loading = fixedLoading || subjectsLoading;

  const [modalState, setModalState] = useState({isOpen: false, key: null as string | null, value: ''});

  if (loading) {
    return <Skeleton className="w-full h-[600px] rounded-2xl" />;
  }
  
  if (!currentClass) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-2xl border-2 border-dashed">
        <p className="text-gray-500 text-lg font-medium">학급을 선택해주세요.</p>
      </div>
    );
  }
  
  const handleDeleteSubject = async (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    try {
        await deleteSubject(db, key);
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
            <thead className="bg-green-600 text-white text-lg font-bold">
              <tr>
                <th className="p-3 w-24 border-r">교시</th>
                {DAYS.map((day) => (
                  <th key={day} className="p-3 w-1/5 border-r">{DAY_KR[day]}</th>
                ))}
              </tr>
            </thead>
            <tbody className="text-base">
              {PERIODS.map((period) => (
                <tr key={period} className="border-b">
                  <td className="p-2 bg-gray-50 font-bold border-r text-sm text-center h-24">{PERIOD_KR[period]}</td>
                  {DAYS.map((day) => {
                    const subjectKey = `${currentClass}-${day}-${period}`;
                    const subject = classSubjects[subjectKey] || '';
                    
                    let roomName = '';
                    for (const key in fixedData) {
                        if(fixedData[key] === currentClass) {
                            const [room, d, p] = key.split('-');
                            if(d === day && p === period) {
                                roomName = ROOMS[room as keyof typeof ROOMS] || '';
                                break;
                            }
                        }
                    }

                    return (
                      <td key={day} 
                        className="p-1 border-r h-24 text-center relative group cursor-pointer hover:bg-gray-50"
                        onClick={() => setModalState({isOpen: true, key: subjectKey, value: subject})}
                      >
                        {roomName && <div className="text-xs text-blue-600 font-bold leading-tight">{roomName}</div>}
                        <div className="text-lg font-bold text-gray-700 leading-tight mt-1">{subject}</div>
                        {subject && (
                            <button className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => handleDeleteSubject(e, subjectKey)}>
                                <Trash2 size={16} />
                            </button>
                        )}
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
    <SubjectModal 
        isOpen={modalState.isOpen}
        onClose={() => setModalState({isOpen: false, key: null, value: ''})}
        subjectKey={modalState.key}
        currentValue={modalState.value}
        currentClass={currentClass}
    />
    </>
  );
}

function ClassPageContent(){
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentClass, setCurrentClass] = useState(searchParams.get('class') || '');

  const handleSelectClass = (cls: string) => {
    setCurrentClass(cls);
    router.push(`/class?class=${cls}`);
  };

  return(
    <section>
      <ClassGrid currentClass={currentClass} onSelectClass={handleSelectClass} />
      <ClassTimetable currentClass={currentClass} />
    </section>
  )
}

export default function ClassPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-[700px]" />}>
            <ClassPageContent/>
        </Suspense>
    )
}
