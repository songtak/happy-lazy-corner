export {};
interface Adfit {
  display: (unit: string) => void;
  destroy: (unit: string) => void;
  refresh: (unit: string) => void;
}

// 컴포넌트 파일 또는 src/global.d.ts에 추가
declare global {
  interface Window {
    PartnersCoupang: {
      G: new (options: {
        id: number;
        template: string;
        trackingCode: string;
        width: string;
        height: string;
        tsource?: string;
        container?: string;
      }) => void;
    };
  }
}
