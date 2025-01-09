import { useState } from "react";
import { parseStringPromise } from "xml2js";

const useXmlToJson = () => {
  const [json, setJson] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  const convertXmlToJson = async (xml: string) => {
    try {
      const result = await parseStringPromise(xml, { explicitArray: false });
      setJson(result);
      setError(null); // 성공 시 오류 초기화
    } catch (err) {
      console.error("XML Parsing Error:", err);
      setJson(null); // 실패 시 JSON 초기화
      setError("Invalid XML format. Please check your input.");
    }
  };

  return { json, error, convertXmlToJson };
};

export default useXmlToJson;
