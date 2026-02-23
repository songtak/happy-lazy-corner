import React, { useRef, useState } from "react";
import { Button } from "@mui/material";

type TaxiUseType = "" | "app" | "street";
type YesNo = "" | "yes" | "no";
type PaymentType = "" | "card" | "transfer" | "cash";

const cardStyle: React.CSSProperties = {
  width: "82vw",
  // width: "100%",
  boxSizing: "border-box",
  border: "1px solid #e6ecff",
  borderRadius: "18px",
  padding: "16px",
  backgroundColor: "#ffffff",
  boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
};

const buttonStyle = {
  borderRadius: "18px",
  fontFamily: "GMedium",
  padding: "8px 12px",
  width: "100%",
};

const TaxiLostNotice = ({ style }: { style?: React.CSSProperties }) => {
  return (
    <div>
      <div
        className="glight"
        style={{ fontSize: 12, marginTop: "16px", ...style }}
      >
        택시 분실물은 별도 보관소로 이동되기 전에{" "}
        <div>기사님이 보관하고 있는 경우가 많습니다.</div>
        <div className="gbold" style={{ marginTop: "12px" }}>
          빠른 확인을 위해 직접 연락해보세요.{" "}
        </div>
        <div style={{ marginTop: "12px" }}>
          일정 기간 주인을 찾지 못한 물품은 경찰서로 인계되며
        </div>
        <div>이후 LOST112에서 조회할 수 있습니다.</div>
      </div>

      <div
        style={{
          marginTop: "16px",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <Button
          sx={{
            marginTop: "12px",
            width: "280px",
            fontFamily: "GMedium",
            borderRadius: "18px",
          }}
          variant="outlined"
          onClick={() =>
            window.open(
              "https://news.seoul.go.kr/traffic/find#list/1",
              "_blank",
            )
          }
        >
          서울시 대중교통 분실물센터 조회하기
        </Button>
        <Button
          sx={{
            width: "280px",
            fontFamily: "GMedium",
            borderRadius: "18px",
          }}
          variant="outlined"
          onClick={() =>
            window.open("https://www.lost112.go.kr/find/findList.do", "_blank")
          }
        >
          경찰청 분실물 조회하기
        </Button>
      </div>
    </div>
  );
};

const TaxiComponent = () => {
  const [taxiUseType, setTaxiUseType] = useState<TaxiUseType>("");
  const [appHasRecord, setAppHasRecord] = useState<YesNo>("");
  const [appNoRecordKnowTaxiNo, setAppNoRecordKnowTaxiNo] = useState<YesNo>("");
  const [appNoRecordPayment, setAppNoRecordPayment] = useState<PaymentType>("");
  const [streetKnowCarNo, setStreetKnowCarNo] = useState<YesNo>("");
  const [streetPayment, setStreetPayment] = useState<PaymentType>("");

  const card2Ref = useRef<HTMLDivElement | null>(null);
  const card3Ref = useRef<HTMLDivElement | null>(null);
  const cardStreet2Ref = useRef<HTMLDivElement | null>(null);
  const cardStreet3Ref = useRef<HTMLDivElement | null>(null);
  const cardStreet4Ref = useRef<HTMLDivElement | null>(null);
  const cardAppNoRecordTaxiNoRef = useRef<HTMLDivElement | null>(null);
  const cardAppNoRecordPaymentGuideRef = useRef<HTMLDivElement | null>(null);

  const scrollToCard = (ref: React.RefObject<HTMLDivElement | null>) => {
    window.setTimeout(() => {
      const target = ref.current;
      if (!target) return;

      const appScrollContainer = document.getElementById(
        "app-scroll-container",
      );
      if (appScrollContainer) {
        const containerRect = appScrollContainer.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const top =
          appScrollContainer.scrollTop + (targetRect.top - containerRect.top);
        appScrollContainer.scrollTo({ top, behavior: "smooth" });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }, 80);
  };

  const handleSelectTaxiUseType = (type: TaxiUseType) => {
    setTaxiUseType(type);
    setAppHasRecord("");
    setAppNoRecordKnowTaxiNo("");
    setAppNoRecordPayment("");
    setStreetKnowCarNo("");
    setStreetPayment("");
    scrollToCard(type === "app" ? card2Ref : cardStreet2Ref);
  };

  const handleSelectAppRecord = (value: YesNo) => {
    setAppHasRecord(value);
    setAppNoRecordKnowTaxiNo("");
    setAppNoRecordPayment("");
    scrollToCard(value === "no" ? cardAppNoRecordTaxiNoRef : card3Ref);
  };

  const handleSelectAppNoRecordTaxiNo = (value: YesNo) => {
    setAppNoRecordKnowTaxiNo(value);
    setAppNoRecordPayment("");
    scrollToCard(card3Ref);
  };

  const handleSelectAppNoRecordPayment = (value: PaymentType) => {
    setAppNoRecordPayment(value);
    scrollToCard(cardAppNoRecordPaymentGuideRef);
  };

  const handleSelectStreetKnowCarNo = (value: YesNo) => {
    setStreetKnowCarNo(value);
    setStreetPayment("");
    scrollToCard(cardStreet3Ref);
  };

  const handleSelectStreetPayment = (value: PaymentType) => {
    setStreetPayment(value);
    scrollToCard(cardStreet4Ref);
  };

  return (
    <div
      style={{
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: "16px",
        width: "100%",
      }}
    >
      <div style={cardStyle}>
        <div
          className="gmedium"
          style={{ fontSize: "18px", marginBottom: "20px", textAlign: "left" }}
        >
          택시를 어떻게 이용했나요?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <Button
            variant={taxiUseType === "app" ? "contained" : "outlined"}
            sx={buttonStyle}
            onClick={() => handleSelectTaxiUseType("app")}
          >
            🚖 호출 앱으로 이용
          </Button>
          <Button
            variant={taxiUseType === "street" ? "contained" : "outlined"}
            sx={buttonStyle}
            onClick={() => handleSelectTaxiUseType("street")}
          >
            🚕 길에서 탑승
          </Button>
        </div>
      </div>

      {taxiUseType === "app" && (
        <div ref={card2Ref} style={cardStyle}>
          <div
            className="gmedium"
            style={{
              fontSize: "18px",
              marginBottom: "16px",
              textAlign: "left",
            }}
          >
            이용 기록이 남아 있나요?
          </div>
          <div
            className="glight"
            style={{ marginBottom: "12px", fontSize: "14px" }}
          >
            (카카오T / 타다 / i.m 등)
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant={appHasRecord === "yes" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectAppRecord("yes")}
            >
              예
            </Button>
            <Button
              variant={appHasRecord === "no" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectAppRecord("no")}
            >
              아니오
            </Button>
          </div>
        </div>
      )}

      {taxiUseType === "app" && appHasRecord === "yes" && (
        <>
          <div>
            <div ref={card3Ref} style={cardStyle}>
              <div
                className="gmedium"
                style={{
                  fontSize: "18px",
                  marginBottom: "12px",
                  textAlign: "left",
                }}
              >
                기록 있음
              </div>
              <div
                className="glight"
                style={{ fontSize: "14px", textAlign: "left" }}
              >
                <div>
                  ◦ <span className="gmedium"> 카카오T</span> (
                  <a
                    href="tel:15999400"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    1599-9400
                  </a>
                  )
                  <div style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    : 카카오T 앱 실행 → 내정보 → 이용기록 → 분실물 발생한 내역
                    선택 → 기사님께 전화
                  </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                  ◦<span className="gmedium"> 타다 </span>(
                  <a
                    href="tel:16441188"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    1644-1188
                  </a>
                  )
                  <div style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    : 타다 앱 실행 → 이용기록 → 분실물 발생한 내역 선택 →
                    기사님께 연락하기
                  </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                  ◦<span className="gmedium"> i.m</span> (
                  <a
                    href="tel:16887722"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    1688-7722
                  </a>
                  )
                  <div style={{ paddingLeft: "14px", fontSize: "12px" }}>
                    : i.m 앱 실행 → 메뉴 → 이용 내역 → 택시 → 분실물 발생한 내역
                    선택 → 기사님께 연락하기
                  </div>
                </div>
              </div>
            </div>
          </div>
          <TaxiLostNotice />
        </>
      )}

      {taxiUseType === "app" && appHasRecord === "no" && (
        <div ref={cardAppNoRecordTaxiNoRef} style={cardStyle}>
          <div
            className="gmedium"
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            택시번호를 기억하시나요?
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant={
                appNoRecordKnowTaxiNo === "yes" ? "contained" : "outlined"
              }
              sx={buttonStyle}
              onClick={() => handleSelectAppNoRecordTaxiNo("yes")}
            >
              네
            </Button>
            <Button
              variant={
                appNoRecordKnowTaxiNo === "no" ? "contained" : "outlined"
              }
              sx={buttonStyle}
              onClick={() => handleSelectAppNoRecordTaxiNo("no")}
            >
              아니오
            </Button>
          </div>
        </div>
      )}

      {taxiUseType === "app" &&
        appHasRecord === "no" &&
        appNoRecordKnowTaxiNo === "yes" && (
          <>
            <div ref={card3Ref} style={cardStyle}>
              <div
                className="gmedium"
                style={{
                  fontSize: "18px",
                  marginBottom: "12px",
                  textAlign: "left",
                }}
              >
                방법 안내
              </div>
              <div className="glight" style={{ fontSize: "14px" }}>
                기억하는 택시 번호를 기준으로 바로 분실 문의를 진행하세요.
                <div style={{ marginTop: "32px" }}>
                  <span className="gmedium">
                    서울특별시개인택시운송사업조합
                  </span>
                  (
                  <a
                    href="tel:0220846300"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    02-2084-6300
                  </a>
                  )
                </div>
                <div style={{ marginTop: "12px" }}>
                  <span className="gmedium">서울택시조합 </span>(
                  <a
                    href="tel:0220339200"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    02-2033-9200
                  </a>
                  )
                </div>
              </div>
            </div>
            <TaxiLostNotice />
          </>
        )}

      {taxiUseType === "app" &&
        appHasRecord === "no" &&
        appNoRecordKnowTaxiNo === "no" && (
          <div ref={card3Ref} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "20px",
                textAlign: "left",
              }}
            >
              결제 수단 선택
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <Button
                variant={
                  appNoRecordPayment === "card" ? "contained" : "outlined"
                }
                sx={buttonStyle}
                onClick={() => handleSelectAppNoRecordPayment("card")}
              >
                카드 결제
              </Button>
              <Button
                variant={
                  appNoRecordPayment === "transfer" ? "contained" : "outlined"
                }
                sx={buttonStyle}
                onClick={() => handleSelectAppNoRecordPayment("transfer")}
              >
                계좌이체
              </Button>
              <Button
                variant={
                  appNoRecordPayment === "cash" ? "contained" : "outlined"
                }
                sx={buttonStyle}
                onClick={() => handleSelectAppNoRecordPayment("cash")}
              >
                현금 결제
              </Button>
            </div>
          </div>
        )}

      {taxiUseType === "app" &&
        appHasRecord === "no" &&
        appNoRecordKnowTaxiNo === "no" &&
        appNoRecordPayment === "card" && (
          <>
            <div ref={cardAppNoRecordPaymentGuideRef} style={cardStyle}>
              <div
                className="gmedium"
                style={{
                  fontSize: "18px",
                  marginBottom: "12px",
                  textAlign: "left",
                }}
              >
                카드결제 안내
              </div>
              <div className="glight" style={{ fontSize: "14px" }}>
                <div>
                  티머니 결제 단말기를 사용한 경우 고객센터를 통해 이용 택시
                  정보를 확인할 수 있습니다.
                </div>
                <div></div>
                <div style={{ marginTop: "32px" }}>
                  티머니 고객센터 (
                  <a
                    href="tel:16441188"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    1644-1188
                  </a>
                  )
                </div>
              </div>
            </div>
            <TaxiLostNotice />
          </>
        )}

      {taxiUseType === "app" &&
        appHasRecord === "no" &&
        appNoRecordKnowTaxiNo === "no" &&
        appNoRecordPayment === "transfer" && (
          <div ref={cardAppNoRecordPaymentGuideRef} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                textAlign: "left",
              }}
            >
              계좌이체 안내
            </div>
            <div className="glight" style={{ fontSize: "14px" }}>
              이체 기록(수취인/시간/금액)을 정리해 고객센터로 분실 문의를
              진행하세요.
              <div style={{ marginTop: "32px" }}>
                <span className="gmedium">서울특별시개인택시운송사업조합</span>(
                <a
                  href="tel:0220846300"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2084-6300
                </a>
                )
              </div>
              <div style={{ marginTop: "12px" }}>
                <span className="gmedium">서울택시조합 </span>(
                <a
                  href="tel:0220339200"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2033-9200
                </a>
                )
              </div>
            </div>
          </div>
        )}

      {taxiUseType === "app" &&
        appHasRecord === "no" &&
        appNoRecordKnowTaxiNo === "no" &&
        appNoRecordPayment === "cash" && (
          <div ref={cardAppNoRecordPaymentGuideRef} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                textAlign: "left",
              }}
            >
              현금 결제 안내
            </div>
            <div className="glight" style={{ fontSize: "14px" }}>
              탑승 시간/승하차 위치/택시 특징을 최대한 상세히 정리해 관할 기관에
              문의하세요.
              <div style={{ marginTop: "32px" }}>
                <span className="gmedium">서울특별시개인택시운송사업조합</span>(
                <a
                  href="tel:0220846300"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2084-6300
                </a>
                )
              </div>
              <div style={{ marginTop: "12px" }}>
                <span className="gmedium">서울택시조합 </span>(
                <a
                  href="tel:0220339200"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2033-9200
                </a>
                )
              </div>
            </div>
          </div>
        )}

      {taxiUseType === "street" && (
        <div ref={cardStreet2Ref} style={cardStyle}>
          <div
            className="gmedium"
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            택시번호를 기억하시나요?
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant={streetKnowCarNo === "yes" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectStreetKnowCarNo("yes")}
            >
              안다
            </Button>
            <Button
              variant={streetKnowCarNo === "no" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectStreetKnowCarNo("no")}
            >
              모른다
            </Button>
          </div>
        </div>
      )}

      {taxiUseType === "street" && streetKnowCarNo === "yes" && (
        <>
          <div ref={cardStreet3Ref} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                textAlign: "left",
              }}
            >
              방법 안내
            </div>
            <div className="glight" style={{ fontSize: "14px" }}>
              기억하는 택시 번호를 기준으로 바로 분실 문의를 진행하세요.
              <div style={{ marginTop: "32px" }}>
                <span className="gmedium">서울특별시개인택시운송사업조합</span>(
                <a
                  href="tel:0220846300"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2084-6300
                </a>
                )
              </div>
              <div style={{ marginTop: "12px" }}>
                <span className="gmedium">서울택시조합 </span>(
                <a
                  href="tel:0220339200"
                  style={{ color: "#2f74ea", textDecoration: "underline" }}
                >
                  02-2033-9200
                </a>
                )
              </div>
            </div>
          </div>
          <TaxiLostNotice />
        </>
      )}

      {taxiUseType === "street" && streetKnowCarNo === "no" && (
        <div ref={cardStreet3Ref} style={cardStyle}>
          <div
            className="gmedium"
            style={{
              fontSize: "18px",
              marginBottom: "20px",
              textAlign: "left",
            }}
          >
            결제 방법 선택
          </div>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <Button
              variant={streetPayment === "card" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectStreetPayment("card")}
            >
              카드 결제
            </Button>
            <Button
              variant={streetPayment === "transfer" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectStreetPayment("transfer")}
            >
              계좌이체
            </Button>
            <Button
              variant={streetPayment === "cash" ? "contained" : "outlined"}
              sx={buttonStyle}
              onClick={() => handleSelectStreetPayment("cash")}
            >
              현금 결제
            </Button>
          </div>
        </div>
      )}

      {taxiUseType === "street" &&
        streetKnowCarNo === "no" &&
        streetPayment === "card" && (
          <>
            <div ref={cardStreet4Ref} style={cardStyle}>
              <div
                className="gmedium"
                style={{
                  fontSize: "18px",
                  marginBottom: "12px",
                  textAlign: "left",
                }}
              >
                카드결제 안내
              </div>
              <div className="glight" style={{ fontSize: "14px" }}>
                <div>
                  티머니 결제 단말기를 사용한 경우 고객센터를 통해 이용 택시
                  정보를 확인할 수 있습니다.
                </div>
                <div></div>
                <div style={{ marginTop: "32px" }}>
                  티머니 고객센터 (
                  <a
                    href="tel:16441188"
                    style={{ color: "#2f74ea", textDecoration: "underline" }}
                  >
                    1644-1188
                  </a>
                  )
                </div>
              </div>
            </div>
            <TaxiLostNotice />
          </>
        )}

      {taxiUseType === "street" &&
        streetKnowCarNo === "no" &&
        streetPayment === "transfer" && (
          <div ref={cardStreet4Ref} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                textAlign: "left",
              }}
            >
              계좌이체 안내
            </div>
            <div className="glight" style={{ fontSize: "14px" }}>
              이체 기록(수취인, 시간, 금액)을 준비해 관할 택시조합/운수사에 분실
              문의를 진행하세요.
            </div>
          </div>
        )}

      {taxiUseType === "street" &&
        streetKnowCarNo === "no" &&
        streetPayment === "cash" && (
          <div ref={cardStreet4Ref} style={cardStyle}>
            <div
              className="gmedium"
              style={{
                fontSize: "18px",
                marginBottom: "12px",
                textAlign: "left",
              }}
            >
              현금 결제 안내
            </div>
            <div className="glight" style={{ fontSize: "14px" }}>
              탑승 시간/하차 위치/택시 특징을 최대한 상세히 정리해 인근
              택시조합과 경찰청 분실물 시스템에 문의하세요.
            </div>
          </div>
        )}

      <div style={{ height: "45vh", minHeight: "260px", width: "100%" }} />
    </div>
  );
};

export default TaxiComponent;
