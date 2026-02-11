"use client";

import React, { useRef, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Trash2 } from 'lucide-react';
import { importCsvData, resetAllData } from '@/lib/mutations';
import { useFirestore } from '@/firebase';

export default function DataTools() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const db = useFirestore();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      startTransition(async () => {
        try {
          const content = e.target?.result as string;
          await importCsvData(db, content);
          toast({
            title: '가져오기 성공',
            description: 'CSV 데이터가 성공적으로 반영되었습니다.',
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: '가져오기 실패',
            description: 'CSV 파일을 처리하는 중 오류가 발생했습니다.',
          });
          console.error(error);
        }
      });
    };
    reader.readAsText(file, 'EUC-KR');
    
    // Reset file input
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    startTransition(async () => {
        try {
            await resetAllData(db);
            toast({
                title: '초기화 성공',
                description: '모든 데이터가 삭제되었습니다.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: '초기화 실패',
                description: '데이터를 삭제하는 중 오류가 발생했습니다.',
            });
        }
    });
  }

  return (
    <div className="flex flex-wrap gap-3">
      <input
        type="file"
        id="csv-upload"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={isPending}
      />
      <Button onClick={() => fileInputRef.current?.click()} className="text-lg px-6 py-3 shadow-md" disabled={isPending}>
        <Upload className="mr-2 h-5 w-5" />
        {isPending ? '업로드 중...' : '통합 시간표(CSV) 업로드'}
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" className="text-lg px-6 py-3 shadow-md" disabled={isPending}>
            <Trash2 className="mr-2 h-5 w-5" />
            데이터 완전 삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 모든 시간표와 예약 데이터가 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>계속</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
