import CryptoJS from "crypto-js";

const DEC_KEY = `${import.meta.env.VITE_DEC_KEY}`;

export const getResponseFromGPT = async (prompt: any, setChatData: any) => {
  const api_key =
    "/Ll851pdxEJb+rBDNWF9QpeZH5T8h+xguI0Nc6HnRnm6u+5XerLBNp9e7ybzmQtF3xiQDRsuub49FGs1y1VOhW3g37r/BHEk+eF65RcJPuxbNtJqpFlDZ/pWSPLJ5ILj37in9LZxYtGa1Wlxf0TOca+6oveIcuLjO2hkHBhY0yiLfzoavpGg+PpW+fWUvX1zT9RpHEbBqI0DLcs3JM74+Az4ajrCrya7C0/Q6PFJB9s=";

  function decodeAppKey(): string {
    const key = CryptoJS.enc.Utf8.parse(DEC_KEY);
    const decrypted = CryptoJS.AES.decrypt(api_key, key, {
      mode: CryptoJS.mode.ECB,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8); // UTF-8 형식으로 반환
  }
  const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${decodeAppKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      // model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
      max_tokens: 900,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder("utf-8");

  let accumulatedText = ""; // 지금까지의 전체 텍스트
  let previousLength = 0; // 이전 텍스트 길이

  while (reader) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value); // UTF-8로 디코딩
    const lines = chunk.split("\n"); // 줄 단위로 나누기
    for (const line of lines) {
      if (line.trim() === "" || line.startsWith("data: [DONE]")) {
        continue; // 빈 줄 또는 완료 신호 무시
      }

      if (line.startsWith("data: ")) {
        const json = line.replace("data: ", "").trim();
        try {
          const parsed = JSON.parse(json);
          const delta = parsed.choices[0]?.delta?.content || ""; // 새로 생성된 텍스트
          if (delta) {
            accumulatedText += delta; // 전체 텍스트에 추가
            const newContent = accumulatedText.slice(previousLength); // 이전 길이 이후의 새 텍스트만 추출
            previousLength = accumulatedText.length; // 업데이트된 길이 저장
            setChatData(newContent); // 새로운 텍스트만 전달
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  }

  return true;
  // return response;
};
