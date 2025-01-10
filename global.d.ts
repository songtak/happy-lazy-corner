export {};
interface Adfit {
  display: (unit: string) => void;
  destroy: (unit: string) => void;
  refresh: (unit: string) => void;
}

declare global {
  interface Window {
    adfit?: Adfit;
  }

  interface DROPDOWN {
    // id: number;
    key: string | number;
    value: string | number;
  }
}
