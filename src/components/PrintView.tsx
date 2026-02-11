'use client';

import React, { useRef, cloneElement, useMemo } from 'react';
import { CLASSES, PERIODS, PERIOD_KR, DAYS, DAY_KR, ROOMS } from '@/lib/constants';
import { Skeleton } from './ui/skeleton';
import { useCollection, useFirestore, appId } from '@/firebase';
import { collection, query } from 'firebase/firestore';

const PrintableContent = React.forwardRef<HTMLDivElement>((props, ref) => {
  const db = useFirestore();
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

  if (loading) {
    return (
        <div ref={ref} className="p-4 print-area">
            <Skeleton className="w-full h-[100vh]" />
        </div>
    );
  }

  return (
    <div ref={ref} className="print-area">
      <h1 className="text-3xl font-bold text-center mb-8">봉선초등학교 전학급 시간표 통합 리포트</h1>
      {CLASSES.map((cls) => (
        <div key={cls} className="page-break">
          <h2 className="text-2xl font-bold mb-4 text-center border-b-2 pb-2 mt-8 text-gray-800">
            {cls} 시간표
          </h2>
          <table className="w-full text-center border-collapse table-fixed">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border border-black w-24 text-center">교시</th>
                {DAYS.map(d => <th key={d} className="border border-black w-1/5">{DAY_KR[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr key={p}>
                  <td className="p-2 border border-black font-bold text-gray-600 text-center">{PERIOD_KR[p]}</td>
                  {DAYS.map((d) => {
                    let roomName = "";
                    Object.entries(fixedData).forEach(([slot, name]) => {
                      if (name === cls && slot.includes(`-${d}-${p}`)) {
                        const roomId = slot.split('-')[0] as keyof typeof ROOMS;
                        if(ROOMS[roomId]) {
                           roomName = ROOMS[roomId];
                        }
                      }
                    });
                    const subject = classSubjects[`${cls}-${d}-${p}`] || "";
                    return (
                      <td key={d} className="p-2 border border-black min-h-[60px] text-center break-words align-top">
                        <div className="text-[10px] text-blue-600 font-bold">{roomName}</div>
                        <div className="text-base font-bold text-gray-800 mt-1">{subject}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
});

PrintableContent.displayName = 'PrintableContent';

const PrintView = ({ children }: { children: React.ReactElement }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      {cloneElement(children, { onClick: handlePrint })}
      <div className="hidden">
        <PrintableContent />
      </div>
    </div>
  );
};

export default PrintView;
