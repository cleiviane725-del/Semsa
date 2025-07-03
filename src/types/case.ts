export interface Case {
  id: number;
  name: string;
  number: string;
  description: string;
  created_at: string;
  file?: {
    name: string;
    type: string;
    data: ArrayBuffer;
  };
}