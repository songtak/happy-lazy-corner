import React, { useLayoutEffect } from "react";
import { useParams } from "react-router-dom";

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
  const { type } = useParams<{ type: string }>();
  const config = type ? typeConfig[type as TransportType] : undefined;
  const TransportComponent = config?.component;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document
      .querySelectorAll<HTMLElement>(".wrapper, .main")
      .forEach((el) => el.scrollTo({ top: 0, behavior: "auto" }));
  }, [type]);

  return (
    <DefaultLayout>
      <div style={{ minHeight: "100vh" }}>
        {config ? (
          <>
            <div
              className="gmedium mb16"
              style={{ fontSize: "28px", textAlign: "left" }}
            >
              {config.title}
            </div>
            {/* <div className="glight fs16">{config.description}</div> */}
            {TransportComponent && <TransportComponent />}
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
