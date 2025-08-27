import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Link } from "react-router-dom";
import "./approvalSkeleton.css";

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
}
const toSrc = (raw) => {
    if (!raw) return null;
    const t = String(raw).trim();
    if (t.startsWith("data:")) return t;
    const b = t.replace(/\s+/g, "");
    return `data:${detectMine(b)};base64,${b}`;
}

function ApprovalSkeleton(){

    useEffect(() => {
        const prev = document.body.dataset.page;
        document.body.dataset.page = "skeleton";   // 이 페이지 전용 표시
        return () => { document.body.dataset.page = prev || ""; }; // 떠날 때 복구
    }, []);

    /* 공간만 확보: 빈 컨테이너만 선언 */
    const [api, setApi] = useState({ status: 200, message: null, result: [] });

    const [query, setQuery] = useState("");
    const [showSkeleton, setShowSkeleton] = useState(true);
    const [drawerData, setDrawerData] = useState(null);
    const qRef = useRef(null);

    /* 결과테이블 랜더 행으로 변환 */
    const rows = useMemo(() => {
        const built = (api.result || []).map((x) => ({
            approversText: (x.approvers || []).map((a) => a.name).join(", "),
            data: x,
        }));
        if(!query.trim()) return built;
        const q = query.trim().toLowerCase();
        return built.filter(({ data, approversText }) => {
            const r = data.approvalRequests || {};
            return [approversText, r.memberName, r.title, r.approvalCode].join(" ").toLowerCase().includes(q);
        });
    }, [api, query]);

    /* 보기 스켈레톤 */
    const handleShowSkeleton = useCallback(() => {
        setShowSkeleton(true);
        /* 비어있는 걸로 보여줄거면 주석 해제하면됨 */
        /* setApi({ status: 200, message: null, result: [] }); */
    }, []);

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

    /* 외부에서 인젝을.... 어째서... */
    /* 데이터 주입 가능하도록 공개 */
    useEffect(() => {
        window.injectApprovalData = (payload) => {
            try {
                const next = payload && payload.result ? payload : { status: 200, message: null, result: Array.isArray(payload) ? payload : [] };
                setApi(next);
                setShowSkeleton(false);
            } catch (e) {
                console.error("인젝 실패:", e);
            }
        };
        /* 포커스 UX */
        if (qRef.current) qRef.current.focus();
    }, []);

    /* 테이블 행 클릭하면 드로어 오픈 */
    const openDrawer = useCallback((item) => setDrawerData(item), []);
    const closeDrawer = useCallback(() => setDrawerData(null), []);

    return (
        <div className="wrap">
            {/* 사이드바 */}
            <aside className="sidebar">
                <div className="brand">컴퓨터공학부 종합관리시스템</div>
                <div className="section-title">메뉴</div>
                <nav className="nav">
                    <Link to="/userpg">마이페이지</Link>
                    <Link to="/">문서 게시판</Link>
                    <Link to="/">이벤트 게시판</Link>
                    <Link to="/approval_req">결재 신청</Link>
                    <Link to="/approval_approved">결재</Link>
                    <Link to="/approval_skeleton" className="active">결재-스켈레톤</Link>
                    <Link to="/monthly_page">월별 결산</Link>
                    <Link to="/">설정</Link>
                    <Link to="/permission">권한변경</Link>
                </nav>
            </aside>

            {/* 메인 */}
            <main className="main">
                <header className="header">
                <div>로그인: <b>조승훈</b></div>
                <div style={{display: "flex", gap: 8 }}>
                    <button className="btn" onClick={handleShowSkeleton}>스켈레톤 보기</button>
                    <button className="btn" onClick={Demo}>작은 샘플 주입</button>
                    <button className="logout">로그아웃</button>
                </div>
                </header>

                <div className="content">
                    {/* 투울바 */}
                    <div className="toolbar">
                        <input ref={qRef} className="input" placeholder="검색(신청자/건명/코드)" value={query} onChange={(e) => setQuery(e.target.value)} />
                        <span className="subtitle">데이터는 추후 주입됩니다. window.injectApprovalData(json)을 호출하세요.</span>
                    </div>

                    {/* 카드와 테이블 */}
                    <section className="card">
                        <table>
                        <thead>
                            <tr>
                            <th style={{width: 160}}>결재자</th>
                            <th style={{width: 120}}>신청자</th>
                            <th style={{width: 160}}>요청일</th>
                            <th>건명</th>
                            <th style={{width: 140}}>코드</th>
                            <th style={{width: 120}}>완료여부</th>
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

            {/* 드로어 */}
            <div className={`drawer ${drawerData ? "show" : ""}`} aria-hidden={drawerData ? "false" : "true"}>
            <div className="shade" onClick={closeDrawer}></div>
            <div className="panel" role="dialog" aria-modal="true">
                <header>
                <strong>결재 상세</strong>
                <button className="close" onClick={closeDrawer}>닫기</button>
                </header>
                <div className="body" id="detail">
                    {drawerData ? (
                        <>
                        <DetailGrid data={drawerData} />
                        <Receipt data = {drawerData} />
                        </>
                    ): null}
                </div>
            </div>
            </div>
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

export default ApprovalSkeleton;