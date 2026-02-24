import type { Timestamp } from "firebase/firestore";

export interface Contraction {
  id: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSec: number;
  intervalSec: number | null;
}

export interface StoredContraction extends Omit<Contraction, 'id'> {
  id?: string;
}
