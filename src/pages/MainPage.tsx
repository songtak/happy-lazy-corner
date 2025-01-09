import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { projectList } from "../routes/mainRoute";
import DefaultLayout from "@/components/common/DefaultLayout";

const MainPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <DefaultLayout>
      <div>
        <div>
          {projectList.map((item: any, i: number) => (
            <div key={i} className=" mb24">
              <span
                className="pointer "
                onClick={() => {
                  navigate(item.path);
                }}
              >
                {item.title}
              </span>
            </div>
          ))}
          <div>
            {/* <span
          className="pointer "
          onClick={() => {
            window.location.href = "https://www.emoji2025.site";
            // navigate("https://www.emoji2025.site/");
          }}
        >
          2025년 나에게 생길 좋은 일들은?
        </span> */}
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MainPage;
