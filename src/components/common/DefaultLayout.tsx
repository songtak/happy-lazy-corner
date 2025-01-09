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
        <div>다른 내용 알아보기</div>
      </footer>
    </>
  );
};

export default DefaultLayout;
