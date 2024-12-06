import { useEffect, useRef } from "react";

function CoupangAd({ id, trackingCode, width, height }: any) {
  const adContainerRef = useRef<HTMLDivElement | null>(null);

  console.log("width", width);

  useEffect(() => {
    // 동적으로 스크립트 추가
    const script = document.createElement("script");
    script.src = "https://ads-partners.coupang.com/g.js";
    script.async = true;

    if (adContainerRef.current) {
      adContainerRef.current.appendChild(script);
    }

    // 스크립트 로드 완료 후 광고 초기화
    script.onload = () => {
      /** @ts-ignore */
      if (window?.PartnersCoupang?.G) {
        /** @ts-ignore */
        new window.PartnersCoupang.G({
          id: id,
          template: "carousel",
          trackingCode: trackingCode,
          width: width.toString(),
          height: height.toString(),
          tsource: "",
          container: adContainerRef.current, // 특정 컨테이너에 삽입
        });
      } else {
        console.error("PartnersCoupang is not defined.");
      }
    };

    // 컴포넌트 언마운트 시 cleanup
    return () => {
      if (adContainerRef.current) {
        adContainerRef.current.innerHTML = ""; // 컨테이너 초기화
      }
    };
  }, [width, height]);

  return <div ref={adContainerRef} style={{ width, height }}></div>;
}

export default CoupangAd;

// import { useEffect, useRef } from "react";

// function CoupangAd({ id, trackingCode, width, height }: any) {
//   const scriptElementWrapper = useRef<HTMLDivElement | null>(null);

//   useEffect(() => {
//     // 동적으로 스크립트를 추가
//     const script = document.createElement("script");
//     script.src = "https://ads-partners.coupang.com/g.js";
//     script.async = true;

//     if (scriptElementWrapper.current) {
//       scriptElementWrapper.current.appendChild(script);
//     }

//     // Cleanup
//     return () => {
//       // Coupang 광고 스크립트는 destroy 메서드가 제공되지 않으므로,
//       // 스크립트를 제거하고 DOM 초기화만 수행
//       if (scriptElementWrapper.current) {
//         scriptElementWrapper.current.innerHTML = ""; // 광고 DOM 초기화
//       }
//     };
//   }, []);

//   return (
//     <div ref={scriptElementWrapper}>
//       <ins
//         className="coupang_ad_area"
//         style={{ display: "none" }}
//         data-id={id}
//         data-template="carousel"
//         data-tracking-code={trackingCode}
//         data-width={width}
//         data-height={height}
//       ></ins>
//     </div>
//   );
// }

// export default CoupangAd;

// import React, { useEffect } from "react";
/** 욀쪽 광고 */
// {"id":823795,"template":"carousel","trackingCode":"AF3245048","width":"120","height":"400"}
/** 오른쪽 광고 */
// {"id":823796,"template":"carousel","trackingCode":"AF3245048","width":"120","height":"400","tsource":""}

// type AD = {
//   id: number;
//   trackingCode: string;
//   width: string;
//   height: string;
// };

// const CoupangAd = ({ id, trackingCode, width, height }: AD) => {
//   useEffect(() => {
//     // 광고 스크립트를 동적으로 추가
//     const script1 = document.createElement("script");
//     script1.src = "https://ads-partners.coupang.com/g.js";
//     script1.async = true;

//     // script1이 로드된 후 PartnersCoupang.G 호출
//     script1.onload = () => {
//       const script2 = document.createElement("script");
//       script2.innerHTML = `
//         new PartnersCoupang.G({
//           id: 823795,
//           template: "carousel",
//           trackingCode: AF3245048,
//           width: 120,
//           height: 400,
//         //   id: ${id},
//         //   template: "carousel",
//         //   trackingCode: ${trackingCode},
//         //   width: ${width},
//         //   height: ${height},
//           tsource: ""
//         });
//       `;
//       document.body.appendChild(script2);
//     };

//     document.body.appendChild(script1);

//     // 클린업
//     return () => {
//       document.body.removeChild(script1);
//     };
//   }, []);

//   return <div></div>; // 광고 스크립트가 로드될 때 필요한 컨테이너
// };

// export default CoupangAd;
