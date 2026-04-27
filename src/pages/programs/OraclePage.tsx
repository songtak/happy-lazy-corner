import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import oracleJson from "@assets/oracle.json";
import "@assets/styles/OraclePage.css";

export type OracleMessage = {
  id: number;
  title: string;
};

const oracleMessages = (oracleJson as OracleMessage[]).slice(0, 20);

const PRINT_DURATION_MS = 1500;
const TOTAL_STEPS = 9;
const STEP_MS = Math.max(90, Math.floor(PRINT_DURATION_MS / TOTAL_STEPS));

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function pickRandomMessage(messages: OracleMessage[]): OracleMessage {
  const safeMessages =
    messages.length > 0 ? messages : [{ id: 0, title: "..." }];
  const index = Math.floor(Math.random() * safeMessages.length);
  return safeMessages[index]!;
}

function formatReceiptDate(date: Date) {
  const mon = MONTHS[date.getMonth()] ?? "JAN";
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mon} ${dd}, ${yyyy}`;
}

function formatReceiptTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function toMMSS(totalSeconds: number) {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function clampReceiptText(text: string, max = 44) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, Math.max(0, max - 1))}…`;
}

const OraclePage: React.FC = () => {
  const [question, setQuestion] = useState<string>("");
  const [result, setResult] = useState<OracleMessage | null>(null);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStep, setPrintStep] = useState<number>(0);

  const stepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printMetaRef = useRef<{
    orderNo: number;
    printedAt: Date;
    questionSnapshot: string;
  } | null>(null);

  const questionText = question.trim() || "말하지 않은 고민";
  const isReceiptVisible = isPrinting || result !== null;
  const isPrintDone =
    result !== null && !isPrinting && printStep >= TOTAL_STEPS;

  const receiptMaxHeight = useMemo(() => {
    if (!isReceiptVisible) return 0;
    const step = Math.max(0, Math.min(TOTAL_STEPS, printStep));
    const base = 140;
    const extra = 420;
    return base + Math.round((extra * step) / TOTAL_STEPS);
  }, [isReceiptVisible, printStep]);

  const clearTimers = useCallback(() => {
    if (stepTimerRef.current) {
      clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (doneTimerRef.current) {
      clearTimeout(doneTimerRef.current);
      doneTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  const startPrint = useCallback(() => {
    if (isPrinting) return;

    const picked = pickRandomMessage(oracleMessages);
    const questionSnapshot = question.trim() || "말하지 않은 고민";
    printMetaRef.current = {
      orderNo: 1000 + Math.floor(Math.random() * 9000),
      printedAt: new Date(),
      questionSnapshot,
    };
    setResult(picked);
    setIsPrinting(true);
    setPrintStep(0);

    clearTimers();

    stepTimerRef.current = setInterval(() => {
      setPrintStep((s) => (s >= TOTAL_STEPS ? s : s + 1));
    }, STEP_MS);

    doneTimerRef.current = setTimeout(() => {
      clearTimers();
      setPrintStep(TOTAL_STEPS);
      setIsPrinting(false);
      setQuestion("");
    }, PRINT_DURATION_MS);
  }, [clearTimers, isPrinting, question]);

  const printedAt = printMetaRef.current?.printedAt ?? new Date();
  const orderNo = printMetaRef.current?.orderNo ?? 0;
  const receiptQuestionText =
    printMetaRef.current?.questionSnapshot ?? questionText;
  const dateText = formatReceiptDate(printedAt);
  const timeText = formatReceiptTime(printedAt);

  const questionSeconds = 45 + (receiptQuestionText.length % 165);
  const answerSeconds = 35 + ((result?.id ?? 0) % 185);
  const totalSeconds = questionSeconds + answerSeconds;

  return (
    <div className="oraclePage">
      <div className="oraclePage__container">
        <header className="oraclePage__header">
          <h1 className="oraclePage__title">운명의 영수증</h1>
          <p className="oraclePage__desc">
            고민을 적으면 어딘가의 프린터가 답을 뽑아줍니다.
          </p>
        </header>

        <section className="oraclePage__form" aria-label="고민 입력">
          <label className="oraclePage__label" htmlFor="oracleQuestion">
            {/* 고민(선택) */}
          </label>
          <textarea
            id="oracleQuestion"
            className="oraclePage__textarea"
            value={question}
            maxLength={100}
            onChange={(e) => setQuestion(e.target.value.slice(0, 100))}
            placeholder="오늘의 고민을 적어주세요… (비워도 됩니다)"
            rows={4}
            disabled={isPrinting}
          />
          <button
            className="oraclePage__button"
            type="button"
            onClick={startPrint}
            disabled={isPrinting}
          >
            {isPrinting ? "출력 중..." : "영수증 뽑기"}
          </button>
        </section>

        <section className="oracleStage" aria-label="영수증 출력">
          <div className={`oraclePrinter ${isPrinting ? "isPrinting" : ""}`}>
            <div className="oraclePrinter__top">
              <div className="oraclePrinter__brand">ORACLE PRINTER</div>
              <div
                className="oraclePrinter__status"
                aria-label={isPrinting ? "출력 중" : "대기"}
              >
                <span className="oraclePrinter__led" />
                <span className="oraclePrinter__labelText">
                  {isPrinting ? "PRINTING" : "READY"}
                </span>
              </div>
            </div>
            <div className="oraclePrinter__slot" aria-hidden="true">
              {isPrinting ? (
                <div className="oraclePrinter__dots">
                  <span />
                  <span />
                  <span />
                </div>
              ) : (
                <div className="oraclePrinter__slotHint">—</div>
              )}
            </div>
          </div>

          <div
            className={`oracleReceiptWrap ${isReceiptVisible ? "isOpen" : ""}`}
            style={{ maxHeight: `${receiptMaxHeight}px` }}
            aria-live="polite"
          >
            <div className="oracleReceipt">
              <div className="oracleReceipt__content">
                <div className="oracleReceipt__line oracleReceipt__row">
                  <span className="oracleReceipt__caps">
                    ORDER #{String(orderNo).padStart(4, "0")}
                  </span>
                </div>
                <div className="oracleReceipt__line oracleReceipt__row oracleReceipt__row--split">
                  <span className="oracleReceipt__caps">{dateText}</span>
                  <span className="oracleReceipt__caps">{timeText}</span>
                </div>

                <div className="oracleReceipt__line oracleReceipt__sep oracleReceipt__caps">
                  ----------------------------------------
                </div>

                <div className="oracleReceipt__line oracleReceipt__tableHeader oracleReceipt__caps">
                  <span>##</span>
                  <span>TITLE</span>
                  <span>LENGTH</span>
                </div>
                <div className="oracleReceipt__line oracleReceipt__sep oracleReceipt__caps">
                  ----------------------------------------
                </div>

                <div className="oracleReceipt__line oracleReceipt__tableRow">
                  <span className="oracleReceipt__caps">01</span>
                  <span className="oracleReceipt__caps">QUESTION</span>
                  <span className="oracleReceipt__caps">
                    {toMMSS(questionSeconds)}
                  </span>
                </div>
                <div className="oracleReceipt__line oracleReceipt__detail">
                  {clampReceiptText(receiptQuestionText, 56)}
                </div>

                <div className="oracleReceipt__line oracleReceipt__tableRow">
                  <span className="oracleReceipt__caps">02</span>
                  <span className="oracleReceipt__caps">ORACLE</span>
                  <span className="oracleReceipt__caps">
                    {toMMSS(answerSeconds)}
                  </span>
                </div>
                <div
                  className={`oracleReceipt__line oracleReceipt__detail oracleReceipt__result ${
                    isPrintDone ? "isVisible" : ""
                  }`}
                >
                  {result?.title ?? ""}
                </div>

                <div className="oracleReceipt__line oracleReceipt__sep oracleReceipt__caps">
                  ----------------------------------------
                </div>

                <div className="oracleReceipt__line oracleReceipt__row oracleReceipt__row--split oracleReceipt__caps">
                  <span>ITEM COUNT:</span>
                  <span>2</span>
                </div>
                <div className="oracleReceipt__line oracleReceipt__row oracleReceipt__row--split oracleReceipt__caps">
                  <span>TOTAL:</span>
                  <span>{toMMSS(totalSeconds)}</span>
                </div>

                <div className="oracleReceipt__line oracleReceipt__sep oracleReceipt__caps">
                  ----------------------------------------
                </div>

                <div className="oracleReceipt__line oracleReceipt__row oracleReceipt__row--split oracleReceipt__caps">
                  <span>FEE:</span>
                  <span>후회는 별도 청구</span>
                </div>

                <div className="oracleReceipt__line oracleReceipt__sep oracleReceipt__caps">
                  ----------------------------------------
                </div>
                <div className="oracleReceipt__line oracleReceipt__footer oracleReceipt__caps">
                  THANK YOU
                </div>
              </div>
            </div>
          </div>

          {isPrintDone ? (
            <div className="oraclePage__fineprint">
              이 영수증은 교환 및 환불이 어렵습니다.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default OraclePage;
