import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, /* fetchWithAuth, */ doLogout } from "../../utils/auth";
import "./approvalRequest.css";

/* 유틸 */
const fmtDateYYYYMMDD = (v) => {
    if(!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d)) return null;
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

/* 샘플 */
const ORG_API = {
    status: 200,
    message: "department tree",
    result: {
        nodes: [
            {
                nodes: [],
                children: [
                    { memberId:11, name: "홍보부원1account", departmentName: "홍보", roleName: "Member", roleCode: 202},
                ],
                leaf: { memberId:10, name: "홍보부장account", departmentName: "홍보", roleName: "Manager", roleCode: 201},
            },
            {
                nodes: [],
                children: [
                    { memberId:8, name: "총무부원1account", departmentName: "총무", roleName: "Member", roleCode: 202},
                    { memberId:9, name: "총무부원2account", departmentName: "총무", roleName: "Member", roleCode: 202},
                ],
                leaf: { memberId:7, name: "총무부장account", departmentName: "총무", roleName: "Manager", roleCode: 201},
            },
        ],
        children: [{ memberId:6, name: "부회장account", departmentName: "부회장", roleName: "Presidency", roleCode: 200}],
        leaf: { memberId:5, name: "회장account", departmentName: "회장", roleName: "Presidency", roleCode: 200},
    },
};

function ApprovalRequestPage(){
    const navigate = useNavigate();

    /* 로그인 화긴 */
    const [user, setUser] = useState(null);

    /* 폼 */
    const [title, setTitle] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [requestDate, setRequestDate] = useState(() => fmtDateYYYYMMDD(new Date()));
    const [requestDetail, setRequestDetail] = useState("");
    const [requestedAmount, setRequestedAmount] = useState("");
    const [approvalCode, setApprovalCode] = useState("");
    const [payerName, setPayerName] = useState("");

    /* 승인자 */
    const [selected, setSelected] = useState(() => new Map());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [orgFilter, setOrgFilter] = useState("");
    const [org] = useState(() => ORG_API.result);

    /* 부서 노드 펼침 상태 > 모든 노드 on/off */
    const [expandAll, setExpandAll] = useState(true);

    const orgSearchRef = useRef(null);
    const q = orgFilter.trim().toLowerCase();

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

    /* 선택된 승인자 ID */
    const approverIds = useMemo(() => Array.from(selected.keys()), [selected]);

    /* 미리보기 페이로드 */
    const preview = useMemo(() => {
        return {
            title: title.trim(),
            accountNumber: accountNumber.trim(),
            requestDate: fmtDateYYYYMMDD(requestDate),
            requestDetail: requestDetail.trim(),
            requestedAmount: Number(requestedAmount || 0),
            approvalCode,
            payerName: payerName.trim(),
            approverIds,
        };
    }, [title, accountNumber, requestDate, requestDetail, requestedAmount, approvalCode, payerName, approverIds]);

    const onLogout = useCallback(async () => {
        await doLogout();
        navigate("/");
    }, [navigate]);

    /* 칩 렌더링 데이터 */
    const chips = useMemo(() => Array.from(selected.values()), [selected]);

    /* 조직도 필터링 */
    const matchFilter = useCallback(
        (person) => {
            if (!q) return true;
            const hay = [person.name, person.departmentName, person.roleName].join(" ").toLowerCase();
            return hay.includes(q);
        }, [q]
    );

    const openDrawer = useCallback(() => {
        setDrawerOpen(true);
        setTimeout(() => orgSearchRef.current?.focus(), 0);
    }, []);
    const closeDrawer = useCallback(() => setDrawerOpen(false), []);

    /* 승인자 추가 제거 초기화 함수 */
    const addPerson = useCallback((p) => {
        setSelected((prev) => {
            if(prev.has(p.memberId)) return prev;
            const next = new Map(prev);
            next.set(p.memberId, p);
            return next;
        });
    }, []);
    
    const removePerson = useCallback((id) => {
        setSelected((prev) => {
            if(!prev.has(id)) return prev;
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const clearPerson = useCallback(() => setSelected(new Map()), []);

    /* 제출 함수 */
    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if(approverIds.length === 0){
                alert("승인자를 1명 이상 선택해");
                openDrawer();
                return;
            }
            /* 실제 API 나오면 변경 */
            /* const res = await fetchWithAuth(`실제 주소`, { */
            /*     method: 'POST', */
            /*     body: JSON.stringify(preview) */
            /* }); */
            /* const json = await res.json(); */
            

            console.log("submit payloads:", preview);
            alert("전송 페이로드 콘솔에서 확인")
        },[approverIds.length, openDrawer, preview]
    );

    /* 부서/루트 렌더 유틸함수 */
    const PersonRow = ({p, emphLabel}) => {
        const already = selected.has(p.memberId);
        return (
            <div className="person">
                <div className="row">
                    {emphLabel ? <span className="pill">{emphLabel}</span> : null}
                    <strong style={{marginLeft: emphLabel ? 6 : 0}}>{p.name}</strong>
                    <span className="muted"> · {p.departmentName}/{p.roleName}</span>
                </div>
                <div className="row">
                    <button type="button" className="btn" disabled={already} onClick={() => addPerson(p)} aria-label={already ? "선택됨" : "추가"} title={already ? "이미 선택됨" : "추가"}>{already ? "선택됨" : "추가"}</button>
                </div>
            </div>
        );
    };

    return(
        <div className="wrap">
            <aside className="sidebar">
                <div className="brand">컴퓨터공학부 종합관리시스템</div>
                <div className="section-title">메뉴</div>
                <nav className="nav">
                <Link to="/userpg">마이페이지</Link>
                <Link to="/">문서 게시판</Link>
                <Link to="/">이벤트 게시판</Link>
                <Link to="/approval_req" className="active">결재 신청</Link>
                <Link to="/approval_approved">결재</Link>
                <Link to="/approval_skeleton">결재-스켈레톤</Link>
                <Link to="/monthly_page">월별 결산</Link>
                <Link to="/">설정</Link>
                <Link to="/permission">권한변경</Link>
                </nav>
            </aside>

            <main className="main">
                <header className="header">
                <div>로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b></div>
                <button className="logout" onClick={onLogout}>로그아웃</button>
                </header>

                <div className="content">
                <section className="card">
                    <header>결재 신청</header>
                    <div className="body">
                    <form className="grid" onSubmit={handleSubmit} onReset={() => setTimeout(() => setOrgFilter(""), 0)}>
                        <label className="label" htmlFor="title">제목</label>
                        <input id="title" className="input" placeholder="예: 6월 홍보물 구입" required value={title} onChange={(e) => setTitle(e.target.value)}/>

                        <label className="label" htmlFor="accountNumber">계좌번호</label>
                        <input id="accountNumber" className="input" placeholder="숫자만 입력" inputMode="numeric" pattern="[0-9\- ]{4,}" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}/>

                        <label className="label" htmlFor="requestDate">신청 날짜</label>
                        <input id="requestDate" className="input" type="date" required value={requestDate ?? ""} onChange={(e)=>setRequestDate(e.target.value)}/>

                        <label className="label" htmlFor="requestDetail">신청 내용</label>
                        <textarea id="requestDetail" className="textarea" placeholder="사용 내역을 자세히 입력하세요" required value={requestDetail} onChange={(e)=>setRequestDetail(e.target.value)}></textarea>

                        <label className="label" htmlFor="requestedAmount">신청 금액</label>
                        <div className="row">
                        <input id="requestedAmount" className="input" type="number" min="0" step="1" placeholder="예: 150000" required value={requestedAmount} onChange={(e)=>setRequestedAmount(e.target.value)}/>
                        <span className="muted">원</span>
                        </div>

                        <label className="label" htmlFor="approvalCode">코드</label>
                        <select id="approvalCode" className="select" required value={approvalCode} onChange={(e)=>setApprovalCode(e.target.value)}>
                        <option value="" disabled>선택하세요</option>
                        <option value="210 사무용품비">210 사무용품비</option>
                        <option value="220 출장비">220 출장비</option>
                        <option value="230 업무추진비">230 업무추진비</option>
                        <option value="240 부서별활동비">240 부서별활동비</option>
                        <option value="310 정기사업비">310 정기사업비</option>
                        <option value="320 공약사업비">320 공약사업비</option>
                        <option value="330 대규모사업비">330 대규모사업비</option>
                        <option value="510 활동지원비">510 활동지원비</option>
                        <option value="530 학생지원비">530 학생지원비</option>
                        <option value="610 환불금">610 환불금</option>
                        <option value="620 비상금">620 비상금</option>
                        <option value="710 수수료">710 수수료</option>
                        </select>

                        <label className="label" htmlFor="payerName">입금자명</label>
                        <input id="payerName" className="input" placeholder="예: 김OO / 동아리명" required value={payerName} onChange={(e)=>setPayerName(e.target.value)}/>

                        <div className="label">승인자 선택</div>
                        <div className="row">
                            {/* 내부 전송용 hidden 필요없으면 주석하면됨 아래 한줄 */}
                        <input type="hidden" value={JSON.stringify(approverIds)}/>
                        <div id="chips" className="chips">
                            {chips.length === 0 ? (
                                <span className="badge">선택된 승인자 없음</span>
                            ) : chips.map((p) => (
                                <span className="chip" key={p.memberId}>
                                    <b>{p.name}</b>
                                    <span className="muted">· {p.departmentName}/{p.roleName}</span>
                                    <button type="button" className="rm" aria-label="제거" onClick={() => removePerson(p.memberId)}>x</button>
                                </span>
                            ))}
                        </div>
                        </div>
                        <div className="label sr-only">조직도</div>
                        <div className="row">
                        <button type="button" className="btn" onClick={openDrawer}>조직도에서 선택</button>
                        <button type="button" className="btn ghost" onClick={clearPerson}>전체 해제</button>
                        <span className="hint">선택된 사람은 아래 칩에서 제거할 수 있습니다. (ID는 화면에 노출되지 않음)</span>
                        </div>

                        <div className="label sr-only">제출</div>
                        <div className="row">
                        <button className="btn primary" type="submit">신청서 제출</button>
                        <button className="btn ghost" type="reset" onClick={()=>{
                            setTitle(""); setAccountNumber(""); setRequestDetail("");
                            setRequestedAmount(""); setApprovalCode(""); setPayerName("");
                            setSelected(new Map()); setRequestDate(fmtDateYYYYMMDD(new Date()));
                        }}>초기화</button>
                        </div>
                    </form>

                    <div>
                        <div className="muted">요청 미리보기(전송 페이로드)</div>
                        <pre className="preview">{JSON.stringify(preview, null, 2)}</pre>
                    </div>
                    </div>
                </section>
                </div>
            </main>

            {/* <!-- 조직도 선택 Drawer --> */}
            <div className={`drawer ${drawerOpen ? "show" : ""}`} aria-hidden={drawerOpen ? "false" : "true"}>
            <div className="shade" onClick={closeDrawer}></div>
            <div className="panel" role="dialog" aria-modal="true">
                <header>
                <strong>조직도에서 승인자 선택</strong>
                <div className="row">
                    <button className="btn" type="button" onClick={closeDrawer}>선택 완료</button>
                    <button className="close" onClick={closeDrawer}>닫기</button>
                </div>
                </header>
                <div className="body">
                <div className="org-search">
                    <input ref={orgSearchRef} className="input" placeholder="이름/부서/직책 검색" value={orgFilter} onChange={(e)=>setOrgFilter(e.target.value)} />
                    <button className="btn" type="button" onClick={() => setExpandAll(true)}>모두 펼치기</button>
                    <button className="btn" type="button" onClick={() => setExpandAll(false)}>모두 접기</button>
                </div>
                <div id="org" className="org" aria-live="polite">
                    {/* 루트 리더 */}
                    {org?.leaf && matchFilter(org.leaf) && (
                        <PersonRow p={org.leaf} emphLabel="루트" />
                    )}

                    {/* 루트 싱글 역할 */}
                    {Array.isArray(org?.children) && org.children.length > 0 && (
                        <Node title="본부(직책)" defaultOpen={expandAll}>
                            {org.children.filter(matchFilter).map((p) => (<PersonRow key={`rootc-${p.memberId}`} p={p} />
                        ))}
                        </Node>
                    )}

                    {/* 부서 */}
              {Array.isArray(org?.nodes) &&
                org.nodes.map((nd, i) => {
                  const deptName = (nd.leaf && nd.leaf.departmentName) || "부서";
                  const items = [
                    ...(nd.leaf && matchFilter(nd.leaf) ? [{ ...nd.leaf, __label: "부서장" }] : []),
                    ...((Array.isArray(nd.children) ? nd.children : []).filter(matchFilter)),
                  ];
                  if (items.length === 0) return null;
                  return (
                    <Node key={`dept-${i}`} title={deptName} rightLabel={nd.leaf?.roleName} defaultOpen={expandAll}>
                      {items.map((p) =>
                        p.__label ? (
                          <PersonRow key={`mgr-${p.memberId}`} p={p} emphLabel={p.__label} />
                        ) : (
                          <PersonRow key={`mem-${p.memberId}`} p={p} />
                        )
                      )}
                    </Node>
                  );
                })}
            </div>
        </div>
        </div>
        </div>
        </div>
    );
}

function Node({ title, rightLabel, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { setOpen(defaultOpen); }, [defaultOpen]);
  return (
    <div className="node">
      <header onClick={() => setOpen((v) => !v)} style={{ cursor: "pointer" }}>
        <div className="row">
          <span className="toggle">{open ? "▾" : "▸"}</span>
          <strong>{title}</strong>
        </div>
        <div className="row">{rightLabel ? <span className="pill">{rightLabel}</span> : null}</div>
      </header>
      <div className="children" style={{ display: open ? "" : "none" }}>{children}</div>
    </div>
  );
}
export default ApprovalRequestPage;