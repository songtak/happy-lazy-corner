import React, { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}
const DefaultLayout = ({ children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <header
        className={`header ${location.pathname !== "/" && "program_title"}`}
      >
        {location.pathname === "/" && (
          <span
            className="pointer"
            onClick={() => {
              navigate("/");
            }}
          >
            HAPPY 🧡 LAZY 🧡 CORNER
          </span>
        )}
      </header>
      <main className="main">{children}</main>

      <footer className="footer ">
        {/* <span className="pointer">&copy; 2024 Songtak</span> */}
        <div style={{ fontSize: "8px", color: "#d1d1d1" }}>
          이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를
          제공받습니다.
        </div>
        {/* <div>다른 내용 알아보기</div> */}
      </footer>
    </>
  );
};

export default DefaultLayout;
