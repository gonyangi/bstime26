import type { RoomId } from "./types";

export const ROOMS: { [key in RoomId]: string } = {
  gangdang: "강당",
  playground: "운동장",
  science: "과학실",
  library: "도서실",
  imagination: "상상놀이터",
  computer: "컴퓨터실",
};
export const PERIODS = ['1', '2', '3', '4', 'lunch', '5', '6'];
export const PERIOD_KR: { [key: string]: string } = {
  '1': '1교시',
  '2': '2교시',
  '3': '3교시',
  '4': '4교시',
  'lunch': '점심',
  '5': '5교시',
  '6': '6교시',
};
export const PERIOD_ORDER: { [key: string]: number } = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  'lunch': 5,
  '5': 6,
  '6': 7,
};
export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri'];
export const DAY_KR: { [key: string]: string } = {
  mon: '월',
  tue: '화',
  wed: '수',
  thu: '목',
  fri: '금',
};
export const CLASSES = [
  '1-1', '1-2',
  '2-1', '2-2',
  '3-1', '3-2',
  '4-1', '4-2', '4-3',
  '5-1', '5-2',
  '6-1', '6-2', '6-3'
];
export const TEACHERS = ['교무', '연구', '생활', '스포츠강사', '기초학력', '생활지원'];
