import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, fetchWithAuth, doLogout } from "../../utils/auth";
import styles from "./approvalPage.module.css";

const API_BASE = "https://back.kutcse.com/api";

/* ====== 유틸 ====== */
const fmt = (dt) => new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit"
}).format(new Date(dt));
const money = (n) => Number(n || 0).toLocaleString("ko-KR");
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g,
  (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));

/** result 처리 함수 수정 */
const parseResultJSON = async (res, errMsg = "API 호출 실패") => {
  if (!res.ok) {
    const t = await res.text().catch(()=> "");
    throw new Error(t || errMsg);
  }
  const body = await res.json().catch(()=> ({}));

  const raw = Object.prototype.hasOwnProperty.call(body, "result") ? body.result : body;

  if (raw == null){
    throw new Error("서버 result가 비어 있음.");
  }

  if (typeof raw === "string"){
    try {
        return JSON.parse(raw);
    } catch {
        throw new Error("서버 result JSON 파싱 실패");
    }
  }

  if (typeof raw === "object"){
    return raw;
  }

  throw new Error("지원하지 않는 result 타입");
};

const detectMime = (b64) => {
  const s = (b64 || "").slice(0, 16);
  if (s.startsWith("/9j")) return "image/jpeg";
  if (s.startsWith("iVBOR")) return "image/png";
  if (s.startsWith("R0lGOD")) return "image/gif";
  if (s.startsWith("UklGR")) return "image/webp";
  return "image/*";
};
const toSrc = (raw) => {
  if (!raw) return null;
  const t = String(raw).trim();
  if (t.startsWith("data:")) return t;
  const b = t.replace(/\s+/g, "");
  return `data:${detectMime(b)};base64,${b}`;
};


function ApprovalApproved(){
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);

  const [api, setApi] = useState({ status: 200, message: null, result: [] });
  const [query, setQuery] = useState("");
  const [showSkeleton, setShowSkeleton] = useState(true);

  /* 드로어/토스트 */
  const [drawerData, setDrawerData] = useState(null); /* post 단위 */
  const [toast, setToast] = useState({show: false, msg: "", danger: false});
  const qRef = useRef(null);

  /* 유저정보 로드 */
  useEffect(() => {
    (async () => {
      try{
        const i = await loadUserInfo();
        setCurrentUser(i);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const showToast = useCallback((msg, danger=false) => {
    setToast({show:true, msg, danger});
    setTimeout(() => setToast({show:false, msg:"", danger:false}), 1600);
  }, []);

  /* 외부 데이터 인젝(테스트용) */
  useEffect(() => {
    window.injectApprovalData = (payload) => {
      try {
        const next = payload && payload.result ? payload : { status: 200, message: null, result: Array.isArray(payload) ? payload : [] };
        setApi(next);
        setShowSkeleton(false);
      } catch  {
        console.error("인젝 실패");
      }
    };
    qRef.current?.focus();
    return () => { delete window.injectApprovalData; };
  }, []);

  /* 목록 로드: getAllRequest + getAcceptPost(내 결재 가능 글) */
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setShowSkeleton(true);
        const [allRes, canRes] = await Promise.all([
          fetchWithAuth(`${API_BASE}/approval/getAllRequest`),
          fetchWithAuth(`${API_BASE}/approval/getAcceptPost`)
        ]);

        const [allList, canList] = await Promise.all([
          parseResultJSON(allRes, "목록 불러오기 실패"),
          parseResultJSON(canRes, "결재권한 목록 불러오기 실패"),
        ]);

        // 내가 결재 가능한 postId Set (배열 원소가 숫자 또는 {postId}일 수 있으니 모두 수용)
        const canIds = new Set(
          (Array.isArray(canList) ? canList : []).map(x =>
            (typeof x === "object" ? (x.postId ?? x.id ?? x.requestId) : x)
          )
        );

        const normalized = (Array.isArray(allList) ? allList : [])
          .map(it => {

            const ar = it.approvalRequests ?? {};
            const postId = ar.requestId ?? it.postId ?? it.id;

            return{
            postId,
            title: ar.title,
            approvalCode: ar.approvalCode,
            requestDate: ar.requestDate ?? ar.createdAt ?? null,
            isCompleted: !!ar.isCompleted,
            memberName: ar.memberName,
            requestDetails: ar.requestDetail ?? ar.requestDetails,
            requestAmount: ar.requestedAmount ?? ar.requestAmount,
            accountNumber: ar.accountNumber,
            payerName: ar.payerName,
            receiptFile: it.byteFile ?? ar.receiptFile ?? "",
            approvers: Array.isArray(it.approvers) ? it.approvers.map(a => ({
              memberId: a.memberId ?? a.id, name: a.name, studentId: a.studentId
            })) : [],
            canApprove: canIds.has(postId)
          }});

        if (!aborted) setApi({ status: 200, message: null, result: normalized });
      } catch (e) {
        console.error(e);
        showToast(e.message || "목록을 불러오지 못했습니다.", true);
      } finally {
        if (!aborted) setShowSkeleton(false);
      }
    })();
    return () => { aborted = true; };
  }, [showToast]);

  /* 검색 rows */
  const rows = useMemo(() => {
    const built = (api.result || []).map((x) => ({
      approversText: (x.approvers || []).map((a) => a.name).join(", "),
      data: x,
    }));
    const q = query.trim().toLowerCase();
    if(!q) return built;
    return built.filter(({ data, approversText }) => {
      return [approversText, data.memberName, data.title, data.approvalCode]
        .join(" ").toLowerCase().includes(q);
    });
  }, [api, query]);

  /* 드로어 */
  const openDrawer = useCallback((item) => setDrawerData(item), []);
  const closeDrawer = useCallback(() => setDrawerData(null), []);

  /* 로그아웃 */
  const onLogout = useCallback(async () => {
    await doLogout();
    navigate("/");
  }, [navigate]);

  /* 승인 */
  const approvingRef = useRef(false);
  const approveCurrent = useCallback(async () => {
    const d = drawerData;
    if (!d || !currentUser){
      showToast("로그인 하세요", true);
      return;
    }
    if (d.isCompleted) return;

    // 프론트 가드(최종 권한은 서버 검증)
    const canApprove = d.canApprove || (d.approvers || []).some(
      (a) => a.name === currentUser.name || a.studentId === currentUser.studentId || a.memberId === currentUser.memberId
    );
    if (!canApprove){
      showToast("결재 대상자가 아님", true);
      return;
    }

    if (approvingRef.current) return; // 중복 클릭 방지
    approvingRef.current = true;

    const prevApi = api;
    try {
      // 낙관적 업데이트
      setApi((prev) => {
        const next = { ...prev, result: [...(prev.result || [])] };
        const i = next.result.findIndex(x => x.postId === d.postId);
        if (i >= 0) next.result[i] = { ...next.result[i], isCompleted: true };
        return next;
      });
      setDrawerData((prev) => prev ? { ...prev, isCompleted: true } : prev);

      const res = await fetchWithAuth(`${API_BASE}/approval/postAccept`, {
        method: "POST",
        body: JSON.stringify({ postId: d.postId, approved: true })
      });
      if (!res.ok) {
        // 롤백
        setApi(prevApi);
        const msg = await res.text().catch(()=> "승인 실패");
        throw new Error(msg || "승인 실패");
      }

      showToast("결재완료");
    } catch (e) {
      console.error(e);
      showToast(e.message || "오류 발생. 다시 시도해 주세요.", true);
    } finally {
      approvingRef.current = false;
    }
  }, [api, drawerData, currentUser, showToast]);

  /* 승인 버튼 상태 */
  const approveState = useMemo(() => {
    const d = drawerData || {};
    const disabled = !currentUser || d.isCompleted === true ||
      !((d.canApprove) || (d.approvers||[]).some(a =>
        a.name === currentUser?.name || a.studentId === currentUser?.studentId || a.memberId === currentUser?.memberId
      ));
    return {
      disabled,
      label: d.isCompleted === true ? "승인 완료" : "결재 승인"
    };
  }, [drawerData, currentUser]);

  /* 삭제 */
  const onDelete = useCallback(async () => {
    const d = drawerData;
    if (!d) return;
    try {
      const res = await fetchWithAuth(`${API_BASE}/approval/deleteRequest/${encodeURIComponent(d.postId)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const t = await res.text().catch(()=> "삭제 실패");
        throw new Error(t || "삭제 실패");
      }
      setApi(prev => ({ ...prev, result: (prev.result || []).filter(x => x.postId !== d.postId) }));
      setDrawerData(null);
      showToast("삭제되었습니다.");
    } catch (e) {
      console.error(e);
      showToast(e.message || "삭제 중 오류가 발생했습니다.", true);
    }
  }, [drawerData, showToast]);

  return (
    <div className={styles.wrap}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
        <div className={styles.sectionTitle}>메뉴</div>
        <nav className={styles.nav}>
          <Link to="/userpg">마이페이지</Link>
          <Link to="/document_board">문서 게시판</Link>
          <Link to="/event_board">이벤트 게시판</Link>
          <Link to="/approval_req">결재 신청</Link>
          <Link to="/approval_approved" className={styles.active}>결재</Link>
          <Link to="/monthly_page">월별 결산</Link>
          <Link to="/">설정</Link>
          <Link to="/permission">권한변경</Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>로그인: <b>{currentUser?.name ?? "-"}</b></div>
          <div style={{display: "flex", gap:8}}>
            <button className={styles.logout} onClick={onLogout}>로그아웃</button>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.toolbar}>
            <input
              ref={qRef}
              className={styles.input}
              placeholder="검색(신청자/건명/코드)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className={styles.subtitle}>행을 클릭하면 상세에서 결재 승인/삭제할 수 있습니다.</span>
          </div>

          <section className={styles.card}>
            <table>
              <thead>
                <tr>
                  <th style={{width:160}}>결재자</th>
                  <th style={{width:120}}>신청자</th>
                  <th style={{width:160}}>요청일</th>
                  <th>건명</th>
                  <th style={{width:140}}>코드</th>
                  <th style={{width:120}}>완료여부</th>
                </tr>
              </thead>
              <tbody>
                {showSkeleton && rows.length === 0 ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={`sk-${i}`} className={styles.ghost}>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skMid}`} /></td>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skNarrow}`} /></td>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skMid}`} /></td>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skWide}`} /></td>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skMid}`} /></td>
                      <td><div className={`${styles.skeleton} ${styles.skText} ${styles.skNarrow}`} /></td>
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.muted} style ={{textAlign: "center", padding: "16px"}}>
                      데이터가 없음
                    </td>
                  </tr>
                ):(
                  rows.map((row, idx) => {
                    const d = row.data;
                    return (
                      <tr key={d.postId ?? idx} onClick={() => openDrawer(d)} style={{ cursor: "pointer"}}>
                        <td className={styles.muted}>{escapeHtml(row.approversText || "-")}</td>
                        <td>{escapeHtml(d.memberName || "-")}</td>
                        <td className={styles.muted}>{d.requestDate ? fmt(d.requestDate) : "-"}</td>
                        <td>
                          {d.canApprove && <span className={`${styles.badge} ${styles.info}`} style={{marginRight:6}}>내 결재</span>}
                          {escapeHtml(d.title || "-")}
                        </td>
                        <td className={styles.muted}>{escapeHtml(d.approvalCode || "-")}</td>
                        <td>
                          <span className={`${styles.badge} ${d.isCompleted ? styles.ok : styles.no}`}>{d.isCompleted ? "완료":"미완료"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>
        </div>
      </main>

      {/* detail drawer */}
      <div className={`${styles.drawer} ${drawerData ? styles.show : ""}`} aria-hidden={drawerData ? "false" : "true"}>
        <div className={styles.shade} onClick={closeDrawer}></div>
        <div className={styles.panel} role="dialog" aria-modal="true">
          <header>
            <div className={styles.headLeft}>
              <strong>결재 상세</strong>
              <span className={`${styles.badge} ${drawerData?.isCompleted ? styles.ok : styles.no}`} style={{marginLeft:8}}>
                {drawerData?.isCompleted ? "완료" : "미완료"}
              </span>
            </div>
            <div className={styles.headRight}>
              <button
                className={`${styles.btn} ${styles.btnApprove}`}
                onClick={approveCurrent}
                disabled={approveState.disabled}
                title={approveState.disabled ? "결재 대상이 아님 또는 이미 완료" : ""}
              >
                {approveState.label}
              </button>
              <button className={styles.btn} onClick={onDelete}>삭제</button>
              <button className={styles.btn} onClick={closeDrawer}>닫기</button>
            </div>
          </header>
          <div className={styles.body} id="detail">
            {drawerData && (
              <>
                <DetailGrid data={drawerData} />
                <Receipt data={drawerData} />
              </>
            )}
          </div>
        </div>
      </div>

      <div
        id="toast"
        className={`${styles.toast} ${toast.show ? styles.show : ""}`}
        role="status"
        aria-live="polite"
        style={{background: toast.danger ? "#dc2626" : undefined}}
      >
        {toast.msg}
      </div>
    </div>
  );
}

/* 상세 그리드 (백엔 필드명 사용) */
function DetailGrid({data}){
  const d = data || {};
  const approversText = (d.approvers || [])
    .map(a => `${escapeHtml(a.name)} (${escapeHtml(a.studentId ?? a.memberId ?? "-")})`)
    .join(", ");

  return (
    <div className={styles.grid}>
      <div className={styles.k}>결재자</div><div dangerouslySetInnerHTML={{__html: approversText || "-"}} />
      <div className={styles.k}>신청자</div><div>{escapeHtml(d.memberName || "-")}</div>
      <div className={styles.k}>요청일</div><div>{d.requestDate ? fmt(d.requestDate) : "-"}</div>
      <div className={styles.k}>건명</div><div>{escapeHtml(d.title || "-")}</div>
      <div className={styles.k}>예산코드</div><div>{escapeHtml(d.approvalCode || "-")}</div>
      <div className={styles.k}>금액</div><div>{money(d.requestAmount)} 원</div>
      <div className={styles.k}>계좌번호</div><div>{escapeHtml(d.accountNumber || "-")}</div>
      <div className={styles.k}>예금주</div><div>{escapeHtml(d.payerName || "-")}</div>
      <div className={styles.k}>내역</div><div>{escapeHtml(d.requestDetails || "-")}</div>
      <div className={styles.k}>완료여부</div>
      <div>
        {d.isCompleted ? <span className={`${styles.badge} ${styles.ok}`}>완료</span> : <span className={`${styles.badge} ${styles.no}`}>미완료</span>}
      </div>
    </div>
  );
}

/* 영수증 */
function Receipt({data}) {
  const imgSrc = toSrc(data?.receiptFile);
  return (
    <div className={styles.imgbox}>
      {imgSrc ? (
        <>
          <img alt="receipt" src={imgSrc} />
          <a className={`{styles.link} ${styles.dlLink}`} href={imgSrc} download={`receipt_${data?.postId}.jpg`}>다운로드</a>
            <svg className={styles.dlIcon} viewBox="0 0 24 24" aria-hidden="true">
                <path
                d="M12 3v10m0 0l4-4m-4 4l-4-4M5 21h14a2 2 0 002-2v-3M3 16v3a2 2 0 002 2"
                fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round"
                />
            </svg>
        </>
      ) : <div className={styles.muted}>영수증 이미지 없음</div>}
    </div>
  );
}

export default ApprovalApproved;