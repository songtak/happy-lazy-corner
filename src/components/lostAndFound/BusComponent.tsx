import React, { useMemo, useState } from "react";
import { Autocomplete, Button, TextField } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import seoulBus from "@/assets/seoul_bus.json";

type BusOption = {
  rte_nm: string;
  rte_id: string;
};

const BusComponent = () => {
  const navigate = useNavigate();
  const VITE_DATA_API_DE_KEY = `${import.meta.env.VITE_DATA_API_DE_KEY}`;
  const [busNumber, setBusNumber] = useState("");
  const [selectedBus, setSelectedBus] = useState<BusOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [corpName, setCorpName] = useState("");
  const busOptions = useMemo(() => (seoulBus.DATA as BusOption[]) ?? [], []);

  const handleClickSubmit = async () => {
    if (!selectedBus) return;

    try {
      setLoading(true);
      const response = await axios.get(
        "http://ws.bus.go.kr/api/rest/busRouteInfo/getRouteInfo",
        {
          params: {
            ServiceKey: VITE_DATA_API_DE_KEY,
            busRouteId: selectedBus.rte_id,
          },
          responseType: "text",
        },
      );
      console.log("getRouteInfo response", response.data);

      const xmlDoc = new DOMParser().parseFromString(
        response.data,
        "application/xml",
      );
      const corpNmValue =
        xmlDoc.querySelector("corpNm")?.textContent?.trim() ?? "";
      const finalCorpNm = corpNmValue || "서부운수 02-372-0221";
      setCorpName(finalCorpNm);
      setIsLocked(true);
    } catch (error) {
      console.error("getRouteInfo error", error);
      setCorpName("서부운수 02-372-0221");
      setIsLocked(true);
    } finally {
      setLoading(false);
    }
  };

  // rte_id

  return (
    <div
      style={{
        marginTop: "24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Autocomplete
          size="small"
          sx={{ width: "240px" }}
          disabled={isLocked}
          options={busOptions}
          value={selectedBus}
          inputValue={busNumber}
          freeSolo
          openOnFocus
          getOptionLabel={(option) =>
            typeof option === "string" ? option : option.rte_nm
          }
          isOptionEqualToValue={(option, value) =>
            typeof value !== "string" && option.rte_id === value.rte_id
          }
          filterOptions={(options, state) => {
            const keyword = state.inputValue.trim();
            if (!keyword) return options;
            return options.filter(
              (option) =>
                option.rte_nm.startsWith(keyword) ||
                option.rte_nm.endsWith(keyword),
            );
          }}
          onChange={(_, value) => {
            if (typeof value === "string") {
              setBusNumber(value.slice(0, 7));
              setSelectedBus(null);
              return;
            }
            setSelectedBus(value);
            setBusNumber(value?.rte_nm ?? "");
          }}
          onInputChange={(_, value) => {
            setBusNumber(value.slice(0, 7));
            setSelectedBus(null);
          }}
          ListboxProps={{
            sx: {
              maxHeight: "288px",
              overflowY: "auto",
            },
          }}
          renderOption={(props, option) => (
            <li {...props} key={option.rte_id}>
              {option.rte_nm}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="버스번호"
              inputProps={{ ...params.inputProps, maxLength: 7 }}
            />
          )}
        />
        <Button
          variant="contained"
          onClick={handleClickSubmit}
          disabled={loading || !selectedBus || isLocked}
        >
          검색
        </Button>
      </div>
      {corpName && (
        <div>
          <div className="glight" style={{ paddingTop: "32px" }}>
            <div style={{ fontWeight: 600 }}>운영사</div>
            <div>{corpName}</div>

            <div style={{ fontSize: 10, marginTop: "12px" }}>
              버스 분실물은 별도로 통합 관리되지 않습니다.
              <div>해당 노선을 운행하는 운수사에 전화로 문의하셔야 합니다.</div>
            </div>
            <Button
              sx={{ marginTop: "16px" }}
              variant="outlined"
              onClick={() => navigate("/lost-and-found/search")}
            >
              경찰청 분실물 조회하기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusComponent;
