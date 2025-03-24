import {
    RemId,
    QueueInteractionScore,
  } from '@remnote/plugin-sdk';

export interface HistoryData {
  key: number;
  remId: RemId;
  open: boolean;
  time: number;
  score: QueueInteractionScore;
  question: string;
}