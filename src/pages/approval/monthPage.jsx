import React, {useCallback, useEffect, useMemo, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, fetchWithAuth, doLogout } from "../../utils/auth";
import styles from "./monthly.module.css";

const API_BASE_SV = 'https://3.34.245.155/api';

// 0) 안전 파서
const toDate = (v) => {
  if (v == null) return null;
  if (v instanceof Date) return isNaN(v) ? null : v;
  if (typeof v === "number") { const d = new Date(v); return isNaN(d) ? null : d; }
  if (Array.isArray(v) && v.length >= 3) { // [yyyy, m, d] 형태 대비
    const d = new Date(v[0], v[1] - 1, v[2]);
    return isNaN(d) ? null : d;
  }
  const d = new Date(String(v));
  return isNaN(d) ? null : d;
};

// 1) 포맷터(내부에서 toDate 사용)
const yyyymm = (v) => {
  const d = toDate(v);
  if (!d) return "-- ----";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const yymm = (v) => {
  const d = toDate(v);
  if (!d) return "-- --";
  return `${String(d.getFullYear()).slice(-2)}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const yymmddDots = (v) => {
  const d = toDate(v);
  if (!d) return "--.--.--";
  return `${String(d.getFullYear()).slice(-2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const money = (n) => Number(n || 0).toLocaleString("ko-KR");

const detectMine = (b64) => {
    const s = (b64 || "").slice(0, 16);
    if (s.startsWith("/9j")) return "image/jpeg";
    if (s.startsWith("iVBOR")) return "image/png";
    if (s.startsWith("R0lGOD")) return "image/gif";
    return "image/*";
}

const toSrc = (raw) => {
    if (!raw) return null;
    const t = String(raw).trim();
    if (t.startsWith("data:")) return t;
    const b = t.replace(/\s+/g, "");
    return `data:${detectMine(b)};base64,${b}`;
}

// "2025-06" → { year: 2025, month: 6 }
const parseYearMonth = (ymStr) => {
  const [y, m] = String(ymStr).split("-").map(Number);
  return { year: y, month: m };
};

// 서버 응답 래퍼 → 화면에서 쓰는 아이템으로 평탄화
const normalizeItem = ({ approvalRequests = {}, approvers = [], byteFile = null } = {}) => {
  const receiptFile = approvalRequests.receiptFile ?? byteFile ?? null;
  return {
    ...approvalRequests,          // requestDate, title, requestedAmount, approvalCode, ...
    approvers,                    // 필요 시 사용
    receiptFile,                  // 이미지 통일 (byteFile 보완)
  };
};


function CoverPage({ym}){
    return(
        <section className={styles.page}>
            <div className={styles.cover}>
                <div>
                    <h1>월별 결산</h1>
                    <div className={styles.m}>{ym.replace("-", "년 ")}월</div>
                    <p className={styles.subtitle}>컴퓨터공학부 종합관리시스템</p>
                </div>
            </div>
        </section>
    );
}

function Col({req, seq}){
    if(!req) return <div className={styles.col} />

    const no = `${yymm(req?.requestDate)}-${String(seq).padStart(2, "0")}`;
    const dt = yymmddDots(req?.requestDate);

    return (
        <div className={styles.col}>
            <div className={styles.hx}>
                <div className={styles.dots}>{no}</div>
                <div className={styles.dots}>{dt}</div>
            </div>
            <div className={styles.row}>
                <span className={styles.lbl}>건명 :</span>
                {req.title || "-"}
            </div>
            <div className={styles.receiptWrap}>
                {req.receiptFile ? (
                    <img className={styles.receipt} alt="receipt" src={toSrc(req.receiptFile)} />
                ) : null}
            </div>
            <div className={styles.mini}>
                <div className={styles.cell}>
                    <span className={styles.lbl}>예산 코드</span>
                    {req.approvalCode || "-"}
                </div>
                <div className={styles.cell}>
                    <span className={styles.lbl}>금액</span>
                    {money(req.requestedAmount)} 원
                </div>
            </div>
            <div className={styles.foot}>
                <div className={styles.cell}>확인</div>
                <div className={styles.cell}>결재</div>
            </div>
        </div>
    );
}

function ContentPage({pair, startIndex}){
    return (
        <section className={styles.page}>
            <div className={styles.sheet}>
                <div className={styles.two}>
                    <Col req={pair[0]} seq={startIndex + 1} />
                    <Col req={pair[1]} seq={startIndex + 2} />
                </div>
            </div>
        </section>
    );
}

function MonthPage(){
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [month, setMonth] = useState(yyyymm(new Date()));

    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try{
                const i = await loadUserInfo();
                setUser(i);
            } catch (e) {
                console.error(e);
                /* navigate("/"); */
            }
        })();
    }, [navigate]);

    /* 달이 바뀔 때마다 결산 요청 */
    useEffect(() => {
        let alive = true;
        (async () => {
            try{
                setError("");
                setFetching(true);
                const {year, month: mon} = parseYearMonth(month);

                const res = await fetchWithAuth(`${API_BASE_SV}/approval/getMonthlyRequest`, {
                    method: "POST",
                    body: JSON.stringify({year, month: mon})
                });

                if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || res.statusText);
                }

                const json = await res.json();

                // result가 래퍼 배열이므로 평탄화
                let arr = Array.isArray(json?.result) ? json.result.map(normalizeItem) : [];
                // 금액 키 보정(혹시 다른 이름으로 올 때 대비)
                arr = arr.map(it => ({ ...it, requestedAmount: it.requestedAmount ?? it.requestAmount ?? it.amount ?? 0 }));

                if (alive) setRequests(arr);
            } catch (e) {
                if (alive) setError(e.message || "데이터 로드 실패");
            } finally {
                if (alive){
                    setLoading(false);
                    setFetching(false);
                }
            }
        })();

        return () => {
            alive = false;
        };
    }, [month]);

    const onPrint = useCallback(() => window.print(), []);

    const onLogout = useCallback(async () => {
        await doLogout();
        navigate("/");
    }, [navigate]);

    const pairs = useMemo(() => {
    const inMonth = (requests || [])
        .slice()
        .sort((a, b) => (toDate(a.requestDate)?.getTime() ?? 0) - (toDate(b.requestDate)?.getTime() ?? 0));
    const out = [];
    for (let i = 0; i < inMonth.length; i += 2) out.push([inMonth[i], inMonth[i + 1] || null]);
    return out;
    }, [requests]);

    return(
        <div className={styles.wrap}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
                <div className={styles["section-title"]}>메뉴</div>
                <nav className={styles.nav}>
                    <Link to="/userpg">마이페이지</Link>
                    <Link to="/document_board">문서 게시판</Link>
                    <Link to="/event_board">이벤트 게시판</Link>
                    <Link to="/approval_req">결재 신청</Link>
                    <Link to="/approval_approved">결재</Link>
                    <Link to="/monthly_page" className={styles.active}>월별 결산</Link>
                    <Link to="/">설정</Link>
                    <Link to="/permission">권한변경</Link>              
                </nav>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                <div>로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b></div>
                <button className={styles.logout} onClick={onLogout}>로그아웃</button>
                </header>

                <div className={styles.content}>
                <div className={styles.toolbar}>
                    <label>월 선택{" "}<input className={styles.input} type="month" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="월 선택" /></label>
                    <button className={styles.btn} onClick={onPrint} disabled={loading}>PDF로 저장</button>
                    <span className={styles.subtitle}>표지 1장 + 본문 A4 세로, 좌·우 2건</span>
                    {fetching ? (
                        <span className={styles.subtitle} aria-live="polite">
                            &nbsp;로딩 중...
                        </span>
                    ) : null}
                    {error ? (
                        <span className={styles.subtitle} style={{color: "#dc2626"}}>
                            &nbsp;{error}
                        </span>
                    ): null}
                </div>

                <div className={styles.print}>
                    {/* 표지 */}
                    <CoverPage ym={month} />
                    {/* 본문 */}
                    {pairs.length === 0 ? (
                        <section className={styles.page}>
                            <div className={styles.cover}>
                                <div>
                                    <h1>월별 결산</h1>
                                    <div className={styles.m}>{month.replace("-", "년 ")}월</div>
                                    <p className={styles.subtitle}>해당 월 데이터가 없습니다.</p>
                                </div>
                            </div>
                        </section>
                    ) : (
                        pairs.map((pair, i) => (
                            <ContentPage key={`pg-${i}`} pair={pair} startIndex={i*2} />
                        ))
                    )}
                </div>
                </div>
            </main>
            </div>
    );
}

export default MonthPage;
