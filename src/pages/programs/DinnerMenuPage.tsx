import React, { useEffect, useRef, useState } from "react";

const DINNER_TITLE = "오늘 저녁 뭐 먹지?";
const DINNER_TITLE_LINES = ["오늘 저녁", " 뭐 먹지?"];
const RESULT_ENTER_ANIMATION_MS = 520;
const RESULT_EXIT_ANIMATION_MS = 360;
const CLICK_MESSAGE_VISIBLE_MS = 1800;
const CLICK_MESSAGES: Record<number, string[]> = {
  5: [
    "메뉴는 이미 정해져 있을지도 몰라요",
    "고민 많네 오늘 😆",
    "배고픈 건 맞죠?",
  ],
  10: [
    "혹시 그냥 누르는 거죠 지금?",
    "이러다 아침 먹겠는데요?",
    "선택 장애 ON 🔥",
  ],
  20: [
    "그냥 아무거나 먹어도 괜찮아요 진짜",
    "그냥 첫 번째 나온 거 먹어도 몰라요",
    "솔직히 아무거나 먹어도 됩니다",
  ],
};
const ALCOHOL_PAIRING_MESSAGES = [
  "슬쩍 곁들이면 좋아요",
  "한잔 곁들이기 좋아요",
  "곁들이면 실패 없어요",
  "페어링 추천해요",
  "같이 먹으면 더 맛있어요",
];

const getRandomItem = <T,>(items: T[]) =>
  items[Math.floor(Math.random() * items.length)];

const formatAlcoholPairingText = (alcohols: string[], message: string) => {
  if (!alcohols.length) {
    return "";
  }

  return `${alcohols.join(", ")} ${message}`;
};

const dinnerMenus = [
  {
    id: 1,
    name: "삼겹살",
    category: "고기",
    tags: ["구이", "대중적", "기름진", "스테디셀러"],
    alcohols: ["소주", "소맥", "맥주"],
  },
  {
    id: 2,
    name: "목살",
    category: "고기",
    tags: ["구이", "대중적", "담백한", "육즙가득"],
    alcohols: ["소주", "레드와인"],
  },
  {
    id: 3,
    name: "항정살",
    category: "고기",
    tags: ["구이", "고소한", "아삭한식감", "특수부위"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 4,
    name: "가브리살",
    category: "고기",
    tags: ["구이", "고소한", "부드러운", "육향"],
    alcohols: ["소주", "매취순"],
  },
  {
    id: 5,
    name: "돼지갈비",
    category: "고기",
    tags: ["구이", "달달한", "가족외식", "단짠단짠"],
    alcohols: ["소주", "맥주", "백세주"],
  },
  {
    id: 6,
    name: "양념돼지갈비",
    category: "고기",
    tags: ["구이", "달달한", "숯불향", "남녀노소"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 7,
    name: "소갈비살",
    category: "고기",
    tags: ["구이", "든든한", "쫄깃한", "고급진"],
    alcohols: ["소주", "레드와인", "복분자주"],
  },
  {
    id: 8,
    name: "꽃살",
    category: "고기",
    tags: ["구이", "고급", "마블링", "입에서녹는"],
    alcohols: ["레드와인", "위스키", "소주"],
  },
  {
    id: 9,
    name: "차돌박이",
    category: "고기",
    tags: ["구이", "빠른조리", "야들야들", "고소한기름"],
    alcohols: ["소주", "청하", "하이볼"],
  },
  {
    id: 10,
    name: "우삼겹",
    category: "고기",
    tags: ["구이", "가성비", "얇은고기", "부드러운"],
    alcohols: ["소맥", "맥주"],
  },
  {
    id: 11,
    name: "등심",
    category: "고기",
    tags: ["구이", "고급", "스테디셀러", "육즙"],
    alcohols: ["레드와인", "소주"],
  },
  {
    id: 12,
    name: "살치살",
    category: "고기",
    tags: ["구이", "고급", "눈꽃마블링", "최고급부위"],
    alcohols: ["레드와인", "사케"],
  },
  {
    id: 13,
    name: "안심",
    category: "고기",
    tags: ["구이", "부드러운", "저지방", "담백한"],
    alcohols: ["레드와인", "위스키"],
  },
  {
    id: 14,
    name: "토시살",
    category: "고기",
    tags: ["구이", "쫄깃한", "육향가득", "특수부위"],
    alcohols: ["소주", "레드와인"],
  },
  {
    id: 15,
    name: "양갈비",
    category: "고기",
    tags: ["구이", "특별한", "이국적", "풍미가득"],
    alcohols: ["칭따오맥주", "레드와인", "고량주"],
  },
  {
    id: 16,
    name: "양꼬치",
    category: "고기",
    tags: ["꼬치", "향신료", "쯔란", "하나씩쏙쏙"],
    alcohols: ["칭따오맥주", "하얼빈맥주", "고량주"],
  },
  {
    id: 17,
    name: "닭갈비",
    category: "고기",
    tags: ["볶음", "매콤한", "철판요리", "볶음밥필수"],
    alcohols: ["소주", "막걸리", "소맥"],
  },
  {
    id: 18,
    name: "춘천닭갈비",
    category: "고기",
    tags: ["볶음", "대중적", "푸짐한", "매콤달콤"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 19,
    name: "숯불닭갈비",
    category: "고기",
    tags: ["구이", "불향", "야들야들", "담백한"],
    alcohols: ["청하", "생맥주", "소주"],
  },
  {
    id: 20,
    name: "닭구이",
    category: "고기",
    tags: ["구이", "담백한", "건강식", "다이어트식"],
    alcohols: ["화이트와인", "하이볼"],
  },
  {
    id: 21,
    name: "닭목살구이",
    category: "고기",
    tags: ["구이", "쫄깃한", "별미", "술안주"],
    alcohols: ["소주", "청하", "생맥주"],
  },
  {
    id: 22,
    name: "오리로스",
    category: "고기",
    tags: ["구이", "담백한", "보양식", "불포화지방산"],
    alcohols: ["백세주", "소주", "복분자주"],
  },
  {
    id: 23,
    name: "훈제오리",
    category: "고기",
    tags: ["구이", "담백한", "머스터드소스", "간편한"],
    alcohols: ["맥주", "화이트와인"],
  },
  {
    id: 24,
    name: "오리주물럭",
    category: "고기",
    tags: ["볶음", "매콤한", "기력보충", "푸짐한"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 25,
    name: "보쌈",
    category: "고기",
    tags: ["수육", "대중적", "김치조합", "부드러운"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 26,
    name: "마늘보쌈",
    category: "고기",
    tags: ["수육", "풍미있는", "알싸한", "한국의맛"],
    alcohols: ["막걸리", "청하"],
  },
  {
    id: 27,
    name: "족발",
    category: "고기",
    tags: ["수육", "쫄깃한", "콜라겐", "야식베스트"],
    alcohols: ["소주", "막걸리", "소맥"],
  },
  {
    id: 28,
    name: "불족발",
    category: "고기",
    tags: ["매운", "쫄깃한", "스트레스해소", "중독성"],
    alcohols: ["쿨피스주", "맥주", "소주"],
  },
  {
    id: 29,
    name: "냉채족발",
    category: "고기",
    tags: ["시원한", "새콤한", "겨자톡", "여름별미"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 30,
    name: "편육",
    category: "고기",
    tags: ["수육", "담백한", "장례식단골", "탱글탱글"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 31,
    name: "수육",
    category: "고기",
    tags: ["수육", "담백한", "갓삶은", "야들야들"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 32,
    name: "제육볶음",
    category: "고기",
    tags: ["볶음", "매콤한", "밥도둑", "직장인점심"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 33,
    name: "두루치기",
    category: "고기",
    tags: ["볶음", "매콤한", "자작한국물", "푸짐한"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 34,
    name: "돼지김치찜",
    category: "고기",
    tags: ["찜", "국물", "푹익은김치", "깊은맛"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 35,
    name: "갈비찜",
    category: "고기",
    tags: ["찜", "고급", "명절음식", "달콤짭짤"],
    alcohols: ["소주", "법주", "레드와인"],
  },
  {
    id: 36,
    name: "매운갈비찜",
    category: "고기",
    tags: ["찜", "매운", "화끈한", "스트레스풀리는"],
    alcohols: ["소주", "맥주", "소맥"],
  },
  {
    id: 37,
    name: "닭볶음탕",
    category: "고기",
    tags: ["탕", "매콤한", "포슬포슬감자", "든든한한끼"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 38,
    name: "닭한마리",
    category: "고기",
    tags: ["탕", "든든한", "칼국수마무리", "맑은국물"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 39,
    name: "백숙",
    category: "고기",
    tags: ["보양", "든든한", "여름보양식", "부드러운육질"],
    alcohols: ["인삼주", "담금주", "백세주"],
  },
  {
    id: 40,
    name: "삼계탕",
    category: "고기",
    tags: ["보양", "국물", "1인보양", "진한육수"],
    alcohols: ["인삼주", "청하"],
  },
  {
    id: 41,
    name: "곱창구이",
    category: "내장",
    tags: ["구이", "고소한", "곱이가득", "소주친구"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 42,
    name: "대창구이",
    category: "내장",
    tags: ["구이", "고소한", "기름진맛", "입안의축제"],
    alcohols: ["소주", "불닭엔맥주"],
  },
  {
    id: 43,
    name: "막창구이",
    category: "내장",
    tags: ["구이", "쫄깃한", "씹는맛", "대구별미"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 44,
    name: "염통구이",
    category: "내장",
    tags: ["구이", "쫄깃한", "가벼운안주", "고기같은내장"],
    alcohols: ["소주", "청하", "하이볼"],
  },
  {
    id: 45,
    name: "양구이",
    category: "내장",
    tags: ["구이", "고급", "특수부위", "서걱서걱식감"],
    alcohols: ["소주", "화요"],
  },
  {
    id: 46,
    name: "곱창전골",
    category: "내장",
    tags: ["전골", "국물", "얼큰한", "소주무한리필"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 47,
    name: "곱도리탕",
    category: "내장",
    tags: ["전골", "매콤한", "곱창과닭의만남", "트렌디한"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 48,
    name: "곱창볶음",
    category: "내장",
    tags: ["볶음", "매콤한", "야채듬뿍", "포장마차"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 49,
    name: "막창전골",
    category: "내장",
    tags: ["전골", "든든한", "구수한", "진한맛"],
    alcohols: ["소주"],
  },
  {
    id: 50,
    name: "순대볶음",
    category: "내장",
    tags: ["볶음", "매콤한", "들깨가루", "시장맛집"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 51,
    name: "광어회",
    category: "회",
    tags: ["생선", "담백한", "국민횟감", "쫄깃한지느러미"],
    alcohols: ["소주", "청하", "화이트와인"],
  },
  {
    id: 52,
    name: "우럭회",
    category: "회",
    tags: ["생선", "쫄깃한", "매운탕필수", "탄력있는식감"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 53,
    name: "연어회",
    category: "회",
    tags: ["생선", "고소한", "부드러운", "오메가3"],
    alcohols: ["화이트와인", "하이볼", "청하"],
  },
  {
    id: 54,
    name: "참치회",
    category: "회",
    tags: ["생선", "고급", "부위별맛", "입에서살살"],
    alcohols: ["사케", "위스키", "소주"],
  },
  {
    id: 55,
    name: "모둠회",
    category: "회",
    tags: ["생선", "인기", "다양한구성", "신선한"],
    alcohols: ["소주", "사케", "청하"],
  },
  {
    id: 56,
    name: "방어회",
    category: "회",
    tags: ["생선", "고소한", "겨울제철", "기름진풍미"],
    alcohols: ["소주", "청하", "한라산"],
  },
  {
    id: 57,
    name: "도미회",
    category: "회",
    tags: ["생선", "고급", "쫄깃한껍질", "고급횟감"],
    alcohols: ["청하", "사케", "화요"],
  },
  {
    id: 58,
    name: "농어회",
    category: "회",
    tags: ["생선", "담백한", "여름제철", "깔끔한맛"],
    alcohols: ["소주", "화이트와인"],
  },
  {
    id: 59,
    name: "회무침",
    category: "회",
    tags: ["무침", "매콤한", "아삭한채소", "입맛돋우는"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 60,
    name: "물회",
    category: "회",
    tags: ["시원한", "새콤한", "살얼음동동", "여름별미"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 61,
    name: "산낙지",
    category: "해산물",
    tags: ["해산물", "쫄깃한", "쓰러진소도일으키는", "스테미나"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 62,
    name: "낙지숙회",
    category: "해산물",
    tags: ["해산물", "담백한", "부드러운식감", "깔끔안주"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 63,
    name: "문어숙회",
    category: "해산물",
    tags: ["해산물", "쫄깃한", "고급안주", "타우린가득"],
    alcohols: ["소주", "청하", "화요"],
  },
  {
    id: 64,
    name: "오징어숙회",
    category: "해산물",
    tags: ["해산물", "담백한", "가성비안주", "부드러운"],
    alcohols: ["맥주", "소주"],
  },
  {
    id: 65,
    name: "멍게",
    category: "해산물",
    tags: ["해산물", "향긋한", "바다향가득", "호불호음식"],
    alcohols: ["소주", "화이트와인"],
  },
  {
    id: 66,
    name: "해삼",
    category: "해산물",
    tags: ["해산물", "독특한", "오독오독식감", "바다의인삼"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 67,
    name: "개불",
    category: "해산물",
    tags: ["해산물", "독특한", "꼬들꼬들", "달큰한맛"],
    alcohols: ["소주"],
  },
  {
    id: 68,
    name: "전복회",
    category: "해산물",
    tags: ["해산물", "고급", "바다의보약", "오독오독"],
    alcohols: ["소주", "청하", "사케"],
  },
  {
    id: 69,
    name: "전복버터구이",
    category: "해산물",
    tags: ["구이", "고소한", "고급진풍미", "아이들도좋아함"],
    alcohols: ["화이트와인", "하이볼", "맥주"],
  },
  {
    id: 70,
    name: "키조개구이",
    category: "해산물",
    tags: ["구이", "고소한", "커다란관자", "치즈듬뿍"],
    alcohols: ["소주", "맥주", "청하"],
  },
  {
    id: 71,
    name: "가리비구이",
    category: "해산물",
    tags: ["구이", "고소한", "조개구이꽃", "달큰한맛"],
    alcohols: ["청하", "소주", "화이트와인"],
  },
  {
    id: 72,
    name: "조개구이",
    category: "해산물",
    tags: ["구이", "대중적", "바닷가갬성", "불맛조개"],
    alcohols: ["소주", "소맥", "청하"],
  },
  {
    id: 73,
    name: "조개찜",
    category: "해산물",
    tags: ["찜", "시원한", "푸짐한해물", "깔끔한국물"],
    alcohols: ["소주", "청하", "화요"],
  },
  {
    id: 74,
    name: "홍합탕",
    category: "해산물",
    tags: ["국물", "시원한", "기본안주끝판왕", "칼칼한"],
    alcohols: ["소주", "정종"],
  },
  {
    id: 75,
    name: "조개탕",
    category: "해산물",
    tags: ["국물", "시원한", "해장하면서술마시기", "속풀이"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 76,
    name: "해물탕",
    category: "해산물",
    tags: ["탕", "얼큰한", "바다를담은맛", "푸짐한해산물"],
    alcohols: ["소주", "백세주"],
  },
  {
    id: 77,
    name: "매운탕",
    category: "해산물",
    tags: ["탕", "매운", "횟집마무리", "얼큰칼칼"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 78,
    name: "알탕",
    category: "해산물",
    tags: ["탕", "얼큰한", "톡톡터지는알", "고소한곤이"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 79,
    name: "복지리",
    category: "해산물",
    tags: ["탕", "시원한", "해장술최고", "미나리향"],
    alcohols: ["청하", "히레사케", "소주"],
  },
  {
    id: 80,
    name: "새우구이",
    category: "해산물",
    tags: ["구이", "고소한", "소금구이", "껍질째바삭"],
    alcohols: ["맥주", "소주", "화이트와인"],
  },
  {
    id: 81,
    name: "대하구이",
    category: "해산물",
    tags: ["구이", "제철", "가을별미", "통통한살"],
    alcohols: ["소주", "맥주", "청하"],
  },
  {
    id: 82,
    name: "새우튀김",
    category: "해산물",
    tags: ["튀김", "바삭한", "아이들간식", "겉바속촉"],
    alcohols: ["맥주", "하이볼"],
  },
  {
    id: 83,
    name: "오징어튀김",
    category: "해산물",
    tags: ["튀김", "바삭한", "분식궁합", "쫄깃바삭"],
    alcohols: ["맥주", "소맥"],
  },
  {
    id: 84,
    name: "해물파전",
    category: "전",
    tags: ["전", "대중적", "비오는날", "해물듬뿍"],
    alcohols: ["막걸리", "동동주"],
  },
  {
    id: 85,
    name: "김치전",
    category: "전",
    tags: ["전", "바삭한", "신김치풍미", "간단안주"],
    alcohols: ["막걸리", "맥주"],
  },
  {
    id: 86,
    name: "감자전",
    category: "전",
    tags: ["전", "고소한", "쫀득쫀득", "강원도맛"],
    alcohols: ["막걸리", "청하"],
  },
  {
    id: 87,
    name: "부추전",
    category: "전",
    tags: ["전", "향긋한", "바삭한식감", "정력에좋은"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 88,
    name: "육전",
    category: "전",
    tags: ["전", "고기", "명절고급전", "부드러운소고기"],
    alcohols: ["막걸리", "레드와인", "소주"],
  },
  {
    id: 89,
    name: "동그랑땡",
    category: "전",
    tags: ["전", "고소한", "아이들반찬", "한입쏙"],
    alcohols: ["맥주", "막걸리"],
  },
  {
    id: 90,
    name: "빈대떡",
    category: "전",
    tags: ["전", "든든한", "광장시장", "겉바속촉"],
    alcohols: ["막걸리", "동동주"],
  },
  {
    id: 91,
    name: "녹두전",
    category: "전",
    tags: ["전", "고소한", "전통의맛", "구수한녹두"],
    alcohols: ["막걸리", "청하"],
  },
  {
    id: 92,
    name: "두부김치",
    category: "한식안주",
    tags: ["두부", "매콤한", "환상의짝꿍", "담백한두부"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 93,
    name: "오뎅탕",
    category: "한식안주",
    tags: ["국물", "시원한", "겨울안주", "포장마차단골"],
    alcohols: ["소주", "정종", "사케"],
  },
  {
    id: 94,
    name: "어묵전골",
    category: "한식안주",
    tags: ["전골", "든든한", "다양한어묵", "따끈한국물"],
    alcohols: ["소주", "사케"],
  },
  {
    id: 95,
    name: "부대찌개",
    category: "찌개",
    tags: ["찌개", "얼큰한", "햄듬뿍", "라면사리필수"],
    alcohols: ["소주", "소맥", "맥주"],
  },
  {
    id: 96,
    name: "김치찌개",
    category: "찌개",
    tags: ["찌개", "매콤한", "소울푸드", "칼칼한"],
    alcohols: ["소주", "막걸리"],
  },
  {
    id: 97,
    name: "된장찌개",
    category: "찌개",
    tags: ["찌개", "구수한", "엄마손맛", "깊은맛"],
    alcohols: ["소주", "전통주"],
  },
  {
    id: 98,
    name: "순두부찌개",
    category: "찌개",
    tags: ["찌개", "얼큰한", "부드러운식감", "몽글몽글"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 99,
    name: "나가사키짬뽕탕",
    category: "찌개",
    tags: ["국물", "시원한", "이자카야단골", "진한사골국물"],
    alcohols: ["사케", "하이볼", "소주"],
  },
  {
    id: 100,
    name: "짬뽕탕",
    category: "찌개",
    tags: ["국물", "얼큰한", "불맛가득", "해장동시안주"],
    alcohols: ["이과두주", "고량주", "소주"],
  },
  {
    id: 101,
    name: "만두전골",
    category: "전골",
    tags: ["전골", "든든한", "푸짐한만두", "뜨끈한"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 102,
    name: "소고기버섯전골",
    category: "전골",
    tags: ["전골", "고급", "건강한맛", "담백함"],
    alcohols: ["백세주", "소주", "레드와인"],
  },
  {
    id: 103,
    name: "불고기전골",
    category: "전골",
    tags: ["전골", "대중적", "달달한양념", "당면사리"],
    alcohols: ["소주", "전통주"],
  },
  {
    id: 104,
    name: "낙곱새",
    category: "전골",
    tags: ["전골", "매콤한", "환상의조합", "트렌디맛집"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 105,
    name: "알찜",
    category: "전골",
    tags: ["찜", "매콤한", "알이가득", "고소한풍미"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 106,
    name: "해물찜",
    category: "전골",
    tags: ["찜", "매콤한", "아구와해물", "아삭한콩나물"],
    alcohols: ["소주", "소맥", "백세주"],
  },
  {
    id: 107,
    name: "아구찜",
    category: "전골",
    tags: ["찜", "매콤한", "콜라겐가득", "매운맛"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 108,
    name: "코다리찜",
    category: "전골",
    tags: ["찜", "매콤한", "꾸덕한식감", "웰빙푸드"],
    alcohols: ["막걸리", "소주"],
  },
  {
    id: 109,
    name: "주꾸미볶음",
    category: "볶음",
    tags: ["볶음", "매운", "제철별미", "불맛가득"],
    alcohols: ["소주", "맥주", "막걸리"],
  },
  {
    id: 110,
    name: "낙지볶음",
    category: "볶음",
    tags: ["볶음", "매운", "기력회복", "화끈한맛"],
    alcohols: ["소주", "청하"],
  },
  {
    id: 111,
    name: "오징어볶음",
    category: "볶음",
    tags: ["볶음", "매운", "가정식단골", "달콤매콤"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 112,
    name: "쭈삼",
    category: "볶음",
    tags: ["볶음", "인기", "주꾸미와삼겹살", "마요네즈궁합"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 113,
    name: "오돌뼈",
    category: "볶음",
    tags: ["볶음", "매콤한", "오독오독", "주먹밥필수"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 114,
    name: "닭발",
    category: "볶음",
    tags: ["매운", "안주", "콜라겐", "스트레스해소"],
    alcohols: ["소주", "쿨피스주"],
  },
  {
    id: 115,
    name: "국물닭발",
    category: "볶음",
    tags: ["국물", "매운", "콩나물듬뿍", "자꾸생각나는"],
    alcohols: ["소주", "소맥"],
  },
  {
    id: 116,
    name: "무뼈닭발",
    category: "볶음",
    tags: ["매운", "간편한", "한입에쏙", "쫄깃바삭"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 117,
    name: "닭똥집볶음",
    category: "볶음",
    tags: ["볶음", "쫄깃한", "고소한마늘", "가성비안주"],
    alcohols: ["소주", "생맥주"],
  },
  {
    id: 118,
    name: "닭똥집튀김",
    category: "볶음",
    tags: ["튀김", "바삭한", "치킨사이드", "별미"],
    alcohols: ["맥주", "소맥"],
  },
  {
    id: 119,
    name: "훈제막창",
    category: "볶음",
    tags: ["구이", "쫄깃한", "불향가득", "고소함"],
    alcohols: ["소주", "맥주"],
  },
  {
    id: 120,
    name: "철판볶음우동",
    category: "볶음",
    tags: ["면", "든든한", "가쓰오부시", "일식풍"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 121,
    name: "후라이드치킨",
    category: "치킨",
    tags: ["튀김", "대중적", "치맥", "오리지널"],
    alcohols: ["생맥주", "소맥"],
  },
  {
    id: 122,
    name: "양념치킨",
    category: "치킨",
    tags: ["튀김", "달콤한", "맵단", "한국인의치킨"],
    alcohols: ["생맥주", "콜라주"],
  },
  {
    id: 123,
    name: "간장치킨",
    category: "치킨",
    tags: ["튀김", "짭짤한", "단짠의정석", "바삭한피"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 124,
    name: "마늘치킨",
    category: "치킨",
    tags: ["튀김", "풍미있는", "알싸한마늘", "느끼함제로"],
    alcohols: ["생맥주", "소주"],
  },
  {
    id: 125,
    name: "고추치킨",
    category: "치킨",
    tags: ["튀김", "매콤한", "청양고추", "깔끔한끝맛"],
    alcohols: ["맥주", "소주"],
  },
  {
    id: 126,
    name: "파닭",
    category: "치킨",
    tags: ["튀김", "상큼한", "겨자소스", "아삭한파채"],
    alcohols: ["생맥주", "소맥"],
  },
  {
    id: 127,
    name: "순살치킨",
    category: "치킨",
    tags: ["튀김", "간편한", "한입크기", "아이들인기"],
    alcohols: ["맥주", "하이볼"],
  },
  {
    id: 128,
    name: "반반치킨",
    category: "치킨",
    tags: ["튀김", "인기", "결정장애해결", "두가지맛"],
    alcohols: ["생맥주", "소맥"],
  },
  {
    id: 129,
    name: "치킨가라아게",
    category: "치킨",
    tags: ["일식", "바삭한", "이자카야안주", "부드러운살"],
    alcohols: ["하이볼", "생맥주", "사케"],
  },
  {
    id: 130,
    name: "닭강정",
    category: "치킨",
    tags: ["튀김", "달달한", "식어도맛있는", "시장먹거리"],
    alcohols: ["맥주", "콜라"],
  },
  {
    id: 131,
    name: "숯불바베큐치킨",
    category: "치킨",
    tags: ["구이", "불향", "다이어트치킨", "매콤달콤"],
    alcohols: ["소주", "생맥주"],
  },
  {
    id: 132,
    name: "데리야끼치킨",
    category: "치킨",
    tags: ["구이", "달달한", "일식풍", "아이들입맛"],
    alcohols: ["하이볼", "맥주"],
  },
  {
    id: 133,
    name: "치킨꼬치",
    category: "치킨",
    tags: ["꼬치", "간편한", "길거리음식", "하나씩쏙"],
    alcohols: ["생맥주", "소주"],
  },
  {
    id: 134,
    name: "닭날개구이",
    category: "치킨",
    tags: ["구이", "짭짤한", "콜라겐", "윙앤봉"],
    alcohols: ["맥주", "와인"],
  },
  {
    id: 135,
    name: "버팔로윙",
    category: "치킨",
    tags: ["구이", "매콤한", "미국맛", "짭조름"],
    alcohols: ["맥주", "하이볼"],
  },
  {
    id: 136,
    name: "치즈볼",
    category: "치킨",
    tags: ["사이드", "고소한", "쫄깃한", "치킨짝꿍"],
    alcohols: ["맥주"],
  },
  {
    id: 137,
    name: "감자튀김",
    category: "치킨",
    tags: ["사이드", "바삭한", "맥주도둑", "가벼운안주"],
    alcohols: ["맥주", "하이볼"],
  },
  {
    id: 138,
    name: "치즈프라이",
    category: "치킨",
    tags: ["사이드", "치즈", "꾸덕꾸덕", "고소한풍미"],
    alcohols: ["맥주", "진토닉"],
  },
  {
    id: 139,
    name: "모둠감자",
    category: "치킨",
    tags: ["사이드", "인기", "다양한식감", "푸짐한"],
    alcohols: ["생맥주", "소맥"],
  },
  {
    id: 140,
    name: "웨지감자",
    category: "치킨",
    tags: ["사이드", "든든한", "포슬포슬", "구운감자느낌"],
    alcohols: ["맥주", "레드와인"],
  },
  {
    id: 141,
    name: "짜장면",
    category: "중식",
    tags: ["면", "마무리", "국민음식", "달콤한춘장"],
    alcohols: ["고량주", "맥주"],
  },
  {
    id: 142,
    name: "짬뽕",
    category: "중식",
    tags: ["면", "얼큰한", "해산물가득", "불맛국물"],
    alcohols: ["연태고량주", "소주"],
  },
  {
    id: 143,
    name: "짬뽕밥",
    category: "중식",
    tags: ["밥", "얼큰한", "해장용", "든든한"],
    alcohols: ["소주", "이과두주"],
  },
  {
    id: 144,
    name: "탕수육",
    category: "중식",
    tags: ["튀김", "대중적", "부먹찍먹", "새콤달콤"],
    alcohols: ["고량주", "칭따오맥주", "소맥"],
  },
  {
    id: 145,
    name: "깐풍기",
    category: "중식",
    tags: ["튀김", "매콤한", "닭고기요리", "중독성있는"],
    alcohols: ["칭따오맥주", "공부가주"],
  },
  {
    id: 146,
    name: "유린기",
    category: "중식",
    tags: ["튀김", "상큼한", "닭다리살", "간장소스"],
    alcohols: ["연태고량주", "화이트와인"],
  },
  {
    id: 147,
    name: "마라탕",
    category: "중식",
    tags: ["국물", "매운", "얼얼한맛", "MZ세대인기"],
    alcohols: ["칭따오맥주", "빙홍차소주"],
  },
  {
    id: 148,
    name: "마라샹궈",
    category: "중식",
    tags: ["볶음", "매운", "얼얼한볶음", "재료마음대로"],
    alcohols: ["고량주", "맥주"],
  },
  {
    id: 149,
    name: "꿔바로우",
    category: "중식",
    tags: ["튀김", "달콤한", "쫀득쫀득", "찹쌀탕수육"],
    alcohols: ["칭따오맥주", "하이볼"],
  },
  {
    id: 150,
    name: "마파두부",
    category: "중식",
    tags: ["두부", "매콤한", "부드러운", "밥비벼먹기"],
    alcohols: ["소주", "고량주"],
  },
  {
    id: 151,
    name: "멘보샤",
    category: "중식",
    tags: ["튀김", "해산물", "새우듬뿍", "겉바속촉"],
    alcohols: ["칭따오맥주", "하이볼"],
  },
  {
    id: 152,
    name: "유산슬",
    category: "중식",
    tags: ["볶음", "고급", "세가지재료", "담백한"],
    alcohols: ["공부가주", "연태고량주"],
  },
  {
    id: 153,
    name: "고추잡채",
    category: "중식",
    tags: ["볶음", "고기", "꽃빵궁합", "아삭한피망"],
    alcohols: ["고량주", "소주"],
  },
  {
    id: 154,
    name: "건두부무침",
    category: "중식",
    tags: ["무침", "가벼운", "새콤달콤", "독특한식감"],
    alcohols: ["맥주", "소주"],
  },
  {
    id: 155,
    name: "오이무침",
    category: "중식",
    tags: ["무침", "상큼한", "중국식반찬", "깔끔한맛"],
    alcohols: ["고량주", "소주"],
  },
  {
    id: 156,
    name: "지삼선",
    category: "중식",
    tags: ["볶음", "채소", "땅에서나는세가지", "가지요리"],
    alcohols: ["칭따오맥주", "고량주"],
  },
  {
    id: 157,
    name: "볶음밥",
    category: "중식",
    tags: ["밥", "마무리", "고슬고슬", "중식의기본"],
    alcohols: ["칭따오맥주", "소주"],
  },
  {
    id: 158,
    name: "양장피",
    category: "중식",
    tags: ["가벼운", "해산물", "톡쏘는겨자", "화려한비주얼"],
    alcohols: ["연태고량주", "소주"],
  },
  {
    id: 159,
    name: "라조기",
    category: "중식",
    tags: ["튀김", "매콤한", "닭고기", "고추기름향"],
    alcohols: ["고량주", "맥주"],
  },
  {
    id: 160,
    name: "중국식계란탕",
    category: "중식",
    tags: ["국물", "부드러운", "술안주속풀이", "전분기있는"],
    alcohols: ["소주", "정종"],
  },
  {
    id: 161,
    name: "돈까스",
    category: "일식",
    tags: ["튀김", "대중적", "겉바속촉", "추억의맛"],
    alcohols: ["생맥주", "콜라주"],
  },
  {
    id: 162,
    name: "치즈돈까스",
    category: "일식",
    tags: ["튀김", "치즈", "쭉쭉늘어나는", "고소함"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 163,
    name: "가츠동",
    category: "일식",
    tags: ["밥", "든든한", "덮밥요리", "단짠소스"],
    alcohols: ["생맥주", "사케"],
  },
  {
    id: 164,
    name: "규동",
    category: "일식",
    tags: ["밥", "고기", "일본식소고기덮밥", "간편한"],
    alcohols: ["하이볼", "사케"],
  },
  {
    id: 165,
    name: "텐동",
    category: "일식",
    tags: ["밥", "튀김", "화려한비주얼", "바삭한튀김덮밥"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 166,
    name: "오므라이스",
    category: "일식",
    tags: ["밥", "부드러운", "계란이불", "데미그라스"],
    alcohols: ["맥주", "레드와인"],
  },
  {
    id: 167,
    name: "초밥세트",
    category: "일식",
    tags: ["해산물", "가벼운", "신선한생선", "깔끔한"],
    alcohols: ["사케", "청하", "화이트와인"],
  },
  {
    id: 168,
    name: "모둠초밥",
    category: "일식",
    tags: ["해산물", "고급", "오마카세느낌", "다양한맛"],
    alcohols: ["사케", "화요"],
  },
  {
    id: 169,
    name: "사시미",
    category: "일식",
    tags: ["생선", "고급", "숙성회", "본연의맛"],
    alcohols: ["사케", "청하", "화요"],
  },
  {
    id: 170,
    name: "모둠꼬치",
    category: "일식",
    tags: ["꼬치", "인기", "불향가득", "골라먹는재미"],
    alcohols: ["하이볼", "생맥주", "사케"],
  },
  {
    id: 171,
    name: "닭꼬치",
    category: "일식",
    tags: ["꼬치", "짭짤한", "야키토리", "불맛"],
    alcohols: ["생맥주", "소주"],
  },
  {
    id: 172,
    name: "염통꼬치",
    category: "일식",
    tags: ["꼬치", "쫄깃한", "가성비안주", "중독성있는식감"],
    alcohols: ["하이볼", "소주"],
  },
  {
    id: 173,
    name: "새우튀김",
    category: "일식",
    tags: ["튀김", "바삭한", "일식튀김", "탱글탱글"],
    alcohols: ["생맥주", "화이트와인"],
  },
  {
    id: 174,
    name: "가라아게",
    category: "일식",
    tags: ["튀김", "대중적", "이자카야베스트", "부드러운속살"],
    alcohols: ["하이볼", "생맥주"],
  },
  {
    id: 175,
    name: "타코와사비",
    category: "일식",
    tags: ["가벼운", "와사비", "코가뻥", "쫄깃한낙지"],
    alcohols: ["사케", "소주", "하이볼"],
  },
  {
    id: 176,
    name: "명란구이",
    category: "일식",
    tags: ["구이", "짭짤한", "오이와함께", "고소한마요네즈"],
    alcohols: ["하이볼", "사케", "맥주"],
  },
  {
    id: 177,
    name: "나가사키탕",
    category: "일식",
    tags: ["국물", "시원한", "해산물듬뿍", "뽀얀국물"],
    alcohols: ["소주", "사케"],
  },
  {
    id: 178,
    name: "오코노미야키",
    category: "일식",
    tags: ["전", "든든한", "가쓰오부시", "일본식부침개"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 179,
    name: "야끼소바",
    category: "일식",
    tags: ["면", "마무리", "볶음면", "짭조름한"],
    alcohols: ["생맥주", "하이볼"],
  },
  {
    id: 180,
    name: "명란크림우동",
    category: "일식",
    tags: ["면", "부드러운", "퓨전요리", "꾸덕한소스"],
    alcohols: ["하이볼", "화이트와인"],
  },
  {
    id: 181,
    name: "나초",
    category: "양식",
    tags: ["스낵", "가벼운", "치즈소스", "영화관감성"],
    alcohols: ["맥주", "데킬라"],
  },
  {
    id: 182,
    name: "소시지구이",
    category: "양식",
    tags: ["구이", "짭짤한", "탱글탱글", "맥주안주"],
    alcohols: ["생맥주", "소맥"],
  },
  {
    id: 183,
    name: "모둠소시지",
    category: "양식",
    tags: ["구이", "인기", "다양한맛", "그릴자국"],
    alcohols: ["생맥주", "독일맥주"],
  },
  {
    id: 184,
    name: "치즈플래터",
    category: "양식",
    tags: ["치즈", "가벼운", "와인안주", "고급스러운"],
    alcohols: ["레드와인", "화이트와인", "샴페인"],
  },
  {
    id: 185,
    name: "하몽",
    category: "양식",
    tags: ["콜드컷", "짭짤한", "멜론궁합", "스페인요리"],
    alcohols: ["레드와인", "셰리와인"],
  },
  {
    id: 186,
    name: "살라미",
    category: "양식",
    tags: ["콜드컷", "짭짤한", "핑거푸드", "발효소시지"],
    alcohols: ["맥주", "레드와인"],
  },
  {
    id: 187,
    name: "브루스케타",
    category: "양식",
    tags: ["빵", "가벼운", "애피타이저", "상큼한토마토"],
    alcohols: ["화이트와인", "로제와인"],
  },
  {
    id: 188,
    name: "피자",
    category: "양식",
    tags: ["빵", "대중적", "치즈듬뿍", "피맥"],
    alcohols: ["맥주", "레드와인"],
  },
  {
    id: 189,
    name: "페퍼로니피자",
    category: "양식",
    tags: ["빵", "짭짤한", "미국맛", "짭조름한페퍼로니"],
    alcohols: ["맥주", "콜라주"],
  },
  {
    id: 190,
    name: "고르곤졸라피자",
    category: "양식",
    tags: ["빵", "달달한", "꿀찍어먹는", "푸른곰팡이치즈"],
    alcohols: ["화이트와인", "맥주"],
  },
  {
    id: 191,
    name: "파스타",
    category: "양식",
    tags: ["면", "마무리", "이탈리안", "다양한소스"],
    alcohols: ["와인", "하이볼"],
  },
  {
    id: 192,
    name: "알리오올리오",
    category: "양식",
    tags: ["면", "가벼운", "마늘향가득", "오일파스타"],
    alcohols: ["화이트와인", "맥주"],
  },
  {
    id: 193,
    name: "봉골레파스타",
    category: "양식",
    tags: ["면", "해산물", "조개풍미", "깔끔한맛"],
    alcohols: ["화이트와인", "드라이와인"],
  },
  {
    id: 194,
    name: "토마토파스타",
    category: "양식",
    tags: ["면", "상큼한", "토마토소스", "기본파스타"],
    alcohols: ["레드와인", "맥주"],
  },
  {
    id: 195,
    name: "크림파스타",
    category: "양식",
    tags: ["면", "부드러운", "고소한크림", "베이컨듬뿍"],
    alcohols: ["레드와인", "하이볼"],
  },
  {
    id: 196,
    name: "햄버거",
    category: "양식",
    tags: ["빵", "든든한", "수제버거", "육즙가득패티"],
    alcohols: ["맥주", "밀크쉐이크주"],
  },
  {
    id: 197,
    name: "치킨텐더",
    category: "양식",
    tags: ["튀김", "간편한", "안심살", "허니머스터드"],
    alcohols: ["맥주", "하이볼"],
  },
  {
    id: 198,
    name: "감바스",
    category: "양식",
    tags: ["해산물", "인기", "새우와마늘", "바게트필수"],
    alcohols: ["화이트와인", "맥주", "하이볼"],
  },
  {
    id: 199,
    name: "스테이크",
    category: "양식",
    tags: ["고기", "고급", "분위기있는", "육즙팡팡"],
    alcohols: ["레드와인", "위스키"],
  },
  {
    id: 200,
    name: "과일플래터",
    category: "디저트",
    tags: ["마무리", "상큼한", "제철과일", "입가심안주"],
    alcohols: ["샴페인", "스파클링와인", "브랜디"],
  },
];

const DinnerMenuPage = () => {
  const [selectedMenu, setSelectedMenu] = useState<
    (typeof dinnerMenus)[number] | null
  >(null);
  const [alcoholPairingMessage, setAlcoholPairingMessage] = useState(
    getRandomItem(ALCOHOL_PAIRING_MESSAGES),
  );
  const [recommendClickCount, setRecommendClickCount] = useState(0);
  const [clickMessage, setClickMessage] = useState("");
  const [isResultExiting, setIsResultExiting] = useState(false);
  const [isResultAnimating, setIsResultAnimating] = useState(false);
  const resultSwitchTimeoutRef = useRef<number | null>(null);
  const resultAnimationTimeoutRef = useRef<number | null>(null);
  const clickMessageTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resultSwitchTimeoutRef.current !== null) {
        window.clearTimeout(resultSwitchTimeoutRef.current);
      }
      if (resultAnimationTimeoutRef.current !== null) {
        window.clearTimeout(resultAnimationTimeoutRef.current);
      }
      if (clickMessageTimeoutRef.current !== null) {
        window.clearTimeout(clickMessageTimeoutRef.current);
      }
    };
  }, []);

  const showClickMessage = (message: string) => {
    if (clickMessageTimeoutRef.current !== null) {
      window.clearTimeout(clickMessageTimeoutRef.current);
    }

    setClickMessage(message);
    clickMessageTimeoutRef.current = window.setTimeout(() => {
      setClickMessage("");
      clickMessageTimeoutRef.current = null;
    }, CLICK_MESSAGE_VISIBLE_MS);
  };

  const updateRecommendClickMessage = () => {
    setRecommendClickCount((currentCount) => {
      const nextCount = currentCount + 1;
      const messages = CLICK_MESSAGES[nextCount];

      if (messages) {
        showClickMessage(getRandomItem(messages));
      }

      return nextCount;
    });
  };

  const lockResultAnimation = (duration: number) => {
    if (resultAnimationTimeoutRef.current !== null) {
      window.clearTimeout(resultAnimationTimeoutRef.current);
    }

    setIsResultAnimating(true);
    resultAnimationTimeoutRef.current = window.setTimeout(() => {
      setIsResultAnimating(false);
      resultAnimationTimeoutRef.current = null;
    }, duration);
  };

  const recommendRandomMenu = () => {
    if (isResultAnimating) {
      return;
    }

    updateRecommendClickMessage();

    const recommendableMenus =
      selectedMenu && dinnerMenus.length > 1
        ? dinnerMenus.filter((menu) => menu.id !== selectedMenu.id)
        : dinnerMenus;
    const nextMenu = getRandomItem(recommendableMenus);
    const nextAlcoholPairingMessage = getRandomItem(ALCOHOL_PAIRING_MESSAGES);

    if (!selectedMenu) {
      setSelectedMenu(nextMenu);
      setAlcoholPairingMessage(nextAlcoholPairingMessage);
      lockResultAnimation(RESULT_ENTER_ANIMATION_MS);
      return;
    }

    if (resultSwitchTimeoutRef.current !== null) {
      window.clearTimeout(resultSwitchTimeoutRef.current);
    }

    setIsResultExiting(true);
    resultSwitchTimeoutRef.current = window.setTimeout(() => {
      setSelectedMenu(nextMenu);
      setAlcoholPairingMessage(nextAlcoholPairingMessage);
      setIsResultExiting(false);
      resultSwitchTimeoutRef.current = null;
    }, RESULT_EXIT_ANIMATION_MS);
    lockResultAnimation(RESULT_EXIT_ANIMATION_MS + RESULT_ENTER_ANIMATION_MS);
  };

  const handleFindRestaurants = (name: string) => {
    const query = encodeURIComponent(`${name} 맛집`);
    window.open(
      `https://search.naver.com/search.naver?query=${query}`,
      "_blank",
    );
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: selectedMenu ? "flex-start" : "center",
        padding: selectedMenu ? "96px 16px 32px" : "32px 16px",
        boxSizing: "border-box",
        color: "#111827",
        fontFamily: "Pretendard, system-ui, -apple-system, sans-serif",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        className="dinner-title-container"
        style={{
          position: "fixed",
          top: selectedMenu ? "24px" : "var(--dinner-title-start-top)",
          left: 0,
          right: 0,
          zIndex: 20,
          margin: 0,
          padding: "16px",
          textAlign: "center",
          transition: "top 900ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
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
          {DINNER_TITLE_LINES.map((line, lineIndex) => (
            <span className="dinner-title-line" key={line}>
              {line.split("").map((letter, letterIndex) => {
                const animationIndex =
                  DINNER_TITLE_LINES.slice(0, lineIndex).join("").length +
                  letterIndex +
                  lineIndex;

                return (
                  <span
                    className={
                      !selectedMenu
                        ? letter === "?"
                          ? "dinner-title-question"
                          : "dinner-title-letter"
                        : undefined
                    }
                    key={`${letter}-${lineIndex}-${letterIndex}`}
                    style={{
                      animationDelay: `${animationIndex * 90}ms`,
                    }}
                  >
                    {letter === " " ? "\u00a0" : letter}
                  </span>
                );
              })}
            </span>
          ))}
        </h1>
        <p
          style={{
            marginTop: "6px",
            color: "#64748b",
            fontSize: "16px",
            fontWeight: 800,
            fontFamily: "Mona12, Pretendard, system-ui, sans-serif",
          }}
        >
          안주.ver
        </p>
      </div>

      <section
        className="dinner-menu-content"
        style={{
          width: "100%",
          maxWidth: "520px",
          textAlign: "center",
          paddingTop: selectedMenu ? 0 : "var(--dinner-menu-idle-padding-top)",
          minHeight: selectedMenu ? "340px" : "var(--dinner-menu-idle-height)",
        }}
      >
        <div
          style={{
            height: "44px",
            marginTop: selectedMenu ? "8px" : 0,
            marginBottom: "14px",
          }}
        >
          {clickMessage ? (
            <div
              className="dinner-menu-click-message"
              key={clickMessage}
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: "999px",
                backgroundColor: "#fef3c7",
                color: "#334155",
                fontSize: "15px",
                fontWeight: 700,
                fontFamily: "Pretendard, system-ui, sans-serif",
                wordBreak: "keep-all",
              }}
            >
              {clickMessage}
            </div>
          ) : null}
        </div>

        {selectedMenu ? (
          <div
            className={`dinner-menu-result-card${
              isResultExiting ? " dinner-menu-result-card-exit" : ""
            }`}
            key={selectedMenu.id}
            style={{
              marginTop: "32px",
              padding: "24px",
              minHeight: "220px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
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
              {/* {selectedMenu.category} */}
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
            <p
              style={{
                marginTop: "12px",
                color: "#8393a8",
                fontSize: "12px",
                fontWeight: 700,
                wordBreak: "keep-all",
              }}
            >
              {formatAlcoholPairingText(
                selectedMenu.alcohols,
                alcoholPairingMessage,
              )}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px",
                marginTop: "18px",
              }}
            >
              {selectedMenu.tags
                .filter((tag) => tag !== "회식")
                .map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "5px 8px",
                      borderRadius: "999px",
                      backgroundColor: "#e0f2fe",
                      color: "#075985",
                      fontSize: "10px",
                      fontWeight: 600,
                    }}
                  >
                    {tag}
                  </span>
                ))}
            </div>

            <button
              type="button"
              onClick={() => handleFindRestaurants(selectedMenu.name)}
              style={{
                alignSelf: "center",
                marginTop: "22px",
                width: "220px",
                maxWidth: "100%",
                minHeight: "38px",
                border: "1px solid #111827",
                borderRadius: "999px",
                backgroundColor: "#ffffff",
                color: "#111827",
                fontSize: "13px",
                fontWeight: 800,
                fontFamily: "Mona12, Pretendard, system-ui, sans-serif",
                cursor: "pointer",
              }}
            >
              {selectedMenu.name} 맛집 찾아보기 👀
            </button>
          </div>
        ) : null}

        <button
          className="dinner-menu-recommend-button"
          type="button"
          disabled={isResultAnimating}
          onClick={recommendRandomMenu}
          style={{
            width: "320px",
            maxWidth: "100%",
            minHeight: "56px",
            border: 0,
            borderRadius: "999px",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: "18px",
            fontWeight: 800,
            fontFamily: "Mona12, Pretendard, system-ui, sans-serif",
            cursor: isResultAnimating ? "not-allowed" : "pointer",
            opacity: isResultAnimating ? 0.72 : 1,
            boxShadow: isResultAnimating
              ? "0 5px 12px rgba(17, 24, 39, 0.12)"
              : "0 12px 28px rgba(17, 24, 39, 0.2)",
            marginTop: "32px",
            transition:
              "transform 120ms ease, box-shadow 120ms ease, background-color 120ms ease, opacity 120ms ease",
          }}
        >
          메뉴 추천받기
        </button>
      </section>
    </main>
  );
};

export default DinnerMenuPage;
