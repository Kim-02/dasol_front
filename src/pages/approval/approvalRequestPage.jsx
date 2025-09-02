import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, fetchWithAuth, doLogout } from "../../utils/auth";
import styles from "./approvalRequest.module.css";

const API_BASE = "http://3.34.245.155/api";

/* 유틸 */
const fmtDateYYYYMMDD = (v) => {
    if(!v) return null;
    const d = new Date(v);
    if (Number.isNaN(d)) return null;
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const roleNameFromCode = (code) => {
  switch (Number(code)) {
    case 200: return "Presidency";
    case 201: return "Manager";
    case 202: return "Member";
    default:  return "User";
  }
};

const toLegacyOrg = (root) => {
    if (!root || typeof root !== "object") return null;

    const toPerson = (n) => ({
        memberId: n.id,
        name: n.name,
        departmentName: n.departmentName,
        roleCode: n.roleCode,
        roleName: roleNameFromCode(n.roleCode),
    });

    const legacy = {
        leaf: toPerson(root),
        children: [],
        nodes: [],
    };

        const kids = Array.isArray(root.children) ? root.children : [];

    kids.forEach((ch) => {
        if (Number(ch.roleCode) === 201) {
        // 부서장 노드
        legacy.nodes.push({
            leaf: toPerson(ch),
            children: (Array.isArray(ch.children) ? ch.children : []).map(toPerson),
            nodes: [],
        });
        } else {
        // 부회장(200) 등 기타 상위 직책
        legacy.children.push(toPerson(ch));
        }
    });

    return legacy;
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
    const [receiptFile, setReceiptFile] = useState(null);
    const receiptInputRef = useRef(null);

    /* 승인자 */
    const [selected, setSelected] = useState(() => new Map());
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [orgFilter, setOrgFilter] = useState("");

    /* 조직도 샘플 > api로 수정 */
    const [org, setOrg] = useState(null);

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

    useEffect(() => {
        let aborted = false;
        (async () => {
            try {
                const res = await fetchWithAuth(`${API_BASE}/department/tree`);
                if (!res.ok) {
                    const t = await res.text().catch(() => "");
                    throw new Error(t || "조직도 로드 실패");
                }
                const body = await res.json().catch(() => ({}));
                const treeRoot = body?.result;
                if (!treeRoot || typeof treeRoot !== "object") {
                    throw new Error("서버 result가 객체 형태가 아닙니다.");
                }
                const legacy = toLegacyOrg(treeRoot);
                if(!aborted) setOrg(legacy);
            } catch(e){
                console.error(e);
            }
        })();
        return () => {aborted = true;};
    }, []);

    /* 선택된 승인자 ID */
    const approverIds = useMemo(() => Array.from(selected.keys()), [selected]);

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

    const toLocalDateTime = (yyyyMmDd) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
        return `${yyyyMmDd}T00:00:00`;
    };

    /* 제출 함수 */
    const handleSubmit = useCallback(
        async (e) => {
            e.preventDefault();
            if(approverIds.length === 0){
                alert("승인자를 1명 이상 선택하세요");
                openDrawer();
                return;
            }
            if (!receiptFile) {
                alert("영수증 이미지를 첨부하세용");
                return;
            }
            try {
                const isoDate = toLocalDateTime(requestDate);

                const fd = new FormData();
                fd.append("accountNumber", accountNumber.trim());
                fd.append("receiptFile", receiptFile);
                fd.append("requestDate", isoDate);
                fd.append("requestDetails", requestDetail.trim());
                fd.append("requestAmount", String(Number(requestedAmount || 0)));
                fd.append("title", title.trim());
                fd.append("approvalCode", String(approvalCode));
                fd.append("studentId", String(user?.studentId ?? ""));
                fd.append("payerName", payerName.trim());

                approverIds.forEach((id) => fd.append("approversId", String(id)));

                const res = await fetchWithAuth(`${API_BASE}/approval/post`, {
                    method: "POST",
                    body: fd,
                });

                if(!res.ok){
                    const t = await res.text().catch(() => "");
                    throw new Error(t || "결재 신청 실패");
                }

                const json = await res.json().catch(() => ({}));
                console.log("결재 신청 결과", json);
                alert("결재 신청이 완료되었습니다.");
                navigate("/approval_approved");
            } catch(err){
                console.error(err);
                alert(err.message || "요청 중 오류가 발생했습니다.")
            }
        },[navigate, approverIds, receiptFile, accountNumber, requestDate, requestDetail, requestedAmount, title, approvalCode, user?.studentId, payerName, openDrawer]
    );

    /* 부서/루트 렌더 유틸함수 */
    const PersonRow = ({p, emphLabel}) => {
        const already = selected.has(p.memberId);
        return (
            <div className={styles.person}>
                <div className={styles.row}>
                    {emphLabel ? <span className={styles.pill}>{emphLabel}</span> : null}
                    <strong style={{marginLeft: emphLabel ? 6 : 0}}>{p.name}</strong>
                    <span className={styles.muted}> · {p.departmentName}/{p.roleName}</span>
                </div>
                <div className={styles.row}>
                    <button type="button" className={styles.btn} disabled={already} onClick={() => addPerson(p)} aria-label={already ? "선택됨" : "추가"} title={already ? "이미 선택됨" : "추가"}>{already ? "선택됨" : "추가"}</button>
                </div>
            </div>
        );
    };

    return(
        <div className={styles.wrap}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
                <div className={styles["section-title"]}>메뉴</div>
                <nav className={styles.nav}>
                <Link to="/userpg">마이페이지</Link>
                <Link to="/">문서 게시판</Link>
                <Link to="/">이벤트 게시판</Link>
                <Link to="/approval_req" className={styles.active}>결재 신청</Link>
                <Link to="/approval_approved">결재</Link>
                <Link to="/monthly_page">월별 결산</Link>
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
                <section className={styles.card}>
                    <header>결재 신청</header>
                    <div className={styles.body}>
                    <form className={styles.grid} onSubmit={handleSubmit} onReset={() => setTimeout(() => setOrgFilter(""), 0)}>
                        <label className={styles.label} htmlFor="title">제목</label>
                        <input id="title" className={styles.input} placeholder="예: 6월 홍보물 구입" required value={title} onChange={(e) => setTitle(e.target.value)}/>

                        <label className={styles.label} htmlFor="accountNumber">계좌번호</label>
                        <input id="accountNumber" className={styles.input} placeholder="숫자만 입력" inputMode="numeric" pattern="[0-9\- ]{4,}" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}/>

                        <label className={styles.label} htmlFor="requestDate">신청 날짜</label>
                        <input id="requestDate" className={styles.input} type="date" required value={requestDate ?? ""} onChange={(e)=>setRequestDate(e.target.value)}/>

                        <label className={styles.label} htmlFor="requestDetail">신청 내용</label>
                        <textarea id="requestDetail" className={styles.textarea} placeholder="사용 내역을 자세히 입력하세요" required value={requestDetail} onChange={(e)=>setRequestDetail(e.target.value)}></textarea>

                        <label className={styles.label} htmlFor="requestedAmount">신청 금액</label>
                        <div className={styles.row}>
                        <input id="requestedAmount" className={styles.input} type="number" min="0" step="1" placeholder="예: 150000" required value={requestedAmount} onChange={(e)=>setRequestedAmount(e.target.value)}/>
                        <span className={styles.muted}></span>
                        </div>

                        <label className={styles.label} htmlFor="receiptFile">영수증 이미지</label>
                        <input id="receiptFile" ref={receiptInputRef} className={styles.input} type="file" accept=".jpg,.png,.jpeg" required onChange={(e) => {const f = e.target.files?.[0] ?? null; setReceiptFile(f);}} />

                        <label className={styles.label} htmlFor="approvalCode">코드</label>
                        <select id="approvalCode" className={styles.select} required value={approvalCode} onChange={(e)=>setApprovalCode(e.target.value)}>
                        <option value="" disabled>선택하세요</option>
                        <option value="210">210 사무용품비</option>
                        <option value="220">220 출장비</option>
                        <option value="230">230 업무추진비</option>
                        <option value="240">240 부서별활동비</option>
                        <option value="310">310 정기사업비</option>
                        <option value="320">320 공약사업비</option>
                        <option value="330">330 대규모사업비</option>
                        <option value="510">510 활동지원비</option>
                        <option value="530">530 학생지원비</option>
                        <option value="610">610 환불금</option>
                        <option value="620">620 비상금</option>
                        <option value="710">710 수수료</option>
                        </select>

                        <label className={styles.label} htmlFor="payerName">입금자명</label>
                        <input id="payerName" className={styles.input} placeholder="예: 김OO / 동아리명" required value={payerName} onChange={(e)=>setPayerName(e.target.value)}/>

                        <div className={styles.label}>승인자 선택</div>
                        <div className={styles.row}>
                        <input type="hidden" value={JSON.stringify(approverIds)}/>
                        <div id="chips" className={styles.chips}>
                            {chips.length === 0 ? (
                                <span className={styles.badge}>선택된 승인자 없음</span>
                            ) : chips.map((p) => (
                                <span className={styles.chip} key={p.memberId}>
                                    <b>{p.name}</b>
                                    <span className={styles.muted}>· {p.departmentName}/{p.roleName}</span>
                                    <button type="button" className={styles.rm} aria-label="제거" onClick={() => removePerson(p.memberId)}>x</button>
                                </span>
                            ))}
                        </div>
                        </div>
                        <div className={`${styles.label} ${styles["sr-only"]}`}>조직도</div>
                        <div className={styles.row}>
                        <button type="button" className={styles.btn} onClick={openDrawer}>조직도에서 선택</button>
                        <button type="button" className={`${styles.btn} ${styles.ghost}`} onClick={clearPerson}>전체 해제</button>
                        </div>

                        <div className={`${styles.label} ${styles["sr-only"]}`}>제출</div>
                        <div className={styles.row}>
                        <button className={`${styles.btn} ${styles.primary}`} type="submit">신청서 제출</button>
                        <button className={`${styles.btn} ${styles.ghost}`} type="reset" onClick={()=>{
                            setTitle(""); setAccountNumber(""); setRequestDetail("");
                            setRequestedAmount(""); setApprovalCode(""); setPayerName("");
                            setSelected(new Map()); setRequestDate(fmtDateYYYYMMDD(new Date()));
                            setOrgFilter(""); setReceiptFile(null);
                            if (receiptInputRef.current) receiptInputRef.current.value = "";
                        }}>초기화</button>
                        </div>
                    </form>
                    </div>
                </section>
                </div>
            </main>

            {/* <!-- 조직도 선택 Drawer --> */}
            <div className={`${styles.drawer} ${drawerOpen ? styles.show : ""}`} aria-hidden={drawerOpen ? "false" : "true"}>
            <div className={styles.shade} onClick={closeDrawer}></div>
            <div className={styles.panel} role="dialog" aria-modal="true">
                <header>
                <strong>조직도에서 승인자 선택</strong>
                <div className={styles.row}>
                    <button className={styles.btn} type="button" onClick={closeDrawer}>선택 완료</button>
                    <button className={styles.btn} onClick={closeDrawer}>닫기</button>
                </div>
                </header>
                <div className={styles.body}>
                <div className={styles["org-search"]}>
                    <input ref={orgSearchRef} className={styles.input} placeholder="이름/부서/직책 검색" value={orgFilter} onChange={(e)=>setOrgFilter(e.target.value)} />
                    <button className={styles.btn} type="button" onClick={() => setExpandAll(true)}>모두 펼치기</button>
                    <button className={styles.btn} type="button" onClick={() => setExpandAll(false)}>모두 접기</button>
                </div>
                <div id="org" className={styles.org} aria-live="polite">
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
    <div className={styles.node}>
      <header onClick={() => setOpen((v) => !v)} style={{ cursor: "pointer" }}>
        <div className={styles.row}>
          <span className={styles.toggle}>{open ? "▾" : "▸"}</span>
          <strong>{title}</strong>
        </div>
        <div className={styles.row}>{rightLabel ? <span className={styles.pill}>{rightLabel}</span> : null}</div>
      </header>
      <div className={styles.children} style={{ display: open ? "" : "none" }}>{children}</div>
    </div>
  );
}
export default ApprovalRequestPage;
