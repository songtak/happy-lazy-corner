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
      <main className="main" style={{ paddingBottom: "4rem" }}>
        {children}
      </main>
    </>
  );
};

export default DefaultLayout;
