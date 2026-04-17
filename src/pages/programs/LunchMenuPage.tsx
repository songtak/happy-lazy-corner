import React, { useState } from "react";

const lunchMenus = [
  { id: 1, name: "김치찌개", category: "한식", tags: ["국물", "얼큰"] },
  { id: 2, name: "된장찌개", category: "한식", tags: ["국물", "구수"] },
  { id: 3, name: "순두부찌개", category: "한식", tags: ["국물", "얼큰"] },
  { id: 4, name: "부대찌개", category: "한식", tags: ["국물", "얼큰"] },
  { id: 5, name: "제육볶음", category: "한식", tags: ["고기", "매운"] },
  { id: 6, name: "불고기", category: "한식", tags: ["고기", "달달"] },
  { id: 7, name: "비빔밥", category: "한식", tags: ["밥", "가벼운"] },
  { id: 8, name: "돌솥비빔밥", category: "한식", tags: ["밥", "든든"] },
  { id: 9, name: "냉면", category: "한식", tags: ["면", "시원"] },
  { id: 10, name: "물냉면", category: "한식", tags: ["면", "시원"] },
  { id: 11, name: "비빔냉면", category: "한식", tags: ["면", "매운"] },
  { id: 12, name: "칼국수", category: "한식", tags: ["면", "국물"] },
  { id: 13, name: "잔치국수", category: "한식", tags: ["면", "가벼운"] },
  { id: 14, name: "콩국수", category: "한식", tags: ["면", "시원"] },
  { id: 15, name: "김치볶음밥", category: "한식", tags: ["밥", "든든"] },
  { id: 16, name: "계란볶음밥", category: "한식", tags: ["밥", "가벼운"] },
  { id: 17, name: "오징어볶음", category: "한식", tags: ["해산물", "매운"] },
  { id: 18, name: "닭갈비", category: "한식", tags: ["고기", "매운"] },
  { id: 19, name: "닭볶음탕", category: "한식", tags: ["고기", "국물"] },
  { id: 20, name: "삼겹살정식", category: "한식", tags: ["고기", "든든"] },
  { id: 21, name: "갈비탕", category: "한식", tags: ["국물", "고기"] },
  { id: 22, name: "설렁탕", category: "한식", tags: ["국물", "든든"] },
  { id: 23, name: "곰탕", category: "한식", tags: ["국물", "든든"] },
  { id: 24, name: "육개장", category: "한식", tags: ["국물", "얼큰"] },
  { id: 25, name: "콩나물국밥", category: "한식", tags: ["국물", "가성비"] },
  { id: 26, name: "순대국밥", category: "한식", tags: ["국물", "든든"] },
  { id: 27, name: "돼지국밥", category: "한식", tags: ["국물", "든든"] },
  { id: 28, name: "감자탕", category: "한식", tags: ["국물", "든든"] },
  { id: 29, name: "보쌈정식", category: "한식", tags: ["고기", "정식"] },
  { id: 30, name: "쌈밥정식", category: "한식", tags: ["건강", "정식"] },
  { id: 31, name: "낙지볶음", category: "한식", tags: ["해산물", "매운"] },
  { id: 32, name: "쭈꾸미볶음", category: "한식", tags: ["해산물", "매운"] },
  { id: 33, name: "코다리조림", category: "한식", tags: ["생선", "매운"] },
  {
    id: 34,
    name: "고등어구이정식",
    category: "한식",
    tags: ["생선", "정식"],
  },
  { id: 35, name: "갈치조림", category: "한식", tags: ["생선", "국물"] },
  { id: 36, name: "고등어조림", category: "한식", tags: ["생선", "국물"] },
  { id: 37, name: "청국장", category: "한식", tags: ["국물", "구수"] },
  { id: 38, name: "동태탕", category: "한식", tags: ["국물", "생선"] },
  { id: 39, name: "알탕", category: "한식", tags: ["국물", "얼큰"] },
  { id: 40, name: "해물순두부", category: "한식", tags: ["국물", "해산물"] },
  { id: 41, name: "차돌된장찌개", category: "한식", tags: ["국물", "고기"] },
  { id: 42, name: "뚝배기불고기", category: "한식", tags: ["국물", "고기"] },
  { id: 43, name: "소불고기전골", category: "한식", tags: ["국물", "고기"] },
  { id: 44, name: "만둣국", category: "한식", tags: ["국물", "가벼운"] },
  { id: 45, name: "떡만둣국", category: "한식", tags: ["국물", "든든"] },
  { id: 46, name: "수제비", category: "한식", tags: ["국물", "가성비"] },
  { id: 47, name: "들깨수제비", category: "한식", tags: ["국물", "구수"] },
  { id: 48, name: "바지락칼국수", category: "한식", tags: ["면", "해산물"] },
  { id: 49, name: "들깨칼국수", category: "한식", tags: ["면", "구수"] },
  { id: 50, name: "비빔국수", category: "한식", tags: ["면", "매운"] },

  { id: 51, name: "보리비빔밥", category: "한식", tags: ["밥", "건강"] },
  { id: 52, name: "열무비빔밥", category: "한식", tags: ["밥", "가벼운"] },
  { id: 53, name: "새싹비빔밥", category: "한식", tags: ["밥", "건강"] },
  { id: 54, name: "산채비빔밥", category: "한식", tags: ["밥", "건강"] },
  { id: 55, name: "김치제육덮밥", category: "한식", tags: ["밥", "고기"] },
  { id: 56, name: "오징어덮밥", category: "한식", tags: ["밥", "매운"] },
  { id: 57, name: "불낙전골", category: "한식", tags: ["국물", "고기"] },
  { id: 58, name: "닭곰탕", category: "한식", tags: ["국물", "고기"] },
  { id: 59, name: "추어탕", category: "한식", tags: ["국물", "보양"] },
  { id: 60, name: "황태해장국", category: "한식", tags: ["국물", "시원"] },
  { id: 61, name: "북엇국", category: "한식", tags: ["국물", "시원"] },
  { id: 62, name: "미역국정식", category: "한식", tags: ["국물", "가벼운"] },
  { id: 63, name: "우거지국밥", category: "한식", tags: ["국물", "든든"] },
  { id: 64, name: "시래기국밥", category: "한식", tags: ["국물", "건강"] },
  {
    id: 65,
    name: "버섯불고기전골",
    category: "한식",
    tags: ["국물", "고기"],
  },
  { id: 66, name: "닭한마리칼국수", category: "한식", tags: ["면", "고기"] },
  { id: 67, name: "떡볶이정식", category: "한식", tags: ["분식", "매운"] },
  { id: 68, name: "라볶이", category: "한식", tags: ["분식", "면"] },
  { id: 69, name: "치즈떡볶이", category: "한식", tags: ["분식", "매운"] },
  { id: 70, name: "쫄면", category: "한식", tags: ["면", "매운"] },
  { id: 71, name: "비빔만두", category: "한식", tags: ["분식", "가벼운"] },
  { id: 72, name: "김밥", category: "한식", tags: ["분식", "간단"] },
  { id: 73, name: "참치김밥", category: "한식", tags: ["분식", "간단"] },
  { id: 74, name: "돈까스김밥", category: "한식", tags: ["분식", "든든"] },
  { id: 75, name: "치즈김밥", category: "한식", tags: ["분식", "간단"] },
  { id: 76, name: "멸치국수", category: "한식", tags: ["면", "가벼운"] },
  { id: 77, name: "라면정식", category: "한식", tags: ["분식", "간단"] },
  { id: 78, name: "참치마요덮밥", category: "한식", tags: ["밥", "간단"] },
  { id: 79, name: "스팸마요덮밥", category: "한식", tags: ["밥", "간단"] },
  { id: 80, name: "김치참치덮밥", category: "한식", tags: ["밥", "간단"] },

  { id: 81, name: "돈까스", category: "일식", tags: ["튀김", "든든"] },
  { id: 82, name: "치즈돈까스", category: "일식", tags: ["튀김", "치즈"] },
  {
    id: 83,
    name: "고구마치즈돈까스",
    category: "일식",
    tags: ["튀김", "치즈"],
  },
  { id: 84, name: "카레라이스", category: "일식", tags: ["밥", "든든"] },
  { id: 85, name: "치킨카레", category: "일식", tags: ["밥", "고기"] },
  { id: 86, name: "새우카레", category: "일식", tags: ["밥", "해산물"] },
  { id: 87, name: "우동", category: "일식", tags: ["면", "국물"] },
  { id: 88, name: "냉우동", category: "일식", tags: ["면", "시원"] },
  { id: 89, name: "튀김우동", category: "일식", tags: ["면", "튀김"] },
  { id: 90, name: "소바", category: "일식", tags: ["면", "시원"] },
  { id: 91, name: "판모밀", category: "일식", tags: ["면", "시원"] },
  { id: 92, name: "온모밀", category: "일식", tags: ["면", "국물"] },
  { id: 93, name: "가츠동", category: "일식", tags: ["밥", "덮밥"] },
  { id: 94, name: "규동", category: "일식", tags: ["밥", "고기"] },
  { id: 95, name: "텐동", category: "일식", tags: ["밥", "튀김"] },
  { id: 96, name: "오야꼬동", category: "일식", tags: ["밥", "고기"] },
  { id: 97, name: "사케동", category: "일식", tags: ["밥", "해산물"] },
  { id: 98, name: "연어덮밥", category: "일식", tags: ["밥", "해산물"] },
  { id: 99, name: "회덮밥", category: "일식", tags: ["밥", "해산물"] },
  { id: 100, name: "오므라이스", category: "일식", tags: ["밥", "가벼운"] },
  { id: 101, name: "데미오므라이스", category: "일식", tags: ["밥", "달달"] },
  { id: 102, name: "함박스테이크", category: "일식", tags: ["고기", "든든"] },
  { id: 103, name: "일식함박정식", category: "일식", tags: ["고기", "정식"] },
  { id: 104, name: "초밥세트", category: "일식", tags: ["해산물", "가벼운"] },
  { id: 105, name: "모둠초밥", category: "일식", tags: ["해산물", "든든"] },
  { id: 106, name: "유부초밥", category: "일식", tags: ["가벼운", "간단"] },
  {
    id: 107,
    name: "새우튀김정식",
    category: "일식",
    tags: ["튀김", "해산물"],
  },
  {
    id: 108,
    name: "치킨가라아게정식",
    category: "일식",
    tags: ["튀김", "고기"],
  },
  {
    id: 109,
    name: "냉모밀돈까스세트",
    category: "일식",
    tags: ["세트", "든든"],
  },
  {
    id: 110,
    name: "우동돈까스세트",
    category: "일식",
    tags: ["세트", "든든"],
  },

  { id: 111, name: "짜장면", category: "중식", tags: ["면", "가성비"] },
  { id: 112, name: "간짜장", category: "중식", tags: ["면", "든든"] },
  { id: 113, name: "삼선짜장", category: "중식", tags: ["면", "해산물"] },
  { id: 114, name: "짬뽕", category: "중식", tags: ["면", "얼큰"] },
  { id: 115, name: "삼선짬뽕", category: "중식", tags: ["면", "해산물"] },
  { id: 116, name: "차돌짬뽕", category: "중식", tags: ["면", "고기"] },
  { id: 117, name: "짬뽕밥", category: "중식", tags: ["밥", "국물"] },
  { id: 118, name: "볶음밥", category: "중식", tags: ["밥", "든든"] },
  { id: 119, name: "새우볶음밥", category: "중식", tags: ["밥", "해산물"] },
  { id: 120, name: "잡채밥", category: "중식", tags: ["밥", "든든"] },
  { id: 121, name: "마파두부덮밥", category: "중식", tags: ["밥", "매운"] },
  { id: 122, name: "유산슬덮밥", category: "중식", tags: ["밥", "해산물"] },
  { id: 123, name: "고추잡채덮밥", category: "중식", tags: ["밥", "고기"] },
  { id: 124, name: "중화비빔밥", category: "중식", tags: ["밥", "매운"] },
  { id: 125, name: "탕수육", category: "중식", tags: ["고기", "튀김"] },
  { id: 126, name: "깐풍기", category: "중식", tags: ["고기", "튀김"] },
  { id: 127, name: "유린기", category: "중식", tags: ["고기", "튀김"] },
  { id: 128, name: "라조육", category: "중식", tags: ["고기", "매운"] },
  { id: 129, name: "마라탕", category: "중식", tags: ["국물", "매운"] },
  { id: 130, name: "마라샹궈", category: "중식", tags: ["매운", "중독성"] },
  { id: 131, name: "꿔바로우", category: "중식", tags: ["튀김", "달달"] },
  { id: 132, name: "양장피", category: "중식", tags: ["가벼운", "해산물"] },
  { id: 133, name: "고기짬뽕", category: "중식", tags: ["면", "고기"] },
  { id: 134, name: "해물짬뽕", category: "중식", tags: ["면", "해산물"] },
  { id: 135, name: "마라비빔면", category: "중식", tags: ["면", "매운"] },
  { id: 136, name: "탄탄면", category: "중식", tags: ["면", "고소"] },
  { id: 137, name: "우육면", category: "중식", tags: ["면", "고기"] },
  {
    id: 138,
    name: "토마토계란덮밥",
    category: "중식",
    tags: ["밥", "가벼운"],
  },
  { id: 139, name: "가지덮밥", category: "중식", tags: ["밥", "건강"] },
  { id: 140, name: "계란볶음면", category: "중식", tags: ["면", "간단"] },

  { id: 141, name: "토마토파스타", category: "양식", tags: ["면", "가벼운"] },
  { id: 142, name: "크림파스타", category: "양식", tags: ["면", "크림"] },
  { id: 143, name: "로제파스타", category: "양식", tags: ["면", "인기"] },
  { id: 144, name: "알리오올리오", category: "양식", tags: ["면", "가벼운"] },
  { id: 145, name: "봉골레파스타", category: "양식", tags: ["면", "해산물"] },
  { id: 146, name: "까르보나라", category: "양식", tags: ["면", "크림"] },
  { id: 147, name: "미트볼파스타", category: "양식", tags: ["면", "고기"] },
  { id: 148, name: "해산물파스타", category: "양식", tags: ["면", "해산물"] },
  { id: 149, name: "바질파스타", category: "양식", tags: ["면", "향긋"] },
  { id: 150, name: "리조또", category: "양식", tags: ["밥", "든든"] },
  { id: 151, name: "버섯리조또", category: "양식", tags: ["밥", "고소"] },
  { id: 152, name: "해산물리조또", category: "양식", tags: ["밥", "해산물"] },
  { id: 153, name: "스테이크덮밥", category: "양식", tags: ["밥", "고기"] },
  { id: 154, name: "목살스테이크", category: "양식", tags: ["고기", "든든"] },
  { id: 155, name: "찹스테이크", category: "양식", tags: ["고기", "든든"] },
  { id: 156, name: "햄버거", category: "양식", tags: ["빵", "패스트푸드"] },
  { id: 157, name: "치즈버거", category: "양식", tags: ["빵", "패스트푸드"] },
  { id: 158, name: "치킨버거", category: "양식", tags: ["빵", "패스트푸드"] },
  { id: 159, name: "클럽샌드위치", category: "양식", tags: ["빵", "간단"] },
  {
    id: 160,
    name: "치아바타샌드위치",
    category: "양식",
    tags: ["빵", "가벼운"],
  },
  { id: 161, name: "에그샌드위치", category: "양식", tags: ["빵", "가벼운"] },
  { id: 162, name: "치킨샐러드", category: "양식", tags: ["샐러드", "건강"] },
  {
    id: 163,
    name: "연어샐러드",
    category: "양식",
    tags: ["샐러드", "해산물"],
  },
  {
    id: 164,
    name: "리코타샐러드",
    category: "양식",
    tags: ["샐러드", "가벼운"],
  },
  { id: 165, name: "콥샐러드", category: "양식", tags: ["샐러드", "든든"] },
  { id: 166, name: "피자", category: "양식", tags: ["빵", "패스트푸드"] },
  { id: 167, name: "페퍼로니피자", category: "양식", tags: ["빵", "고기"] },
  { id: 168, name: "고르곤졸라피자", category: "양식", tags: ["빵", "치즈"] },
  { id: 169, name: "포테이토피자", category: "양식", tags: ["빵", "든든"] },
  { id: 170, name: "라자냐", category: "양식", tags: ["면", "치즈"] },

  { id: 171, name: "쌀국수", category: "아시안", tags: ["면", "국물"] },
  { id: 172, name: "소고기쌀국수", category: "아시안", tags: ["면", "고기"] },
  { id: 173, name: "분짜", category: "아시안", tags: ["면", "고기"] },
  { id: 174, name: "반미샌드위치", category: "아시안", tags: ["빵", "간단"] },
  { id: 175, name: "팟타이", category: "아시안", tags: ["면", "볶음"] },
  { id: 176, name: "카오팟", category: "아시안", tags: ["밥", "볶음"] },
  { id: 177, name: "나시고렝", category: "아시안", tags: ["밥", "볶음"] },
  { id: 178, name: "미고렝", category: "아시안", tags: ["면", "볶음"] },
  { id: 179, name: "커리라이스", category: "아시안", tags: ["밥", "향신료"] },
  { id: 180, name: "인도커리", category: "아시안", tags: ["밥", "향신료"] },
  {
    id: 181,
    name: "버터치킨커리",
    category: "아시안",
    tags: ["고기", "향신료"],
  },
  { id: 182, name: "난세트", category: "아시안", tags: ["빵", "세트"] },
  {
    id: 183,
    name: "탄두리치킨",
    category: "아시안",
    tags: ["고기", "향신료"],
  },
  { id: 184, name: "케밥", category: "아시안", tags: ["빵", "고기"] },
  { id: 185, name: "치킨케밥", category: "아시안", tags: ["빵", "고기"] },
  { id: 186, name: "또띠아랩", category: "아시안", tags: ["빵", "간단"] },
  { id: 187, name: "타코라이스", category: "아시안", tags: ["밥", "이국적"] },
  { id: 188, name: "브리또", category: "아시안", tags: ["빵", "든든"] },
  { id: 189, name: "치킨브리또", category: "아시안", tags: ["빵", "고기"] },
  { id: 190, name: "퀘사디아", category: "아시안", tags: ["빵", "치즈"] },

  { id: 191, name: "포케", category: "아시안", tags: ["밥", "건강"] },
  { id: 192, name: "연어포케", category: "아시안", tags: ["밥", "해산물"] },
  { id: 193, name: "참치포케", category: "아시안", tags: ["밥", "해산물"] },
  { id: 194, name: "닭가슴살포케", category: "아시안", tags: ["밥", "건강"] },
  {
    id: 195,
    name: "그릭요거트볼",
    category: "브런치",
    tags: ["가벼운", "건강"],
  },
  { id: 196, name: "프렌치토스트", category: "브런치", tags: ["빵", "달달"] },
  {
    id: 197,
    name: "베이글샌드위치",
    category: "브런치",
    tags: ["빵", "간단"],
  },
  {
    id: 198,
    name: "에그베네딕트",
    category: "브런치",
    tags: ["빵", "가벼운"],
  },
  {
    id: 199,
    name: "브런치플레이트",
    category: "브런치",
    tags: ["세트", "가벼운"],
  },
  { id: 200, name: "파니니", category: "브런치", tags: ["빵", "간단"] },
];

const LunchMenuPage = () => {
  const [selectedMenu, setSelectedMenu] = useState<
    (typeof lunchMenus)[number] | null
  >(null);

  const recommendRandomMenu = () => {
    const recommendableMenus =
      selectedMenu && lunchMenus.length > 1
        ? lunchMenus.filter((menu) => menu.id !== selectedMenu.id)
        : lunchMenus;
    const nextMenu =
      recommendableMenus[Math.floor(Math.random() * recommendableMenus.length)];

    setSelectedMenu(nextMenu);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        boxSizing: "border-box",
        color: "#111827",
        fontFamily: "Pretendard, system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
        }}
      >
        {selectedMenu ? (
          <div
            style={{
              marginBottom: "32px",
              padding: "24px",
              border: "2px solid #111827",
              borderRadius: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.86)",
              boxShadow: "0 16px 36px rgba(17, 24, 39, 0.12)",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "#475569",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              {selectedMenu.category}
            </p>
            <strong
              style={{
                display: "block",
                marginTop: "10px",
                fontSize: "36px",
                lineHeight: 1.2,
                wordBreak: "keep-all",
              }}
            >
              {selectedMenu.name}
            </strong>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px",
                marginTop: "18px",
              }}
            >
              {selectedMenu.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "7px 10px",
                    borderRadius: "8px",
                    backgroundColor: "#e0f2fe",
                    color: "#075985",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <h1
          style={{
            margin: 0,
            fontSize: "48px",
            lineHeight: 1.18,
            fontWeight: 700,
            fontFamily: "Mona12, Pretendard, system-ui, sans-serif",
            wordBreak: "keep-all",
          }}
        >
          오늘 점심 뭐먹지?
        </h1>

        <button
          type="button"
          onClick={recommendRandomMenu}
          style={{
            marginTop: "32px",
            width: "100%",
            maxWidth: "320px",
            minHeight: "56px",
            border: 0,
            borderRadius: "999px",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 800,
            fontFamily: "Mona12, Pretendard, system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 12px 28px rgba(17, 24, 39, 0.2)",
          }}
        >
          메뉴 추천받기
        </button>
      </section>
    </main>
  );
};

export default LunchMenuPage;
