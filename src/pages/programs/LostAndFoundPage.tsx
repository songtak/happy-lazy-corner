import React, { useLayoutEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import DefaultLayout from "@/components/common/DefaultLayout";
import {
  BusComponent,
  TaxiComponent,
  MetroComponent,
  TrainComponent,
} from "@/components/lostAndFound";

type TransportType = "bus" | "taxi" | "metro" | "train";

const typeConfig: Record<
  TransportType,
  { title: string; description: string; component?: React.ComponentType }
> = {
  bus: {
    title: "버스",
    description: "버스에서 잃어버린 물건을 조회할 수 있는 화면입니다.",
    component: BusComponent,
  },
  taxi: {
    title: "택시",
    description: "택시에서 잃어버린 물건을 조회할 수 있는 화면입니다.",
    component: TaxiComponent,
  },
  metro: {
    title: "전철",
    description: "전철에서 잃어버린 물건을 조회할 수 있는 화면입니다.",
    component: MetroComponent,
  },
  train: {
    title: "기차",
    description: "기차에서 잃어버린 물건을 조회할 수 있는 화면입니다.",
    component: TrainComponent,
  },
};

const LostAndFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type } = useParams<{ type: string }>();
  const config = type ? typeConfig[type as TransportType] : undefined;
  const TransportComponent = config?.component;

  const forceScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const appScrollContainer = document.getElementById("app-scroll-container");
    appScrollContainer?.scrollTo({ top: 0, behavior: "auto" });
    document.querySelectorAll<HTMLElement>(".wrapper, .main").forEach((el) => {
      el.scrollTop = 0;
      el.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  useLayoutEffect(() => {
    forceScrollTop();
    const timer1 = window.setTimeout(forceScrollTop, 0);
    const timer2 = window.setTimeout(forceScrollTop, 80);
    const timer3 = window.setTimeout(forceScrollTop, 180);
    requestAnimationFrame(forceScrollTop);
    return () => {
      window.clearTimeout(timer1);
      window.clearTimeout(timer2);
      window.clearTimeout(timer3);
    };
  }, [location.pathname, type]);

  return (
    <DefaultLayout>
      <div style={{ minHeight: "100vh" }}>
        <div
        // style={{
        //   width: "100%",
        //   // marginTop: "-30px",
        //   display: "flex",
        //   justifyContent: "flex-start",
        // }}
        >
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            style={{
              width: "32px",
              height: "32px",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              marginTop: "-46px",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "32px",
              marginLeft: "-8px",
              color: "black",
            }}
          >
            <ArrowLeft size={22} />
          </button>
        </div>
        {config ? (
          <>
            <div
              className="gmedium mb16"
              style={{ fontSize: "28px", textAlign: "left" }}
            >
              {config.title}
            </div>
            {/* <div className="glight fs16">{config.description}</div> */}
            {TransportComponent && (
              <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto" }}>
                <TransportComponent />
              </div>
            )}
          </>
        ) : (
          <>
            <div
              className="gmedium mb16"
              style={{ fontSize: "28px", textAlign: "left" }}
            >
              잘못된 접근입니다
            </div>
            <div className="glight fs16">
              지원하지 않는 타입입니다. (`bus`, `taxi`, `metro`, `train`)
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
};

export default LostAndFoundPage;
