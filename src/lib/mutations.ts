'use client';

import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  writeBatch,
  getDocs,
  query,
  getDoc,
  type Firestore,
} from 'firebase/firestore';
import { appId } from '@/firebase';
import type { PeriodId } from './types';
import { ROOMS, DAY_KR, PERIOD_KR, TEACHERS } from './constants';

/* ============================================================
   [수정] Firestore 경로를 세그먼트 배열로 분리
   - doc()에 슬래시가 포함된 문자열을 통째로 넣으면
     Firebase SDK 버전에 따라 파싱이 불안정할 수 있음
   - 각 세그먼트를 개별 인자로 전달하는 헬퍼 함수 사용
============================================================ */

/** data 하위 특정 컬렉션의 문서 참조를 반환하는 헬퍼 */
function getDataDocRef(db: Firestore, collectionName: string, docId: string) {
  // 경로: artifacts/{appId}/public/data/{collectionName}/{docId}
  // doc()에 개별 세그먼트로 전달하여 안정적으로 동작하도록 함
  return doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId);
}

/** data 하위 특정 컬렉션 참조를 반환하는 헬퍼 */
function getDataCollectionRef(db: Firestore, collectionName: string) {
  return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
}


/* ============================================================
   고정 시간표 (fixedData) CRUD
============================================================ */
export async function setFixedBooking(db: Firestore, key: string, value: string) {
  const docRef = getDataDocRef(db, 'fixedData', key);
  if (value) {
    await setDoc(docRef, { val: value });
  } else {
    await deleteDoc(docRef);
  }
}

export async function deleteFixedBooking(db: Firestore, key: string) {
  const docRef = getDataDocRef(db, 'fixedData', key);

  // [수정] 삭제 전 문서 존재 여부 확인 (디버깅용)
  const snapshot = await getDoc(docRef);
  console.log(`[deleteFixedBooking] path: ${docRef.path}, exists: ${snapshot.exists()}`);

  if (!snapshot.exists()) {
    console.warn(`[deleteFixedBooking] 문서가 존재하지 않습니다: ${docRef.path}`);
    return;
  }

  await deleteDoc(docRef);
  console.log(`[deleteFixedBooking] 삭제 완료: ${docRef.path}`);
}


/* ============================================================
   추가 예약 (extraRes) CRUD
============================================================ */
export async function setExtraBooking(
  db: Firestore,
  data: { room: string; date: string; period: PeriodId; className: string }
) {
  const id = `${data.date}-${data.room}-${data.period}`;
  const docRef = getDataDocRef(db, 'extraRes', id);
  await setDoc(docRef, data);
}

export async function deleteExtraBooking(db: Firestore, id: string) {
  const docRef = getDataDocRef(db, 'extraRes', id);

  // [수정] 삭제 전 문서 존재 여부 확인 (디버깅용)
  const snapshot = await getDoc(docRef);
  console.log(`[deleteExtraBooking] path: ${docRef.path}, exists: ${snapshot.exists()}`);

  if (!snapshot.exists()) {
    console.warn(`[deleteExtraBooking] 문서가 존재하지 않습니다: ${docRef.path}`);
    return;
  }

  await deleteDoc(docRef);
  console.log(`[deleteExtraBooking] 삭제 완료: ${docRef.path}`);
}


/* ============================================================
   교과목 (classSubjects) CRUD
============================================================ */
export async function setSubject(db: Firestore, key: string, value: string) {
  const docRef = getDataDocRef(db, 'classSubjects', key);
  if (value) {
    await setDoc(docRef, { val: value });
  } else {
    await deleteDoc(docRef);
  }
}

export async function deleteSubject(db: Firestore, key: string) {
  const docRef = getDataDocRef(db, 'classSubjects', key);
  await deleteDoc(docRef);
}


/* ============================================================
   교사 일정 (teacherSchedules) CRUD
============================================================ */
export async function setTeacherSchedule(db: Firestore, key: string, value: string) {
  const docRef = getDataDocRef(db, 'teacherSchedules', key);
  if (value) {
    await setDoc(docRef, { val: value });
  } else {
    await deleteDoc(docRef);
  }
}

export async function deleteTeacherSchedule(db: Firestore, key: string) {
  const docRef = getDataDocRef(db, 'teacherSchedules', key);
  await deleteDoc(docRef);
}


/* ============================================================
   전체 데이터 초기화
============================================================ */
export async function resetAllData(db: Firestore) {
  const collections = ['fixedData', 'extraRes', 'classSubjects', 'teacherSchedules'];
  const batch = writeBatch(db);

  for (const colName of collections) {
    // [수정] 헬퍼 함수 사용
    const q = query(getDataCollectionRef(db, colName));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
  }

  await batch.commit();
}


/* ============================================================
   CSV 데이터 가져오기
============================================================ */
export async function importCsvData(db: Firestore, csvContent: string) {
  const lines = csvContent.split('\n').filter((line) => line.trim() !== '');
  const batch = writeBatch(db);

  const roomNameToId = Object.fromEntries(
    Object.entries(ROOMS).map(([id, name]) => [name, id])
  );
  const dayKrToId = Object.fromEntries(
    Object.entries(DAY_KR).map(([id, name]) => [name, id])
  );
  const periodKrToId = Object.fromEntries(
    Object.entries(PERIOD_KR).map(([id, name]) => [name, id])
  );

  for (const line of lines) {
    const columns = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (columns.length < 5) continue;

    const [name, dayStr, periodStr, content, type] = columns;
    const dayId = dayKrToId[dayStr.replace('요일', '')];
    const periodId =
      periodKrToId[periodStr] ||
      Object.keys(PERIOD_KR).find(
        (key) => PERIOD_KR[key] === periodStr || key === periodStr
      );

    if (!dayId || !periodId || !content) continue;

    if (type === '기초시간표') {
      const roomId = roomNameToId[name];
      if (roomId) {
        const key = `${roomId}-${dayId}-${periodId}`;
        // [수정] 헬퍼 함수 사용
        const docRef = getDataDocRef(db, 'fixedData', key);
        batch.set(docRef, { val: content });
      }
    } else if (type === '교담시간표') {
      const teacherName = name === '장현수' ? '스포츠강사' : name;
      if (TEACHERS.includes(teacherName)) {
        const key = `${teacherName}-${dayId}-${periodId}`;
        // [수정] 헬퍼 함수 사용
        const docRef = getDataDocRef(db, 'teacherSchedules', key);
        batch.set(docRef, { val: content });
      }
    }
  }

  await batch.commit();
}
