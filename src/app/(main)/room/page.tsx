"use client";

import React, { useState, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ROOMS, PERIODS, PERIOD_KR, DAYS, DAY_KR } from '@/lib/constants';
import type { RoomId, DayId, PeriodId, ExtraReservation } from '@/lib/types';
import BookingModal from '@/components/BookingModal';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMonday, formatIsoDate } from '@/lib/date-utils';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { setFixedBooking, deleteFixedBooking, deleteExtraBooking } from '@/lib/mutations';


function WeekNavigator({
  currentDate,
  onPrevWeek,
  onNextWeek,
}: {
  currentDate: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const monday = getMonday(currentDate);
  const formattedDate = `${monday.getFullYear()}년 ${monday.getMonth() + 1}월`;

  return (
    <div className="flex items-center justify-center gap-4 mb-4">
      <Button variant="outline" size="icon" onClick={onPrevWeek} className="h-10 w-10">
        <ChevronLeft className="h-6 w-6" />
      </Button>
      <div className="text-xl font-bold text-center w-48">
        {formattedDate}
      </div>
      <Button variant="outline" size="icon" onClick={onNextWeek} className="h-10 w-10">
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}

function RoomSelector({
  currentRoom,
  onSelectRoom,
}: {
  currentRoom: RoomId;
  onSelectRoom: (room: RoomId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 justify-center">
      {Object.entries(ROOMS).map(([id, name]) => (
        <Button
          key={id}
          className={cn(
            'px-4 py-2 rounded-lg border-2 font-bold text-base transition-all',
            currentRoom === id 
            ? 'border-blue-600 bg-blue-50 text-blue-600 shadow-sm' 
            : 'bg-white border-gray-200 text-gray-500'
          )}
          onClick={() => onSelectRoom(id as RoomId)}
        >
          {name}
        </Button>
      ))}
    </div>
  );
}

function TimetableGrid({ currentRoom, currentDate }: { currentRoom: RoomId; currentDate: Date }) {
  const db = useFirestore();
  const { toast } = useToast();
  
  const dataRootPath = `artifacts/${appId}/public/data`;

  const { data: fixedDataRaw, loading: fixedLoading } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'fixedData')) : null, [db])
  );
  const fixedData = useMemo(() => fixedDataRaw ? Object.fromEntries(fixedDataRaw.map(d => [d.id, d.val])) : {}, [fixedDataRaw]);
  
  const { data: extraRes, loading: extraLoading } = useCollection<ExtraReservation>(
    useMemo(() => db ? query(collection(db, dataRootPath, 'extraRes')) : null, [db])
  );
  
  const loading = fixedLoading || extraLoading;

  const [modalState, setModalState] = useState<{
    open: boolean;
    day?: DayId;
    period?: PeriodId;
    date?: Date;
  }>({ open: false });

  const openModal = (day: DayId, period: PeriodId, date: Date) => {
    setModalState({ open: true, day, period, date });
  };

  const handleDeleteFixed = useCallback(async (key: string) => {
    if (!db) {
      toast({ title: 'DB 연결 오류', variant: 'destructive' });
      return;
    }

    try {
      await deleteFixedBooking(db, key);
      toast({ title: '삭제 완료' });
    } catch (error) {
      console.error('삭제 실패:', error);
      toast({ title: '삭제 실패', variant: 'destructive' });
    }
  }, [db, toast]);

  const handleDeleteExtra = useCallback(async (id: string) => {
    if (!db) {
      toast({ title: 'DB 연결 오류', variant: 'destructive' });
      return;
    }

    try {
      await deleteExtraBooking(db, id);
      toast({ title: '삭제 완료' });
    } catch (error) {
      console.error('삭제 실패:', error);
      toast({ title: '삭제 실패', variant: 'destructive' });
    }
  }, [db, toast]);

  if (loading) {
    return <Skeleton className="w-full h-[600px] rounded-2xl" />;
  }

  const monday = getMonday(currentDate);
  const weekDates = Array.from({ length: 5 }).map((_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date;
  });

  const extraResMap: { [key: string]: ExtraReservation } = {};
  extraRes
    ?.filter(res => res.room === ROOMS[currentRoom])
    .forEach(res => {
      extraResMap[`${res.date}-${res.period}`] = res;
    });

  return (
    <>
      <Card className="shadow-lg overflow-hidden border">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse">
              <thead className="bg-primary text-primary-foreground text-lg font-bold">
                <tr>
                  <th className="p-3 w-20 sm:w-24 border-b">교시</th>
                  {weekDates.map((date, index) => (
                    <th key={DAYS[index]} className="border-b w-1/5">
                      {`${date.getMonth() + 1}/${date.getDate()}${DAY_KR[DAYS[index]]}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-xl">
                {PERIODS.map((period) => (
                  <tr key={period}>
                    <td className="p-3 bg-gray-50 font-bold text-gray-400 border text-sm text-center h-20">{PERIOD_KR[period]}</td>
                    {weekDates.map((date, dayIndex) => {
                      const day = DAYS[dayIndex];
                      const fixedKey = `${currentRoom}-${day}-${period}`;
                      const fixedBooking = fixedData[fixedKey];

                      const isoDate = formatIsoDate(date);
                      const extraBooking = extraResMap[`${isoDate}-${period}`];

                      const hasBooking = !!extraBooking || !!fixedBooking;
                      
                      return (
                        <td
                          key={day}
                          className={cn(
                            'p-2 border h-20 text-xl text-center break-words leading-tight relative group',
                            extraBooking 
                              ? 'bg-amber-100 text-amber-800 font-bold' 
                              : fixedBooking 
                                ? 'bg-blue-50 text-blue-800 font-bold' 
                                : 'bg-white hover:bg-gray-50 cursor-pointer'
                          )}
                          onClick={() => {
                            if (!hasBooking) {
                              openModal(day, period, date);
                            }
                          }}
                        >
                          {extraBooking ? (
                            <>
                              {extraBooking.className}
                              <button
                                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteExtra(extraBooking.id);
                                }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              {fixedBooking}
                              {fixedBooking && (
                                <button
                                  className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFixed(fixedKey);
                                  }}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
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
      <BookingModal
        isOpen={modalState.open}
        onClose={() => setModalState({ ...modalState, open: false })}
        room={currentRoom}
        day={modalState.day}
        period={modalState.period}
        date={modalState.date}
      />
    </>
  );
}

function RoomPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentRoom, setCurrentRoom] = useState<RoomId>((searchParams.get('room') as RoomId) || 'gangdang');
  const [currentDate, setCurrentDate] = useState(new Date('2026-03-02T00:00:00'));

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const updateQuery = (room: RoomId) => {
    router.push(`/room?room=${room}`);
  };

  const handleSelectRoom = (room: RoomId) => {
    setCurrentRoom(room);
    updateQuery(room);
  };
  
  return (
    <section>
      <RoomSelector currentRoom={currentRoom} onSelectRoom={handleSelectRoom} />
      <WeekNavigator currentDate={currentDate} onPrevWeek={handlePrevWeek} onNextWeek={handleNextWeek} />
      <TimetableGrid currentRoom={currentRoom} currentDate={currentDate} />
    </section>
  );
}

export default function RoomPage() {
    return (
        <Suspense fallback={<Skeleton className="w-full h-[700px]" />}>
            <RoomPageContent />
        </Suspense>
    )
}
