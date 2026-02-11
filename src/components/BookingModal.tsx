'use client';

import React, { useEffect, useState, useTransition, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ROOMS, PERIOD_KR, DAY_KR, DAYS } from '@/lib/constants';
import type { RoomId, DayId, PeriodId, ExtraReservation } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { setFixedBooking, setExtraBooking } from '@/lib/mutations';
import { formatIsoDate } from '@/lib/date-utils';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';


const BookingFormSchema = z.object({
  fixedBooking: z.string().optional(),
  extraClass: z.string().optional(),
});

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: RoomId;
  day?: DayId;
  period?: PeriodId;
  date?: Date;
}

export default function BookingModal({
  isOpen,
  onClose,
  room,
  day,
  period,
  date,
}: BookingModalProps) {
  const db = useFirestore();
  const dataRootPath = `artifacts/${appId}/public/data`;
  
  const { data: fixedDataRaw } = useCollection(
    useMemo(() => db ? query(collection(db, dataRootPath, 'fixedData')) : null, [db])
  );
  const fixedData = useMemo(() => fixedDataRaw ? Object.fromEntries(fixedDataRaw.map(d => [d.id, d.val])) : {}, [fixedDataRaw]);
  
  const { data: extraRes } = useCollection<ExtraReservation>(
    useMemo(() => db ? query(collection(db, dataRootPath, 'extraRes')) : null, [db])
  );

  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  const fixedKey = room && day && period ? `${room}-${day}-${period}` : '';
  const existingFixed = fixedData[fixedKey] || '';

  const form = useForm<z.infer<typeof BookingFormSchema>>({
    resolver: zodResolver(BookingFormSchema),
    defaultValues: {
      fixedBooking: '',
      extraClass: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        fixedBooking: existingFixed,
        extraClass: '',
      });
    }
  }, [isOpen, existingFixed, form, date]);

  if (!isOpen || !room || !day || !period) {
    return null;
  }

  const handleFormSubmit = (values: z.infer<typeof BookingFormSchema>) => {
    startTransition(async () => {
        try {
            // Handle fixed booking
            if (values.fixedBooking !== existingFixed) {
                await setFixedBooking(db, fixedKey, values.fixedBooking || '');
            }

            // Handle extra booking
            if (values.extraClass && date) {
                const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 6 = Saturday

                if (dayOfWeek === 6 || dayOfWeek === 0) {
                    toast({
                        variant: "destructive",
                        title: "예약 불가",
                        description: "토요일 또는 일요일은 휴일이므로 예약할 수 없습니다.",
                    });
                    return;
                }

                const isoDate = formatIsoDate(date);

                if (extraRes?.some(r => r.room === ROOMS[room] && r.date === isoDate && r.period.toString() === period)) {
                    toast({ variant: "destructive", title: "오류", description: "이미 예약된 시간입니다." });
                    return;
                }
                await setExtraBooking(db, {
                    room: ROOMS[room],
                    date: isoDate,
                    period,
                    className: values.extraClass,
                });
            }
            
            toast({ title: "성공", description: "시간표가 저장되었습니다." });
            onClose();
        } catch (error) {
            toast({ variant: "destructive", title: "오류", description: "저장에 실패했습니다." });
            console.error(error);
        }
    });
  };

  const dayIndex = date ? date.getDay() - 1 : -1;
  const dayNameKr = dayIndex >= 0 && dayIndex < 5 ? DAY_KR[DAYS[dayIndex]] : '';
  const formattedDate = date ? `${date.getMonth() + 1}/${date.getDate()}(${dayNameKr})` : '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-card rounded-2xl p-8 shadow-2xl border-2 border-blue-100">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4 border-b pb-2">관리 및 예약</DialogTitle>
          <div className="p-3 bg-blue-50 rounded-xl text-lg text-blue-700 mb-2 font-bold border text-center">
            📍 {ROOMS[room]} / {formattedDate} {PERIOD_KR[period]}
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="fixedBooking"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="block text-sm font-bold text-gray-500 mb-1">기초 등록 (매주 반복)</FormLabel>
                        <FormControl>
                        <Input placeholder="학급명 입력 후 Enter" {...field} className="w-full border-2 p-3 rounded-xl text-xl h-auto"/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <div className="border-t pt-4">
                    <FormField
                        control={form.control}
                        name="extraClass"
                        render={({ field }) => (
                        <FormItem>
                             <FormLabel className="block text-sm font-bold text-amber-600 mb-2">추가 예약 (선착순)</FormLabel>
                            <FormControl>
                                <Input placeholder="학급명 입력 후 Enter" {...field} className="w-full border-2 p-3 rounded-xl text-xl h-auto"/>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
            </div>
            <DialogFooter className="!mt-8 flex-row gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold text-lg text-gray-600 hover:bg-gray-200 transition-colors h-auto">취소</Button>
                <Button type="submit" className="flex-1 py-3 rounded-xl font-bold text-lg shadow-lg h-auto" disabled={isPending}>
                    {isPending ? '저장 중...' : '저장'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
