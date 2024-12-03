import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const DefaultLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      <header
        className={`header ${location.pathname !== "/" && "program_title"}`}
      >
        <span
          className="pointer"
          onClick={() => {
            navigate("/");
          }}
        >
          HAPPY LAZY CORNER
        </span>
      </header>
      <main className="main">
        <Outlet />
      </main>

      <footer className="footer ">
        <span className="pointer">&copy; 2024 Songtak</span>
      </footer>
    </>
  );
};

export default DefaultLayout;
