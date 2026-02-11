'use client';

import React, { useMemo } from 'react';
import { PERIOD_KR, PERIOD_ORDER } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { deleteExtraBooking } from '@/lib/mutations';
import { useToast } from '@/hooks/use-toast';
import type { ExtraReservation } from '@/lib/types';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';


export default function StatusView() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const dataRootPath = `artifacts/${appId}/public/data`;
  const { data: extraRes, loading } = useCollection<ExtraReservation>(
    useMemo(() => db ? query(collection(db, dataRootPath, 'extraRes')) : null, [db])
  );


  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-full h-24" />
        <Skeleton className="w-full h-24" />
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteExtraBooking(db, id);
      toast({ title: '삭제 완료', description: '예약이 삭제되었습니다.' });
    } catch (error) {
      toast({ variant: 'destructive', title: '삭제 실패' });
    }
  };

  const groupedReservations = extraRes?.reduce((acc, res) => {
    (acc[res.room] = acc[res.room] || []).push(res);
    return acc;
  }, {} as Record<string, ExtraReservation[]>) || {};

  // Sort by date and then period within each group
  for (const room in groupedReservations) {
    groupedReservations[room].sort((a, b) => {
        const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateDiff !== 0) return dateDiff;
        return PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period];
    });
  }

  const allLocations = [...new Set(Object.keys(groupedReservations))];

  if (!extraRes || extraRes.length === 0) {
    return <p className="text-center text-gray-400 py-10 text-xl italic font-bold">등록된 추가 예약 내역이 없습니다.</p>;
  }

  return (
    <div className="space-y-4">
      {allLocations.map((room) => {
        const reservations = groupedReservations[room];
        if (!reservations || reservations.length === 0) return null;
        
        return (
            <div key={room} className="border-2 rounded-xl overflow-hidden shadow-sm bg-white border-slate-200 text-left">
                <div className="bg-slate-50 p-4 font-bold border-b-2 flex justify-between items-center text-xl">
                    <span>📍 {room}</span>
                    <span className="bg-slate-200 px-3 py-1 rounded-full text-slate-700 text-sm">{reservations.length}건</span>
                </div>
                <div className="divide-y-2">
                {reservations.map((res) => (
                    <div key={res.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-xl">
                        <div>
                            <span className="font-bold text-amber-600">{res.date}</span>
                            <span className="mx-3 text-gray-300">|</span>
                            <span>{PERIOD_KR[res.period]}</span>
                            <span className="ml-4 font-bold underline decoration-amber-200 decoration-4">{res.className}</span>
                        </div>
                        <div className="flex gap-4 text-base font-bold">
                            <Button variant="ghost" className="text-red-400 hover:underline hover:bg-transparent" onClick={() => handleDelete(res.id)}>삭제</Button>
                        </div>
                    </div>
                ))}
                </div>
            </div>
        )})}
    </div>
  );
}
