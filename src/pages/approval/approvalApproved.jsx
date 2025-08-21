import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, fetchWithAuth, doLogout } from "../../utils/auth";
import "./approvalPage.css";

/* 퍼킹 유틸함수 */
const fmt = (dt) => {
    const d = new Date(dt);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const money = (n) => Number(n || 0).toLocaleString("ko-KR");
const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const detectMine = (b64) => {
    const s = (b64 || "").slice(0, 16);
    if (s.startsWith("/9j")) return "image/jpeg";
    if (s.startsWith("iVBOR")) return "image/png";
    if (s.startsWith("R0lGOD")) return "image/gif";
    return "image/*";
};
const toSrc = (raw) => {
    if (!raw) return null;
    const t = String(raw).trim();
    if (t.startsWith("data:")) return t;
    const b = t.replace(/\s+/g, "");
    return `data:${detectMine(b)};base64,${b}`;
};

function ApprovalApproved(){
    const navigate = useNavigate();

    /* 로그인 유저 정보 */
    const [currentUser, setCurrentUer] = useState(null);

    /* 리스트 상태 */
    const [api, setApi] = useState({ status: 200, message: null, result: [] });
    const [query, setQuery] = useState("");
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [drawerData, setDrawerData] = useState(null);
    const [toast, setToast] = useState({show: false, msg: "", danger: false});
    const qRef = useRef(null);

    /* 유저정보 로드 */
    useEffect(() => {
        (async () => {
            try{
                const i = await loadUserInfo();
                setCurrentUer(i);
            } catch (e) {
                console.error(e);
                /* navigate("/"); */
            }
        })();
    }, [navigate]);

    const showToast = useCallback((msg, danger=false) => {
        setToast({show:true, msg, danger});
        setTimeout(() => setToast({show:false, masg:"", danger: false}), 1600);
    }, []);

    /* 데이터 주입 가능하도록 공개 */
    useEffect(() => {
        window.injectApprovalData = (payload) => {
            try {
                const next = payload && payload.result ? payload : { status: 200, message: null, result: Array.isArray(payload) ? payload : [] };
                setApi(next);
                setShowSkeleton(false);
            } catch  {
                console.error("인젝 실패:", true);
            }
        };
        /* 포커스 UX */
        qRef.current?.focus();
    }, [showToast]);

    /* 결과테이블 랜더 행으로 변환 */
    const rows = useMemo(() => {
        const built = (api.result || []).map((x) => ({
            approversText: (x.approvers || []).map((a) => a.name).join(", "),
            data: x,
        }));
        const q = query.trim().toLowerCase();
        if(!q) return built;
        return built.filter(({ data, approversText }) => {
            const r = data.approvalRequests || {};
            return [approversText, r.memberName, r.title, r.approvalCode].join(" ").toLowerCase().includes(q);
        });
    }, [api, query]);

    const renderPlaceholder = useCallback(() => setShowSkeleton(true), []);
    /* 테이블 행 클릭하면 드로어 오픈 */
    const openDrawer = useCallback((item) => setDrawerData(item), []);
    const closeDrawer = useCallback(() => setDrawerData(null), []);

    /* 로그아웃 */
    const onLogout = useCallback(async () => {
        await doLogout();
        navigate("/");
    }, [navigate]);

    const approveCurrent = useCallback(async () => {
        if(!drawerData || !currentUser){
            showToast("로그인 하세요", true);
            return;
        }
        const r = drawerData.approvalRequests || {};
        if(r.isCompleted) return;

        const canApprove = (drawerData.approvers || []).some(
            (a) => a.name === currentUser.name || a.studentId === currentUser.studentId
        );
        if (!canApprove){
            showToast("결재 대상자가 아님", true);
            return;
        }

        try {
            /* 나중에 API 맞춰서 변경 */
            const res = await fetchWithAuth(`대충 링크`, {
                method: "POST",
                body: JSON.stringify({requestId: r.requestId})
            });
            if(!res.ok) throw new Error("승인 실패");

            /* 로컬 상태 갱신 */
            setApi((prev) => {
                const next = {...prev, result: [...(prev.result || [])] };
                const idx = next.result.findIndex((x) => (x.approvalRequests || {}).requestId === r.requestId);
                if (idx >= 0){
                    const item = {...next.result[idx]};
                    const req = {...(item.approvalRequests || {}) };
                    req.isCompleted = true;
                    req.approvalDate = new Date().toISOString();
                    item.approvalRequests = req;
                    next.result[idx] = item;
                }
                return next;
            });
            setDrawerData((prev) => prev ? {...prev, approvalRequests: {...prev.approvalRequests, isCompleted: true, approvalDate: new Date().toISOString() } } : prev);
            showToast("결재완료");
        } catch (e) {
            console.error(e);
            showToast("오류 발생. 다시 하셈", true);
        }
    }, [drawerData, currentUser, showToast]);

    /* 뻐킹 샘플 */
    const Demo = useCallback(() => {
        const sex = [{
            approvers: [{ id: 5, studentId: "2021136024", name: "김승환"}],
            approvalRequests: {
                requestId: 101,
                memberName: "김성제",
                requestDate: new Date().toISOString(),
                title: "졸업작품",
                requestedAmount: 1000,
                accountNumber: "111-222-333333",
                payerName: "Muhammad tariq mahmood",
                requestDetail: "데스노트",
                approvalCode: "230 업무추진비",
                isCompleted: false,
                approvalDate: null,
            },
        }];
        setApi({status: 200, message: null, result: sex});
        setShowSkeleton(false);
    }, []);

    const approveState = useMemo(() => {
        const r = drawerData?.approvalRequests || {};
        const canApprove = !!currentUser && (drawerData?.approvers || []).some(
            (a) => a.name === currentUser.name || a.studentId === currentUser.studentId
        );
        return {
            disabled: !canApprove || r.isCompleted === true,
            label: r.isCompleted === true ? "승인 완료" : "결재 승인",
            title: !canApprove ? "결재 대상이 아님." : "",
            badgeHtml: r.isCompleted === true ? '<span className="badge ok">완료</span>' : '<span className="badge no">미완료</span>',
        };
    }, [drawerData, currentUser]);

    return (
        <div className="wrap">
            <aside className="sidebar">
                <div className="brand">컴퓨터공학부 종합관리시스템</div>
                <div className="section-title">메뉴</div>
                <nav className="nav">
                <Link to="/userpg">마이페이지</Link>
                <Link to="/">문서 게시판</Link>
                <Link to="/">이벤트 게시판</Link>
                <Link to="/approval_req">결재 신청</Link>
                <Link to="/approval_approved" className="active">결재</Link>
                <Link to="/approval_skeleton">결재-스켈레톤</Link>
                <Link to="/monthly_page">월별 결산</Link>
                <Link to="/">설정</Link>
                <Link to="/permission">권한변경</Link>
                </nav>
            </aside>

            <main className="main">
                <header className="header">
                <div>로그인: <b>{currentUser?.name ?? "-"}</b></div>
                <div style={{display: "flex", gap:8}}>
                    <button className="btn" onClick={renderPlaceholder}>스켈레톤 보기</button>
                    <button className="btn" onClick={Demo}>샘플 주입</button>
                    <button className="logout" onClick={onLogout}>로그아웃</button>
                </div>
                </header>

                <div className="content">
                <div className="toolbar">
                    <input ref={qRef} className="input" placeholder="검색(신청자/건명/코드)" value={query} onChange={(e) => setQuery(e.target.value)}/>
                    <span className="subtitle">행을 클릭하면 상세에서 결재 승인할 수 있습니다.</span>
                </div>

                <section className="card">
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
                            /* 스켈레톤 */
                            Array.from({length: 5}).map((_, i) => (
                                <tr key={`sk-${i}`} className="ghost">
                                    <td><div className="skeleton sk-text sk-mid" /></td>
                                    <td><div className="skeleton sk-text sk-narrow" /></td>
                                    <td><div className="skeleton sk-text sk-mid" /></td>
                                    <td><div className="skeleton sk-text sk-wide" /></td>
                                    <td><div className="skeleton sk-text sk-mid" /></td>
                                    <td><div className="skeleton sk-text sk-narrow" /></td>
                                </tr>
                            ))
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="muted" style ={{textAlign: "center", padding: "16px"}}>
                                    데이터가 없음
                                </td>
                            </tr>
                        ):(
                            rows.map((row, idx) => {
                                const r = row.data.approvalRequests || {};
                                const done = r.isCompleted === true;
                                return (
                                    <tr key={r.requestId ?? idx} onClick={() => openDrawer(row.data)} style = {{ cursor: "pointer"}}>
                                        <td className="muted">{escapeHtml(row.approversText || "-")}</td>
                                        <td>{escapeHtml(r.memberName || "-")}</td>
                                        <td className="muted">{r.requestDate ? fmt(r.requestDate) : "-"}</td>
                                        <td>{escapeHtml(r.title || "-")}</td>
                                        <td className="muted">{escapeHtml(r.approvalCode || "-")}</td>
                                        <td>
                                            <span className={`badge ${done ? "ok" : "no"}`}>{done ? "완료":"미완료"}</span>
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

            {/* <!-- detail drawer --> */}
            <div className={`drawer ${drawerData ? "show" : ""}`} aria-hidden={drawerData ? "false" : "true"}>
            <div className="shade" onClick={closeDrawer}></div>
            <div className="panel" role="dialog" aria-modal="true">
                <header>
                <div className="head-left">
                    <strong>결재 상세</strong>
                    <span id="statusBadge" dangerouslySetInnerHTML={{__html: approveState.badgeHtml}}></span>
                </div>
                <div class="head-right">
                    <button id="approveBtn" className="btn btn-approve" onClick={approveCurrent} disabled={approveState.disabled} title={approveState.title}>{approveState.label}</button>
                    <button className="btn" onClick={closeDrawer}>닫기</button>
                </div>
                </header>
                <div className="body" id="detail">
                    {drawerData && (
                        <>
                        <DetailGrid data={drawerData} />
                        <Receipt data = {drawerData} />
                        </>
                    )}
                </div>
            </div>
            </div>

            <div id="toast" className={`toast ${toast.show ? "show" : ""}`} role="status" aria-live="polite" style={{background: toast.danger ? "#dc2626" : undefined}}>{toast.msg}</div>
            </div>
    );
}

/* 상세그리드 */
function DetailGrid({data}){
    const r = data.approvalRequests || {};
    const approversText = (data.approvers || []).map((a) => `${escapeHtml(a.name)} (${escapeHtml(a.studentId)})`).join(", ");

    return (
        <div className="grid">
            <div className="k">결재자</div><div dangerouslySetInnerHTML={{__html: approversText || "-"}} />
            <div className="k">신청자</div><div>{escapeHtml(r.memberName || "-")}</div>
            <div className="k">요청일</div><div>{r.requestDate ? fmt(r.requestDate) : "-"}</div>
            <div className="k">건명</div><div>{escapeHtml(r.title || "-")}</div>
            <div className="k">예산코드</div><div>{escapeHtml(r.approvalCode || "-")}</div>
            <div className="k">금액</div><div>{money(r.requestedAmount)} 원</div>
            <div className="k">계좌번호</div><div>{escapeHtml(r.accountNumber || "-")}</div>
            <div className="k">예금주</div><div>{escapeHtml(r.payerName || "-")}</div>
            <div className="k">내역</div><div>{escapeHtml(r.requestDetail || "-")}</div>
            <div className="k">완료여부</div>
            <div>
                {r.isCompleted === true ? <span className="badge ok">완료</span> : <span className="badge no" >미완료</span>}
            </div>
        </div>
    );
}

/* 영수증 이미지 */
function Receipt({data}) {
    const r = data.approvalRequests || {};
    const imgSrc = toSrc(r.receiptFile || data.byteFile);
    return (
        <div className="imgbox">
            {imgSrc ? <img alt="receipt" src={imgSrc} /> : <div className="muted">영수증 이미지 없음</div>}
        </div>
    );
}

export default ApprovalApproved;