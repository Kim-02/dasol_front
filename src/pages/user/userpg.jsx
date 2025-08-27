import React, {useCallback, useEffect, useState, useMemo} from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchWithAuth, doLogout } from "../../utils/auth";
import styles from "./userpg.module.css";

const API_BASE = "http://localhost:8080/api"

/* UI 보조함수: 이벤트 참여 내역 날짜랑 금액 */
const pad2 = (n) => String(n).padStart(2, "0");
const fmtDateTime = (dtLike) => {
    if (!dtLike) return "-";
    const d = new Date(dtLike);
    if (isNaN(d.getTime())) return String(dtLike);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};
const money = (n) => Number(n || 0).toLocaleString("ko-KR");

const flattenDept = (data) => {
  const names = new Set();

  const getLabel = (node) => node?.name ?? node?.departmentName ?? node?.title ?? "";
  const getChildren = (node) => node?.children ?? node?.child ?? node?.nodes ?? [];

  const dfs = (node, path = []) => {
    if (!node || typeof node !== "object") return;
    const label = getLabel(node);
    const nextPath = label ? [...path, label] : path;
    if (label) names.add(nextPath.join(" / "));
    const ch = getChildren(node);
    if (Array.isArray(ch)) ch.forEach((c) => dfs(c, nextPath));
  };

  if (Array.isArray(data)) {
    data.forEach((item) => {
      const hasTree = Array.isArray(getChildren(item));
      if (hasTree) dfs(item, []);
      else {
        const label = getLabel(item);
        if (label) names.add(label);
      }
    });
  } else if (data && typeof data === "object") {
    dfs(data, []);
  }

  return Array.from(names).filter(Boolean);
};

function UserPg(){
    const navigate = useNavigate();

    /* 사용자랑 이벤트 상태 */
    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");

    /* 비밀번호 변경 */
    const [showCheckModal, setShowCheckModal] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    /* 정보 수정 클릭시 수정 모달 상태 */
    const [showProfile, setShowProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        studentId: "",
        enterYear: "",
        gender: "",
        email: "",
        phone: "",
        name: "",
    });

    /* 직급:회장 전용 부서 배정 모달 및 권한 변경 */
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [deptForm, setDeptForm] = useState({ departmentName: "", studentId: "" });
    const [deptOptions, setDeptOptions] = useState([]);
    const [deptLoading, setDeptLoading] = useState(false);
    const [deptError, setDeptError] = useState("");

    const [showPermModal, setShowPermModal] = useState(false);
    const [permForm, setPermForm] = useState({ reason: "", targetStudentId: "", role: "100" });

    useEffect(() => {
        (async () =>{
            try{
                /* 프로필: resP, jsonP */
                const resP = await fetchWithAuth(`${API_BASE}/user/profile`);
                const jsonP = await resP.json();
                if (!resP.ok) throw new Error(jsonP.message || resP.statusText);
                setUser(jsonP.result);

                /* 이벤트 내역: resE, jsonE */
                const resE = await fetchWithAuth(`${API_BASE}/user/event`);
                const jsonE = await resE.json();
                if (!resE.ok) throw new Error(jsonE.message || resE.statusText);
                setEvents(jsonE.result || []);

                /* 프로필 모달 기본값 동기화: jsonP, u */
                const u = jsonP.result || {};
                setProfileForm({
                    studentId: u.studentId ?? "",
                    enterYear: u.enterYear ?? "",
                    gender: u.gender ?? "",
                    email: u.email ?? "",
                    phone: u.phone ?? "",
                    name: u.name ?? "",
                });
            } catch (err){
                alert("회원/이벤트 정보 불러오기 실패: " + err.message);
                /* navigate('/'); */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const onLogout = useCallback(async () => {
        await doLogout();
        navigate("/");
    }, [navigate]);

    /* 비번 변경 플로우 */
    const openPasswordChange = () => {
        setOldPassword("");
        setNewPassword("");
        setShowCheckModal(true);
    };
    
    const handleCheckPassword = async() => {
        if (!oldPassword) return alert('현재 비밀번호를 입력하세요.');
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/password/check`,{
               method: 'POST' ,
               body: JSON.stringify({oldPassword}),
            });
            const json = await res.json();
            if(!res.ok) throw new Error(json.message || res.statusText);
            setShowCheckModal(false);
            setShowChangeModal(true);
            setNewPassword("");
        } catch (err){
            alert("비밀번호 확인 실패: " + err.message);
        }
    };
    
    const handleChangePassword = async() => {
        if (!newPassword) return alert ('새 비밀번호를 입력하세요.');
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/password/change`, {
                method: 'POST',
                body: JSON.stringify({newPassword}),
            });
            const json = await res.json();
            if(!res.ok) throw new Error(json.message || res.statusText);
            alert("비밀번호가 변경되었습니다.");
            setShowChangeModal(false);
        } catch (err) {
            alert("비밀번호 변경 실패: " + err.message);
        }
    };

    /* 회원 정보 수정 */
    const openProfileEdit = () => setShowProfile(true);

    const submitProfileEdit = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/user/profile/change`, {
                method: "POST",
                body: JSON.stringify(profileForm),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || res.statusText);
            alert("회원 정보가 수정되었습니다.");
            setShowProfile(false);
            /* 최신 상태 반영: 프로필 재조회 */
            const r = await fetchWithAuth(`${API_BASE}/user/profile`);
            const j = await r.json();
            if (r.ok) setUser(j.result);
        } catch (err) {
            alert("회원 정보 수정 실패: " + err.message);
        }
    };

    /* 이벤트 참여 취소 */
    const leaveEvent = async (eventId) => {
        if (!window.confirm("해당 이벤트 참여를 취소하시겠습니까?")) return;
        try {
            const res = await fetchWithAuth(`${API_BASE}/user/event/leave/${encodeURIComponent(eventId)}`, {
                method: "POST",
            });
            const json = await res.json();
            if(!res.ok) throw new Error(json.message || res.statusText);
            alert("참여가 취소되었습니다.");
            /* 목록 갱신 */
            const r = await fetchWithAuth(`${API_BASE}/user/event`);
            const j = await r.json();
            if (r.ok) setEvents(j.result || []);
        } catch (err) {
            alert("참여 취소 실패: " + err.message);
        }
    };

    /* 조직도 가져오기 */
    const loadDeptTree = useCallback(async () => {
        setDeptLoading(true);
        setDeptError("");
        try {
        const res = await fetchWithAuth(`${API_BASE}/department/tree`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || res.statusText);
        const list = flattenDept(json.result ?? json);
        setDeptOptions(list);
        /* 초기 선택값이 비어있다면 첫 항목으로 설정 */
        if (list.length && !deptForm.departmentName) {
            setDeptForm((prev) => ({ ...prev, departmentName: list[0] }));
        }
        } catch (e) {
        setDeptError(e.message);
        } finally {
        setDeptLoading(false);
        }
    }, [deptForm.departmentName]);

    /* 부서배정 모달 열릴 때마다 조직도 로딩되게 */
    useEffect(() => {
        if (showDeptModal) loadDeptTree();
    }, [showDeptModal, loadDeptTree]);

    /* 조승훈 전용 부서 배정 */
    const submitDepartmentGiving = async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/user/department/giving`, {
                method: "POST",
                body: JSON.stringify(deptForm),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || res.statusText);
            alert("부서 배정이 적용되었습니다.");
            setShowDeptModal(false);
        } catch (err) {
        alert("부서 배정 실패: " + err.message);
        }
    };
    /* 조승훈 전용 권한 변경 */
    const submitPermissionChange = async () => {
        try {
            const payload = { ...permForm, role: String(permForm.role) };
            const res = await fetchWithAuth(`${API_BASE}/user/permission/change`, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || res.statusText);
            alert("권한이 변경되었습니다.");
            setShowPermModal(false);
        } catch (err) {
            alert("권한 변경 실패: " + err.message);
        }
    };

    /* 검색 필터링된 이벤트 목록 */
    const filteredEvents = useMemo(() => {
        const k = keyword.trim().toLowerCase();
        if (!k) return events;
        return events.filter((e) => String(e.postTitle || "").toLowerCase().includes(k));
    }, [events, keyword]);


    const isPresident = (user?.roleName || "").toLowerCase() === "presidency";


    return (
        <div className={styles.wrap}>
            <aside className={styles.sidebar}>
                <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
                <div className={styles.sectionTitle}>메뉴</div>
                <nav className={styles.nav}>
                    <Link to="/userpg" className={styles.active}>마이페이지</Link>
                    <Link to="/">문서 게시판</Link>
                    <Link to="/">이벤트 게시판</Link>
                    <Link to="/approval_req">결재 신청</Link>
                    <Link to="/approval_approved">결재</Link>
                    <Link to="/monthly_page">월별 결산</Link>
                    <Link to="/">설정</Link>
                    <Link to="/permission">권한변경</Link>
                </nav>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                    <div>
                        로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b>
                    </div>
                    <button className={styles.logout} onClick={onLogout}>로그아웃</button>
                </header>

                <div className={styles.content}>
                    {/* 유저 정보 */}
                    <section className={styles.panel}>
                        <div className={styles.hd}>회원 정보</div>
                        <div className={styles.bd}>
                            <div className={styles.field}>
                                <label>이름</label>
                                <div>{user?.name ?? "-"}</div>
                            </div>
                            <div className={styles.field}>
                                <label>학번</label>
                                <div>{user?.studentId ?? "-"}</div>
                            </div>
                            <div className={styles.field}>
                                <label>전화</label>
                                <div>{user?.phone ?? "-"}</div>
                            </div>
                            <div className={styles.field}>
                                <label>이메일</label>
                                <div>{user?.email ?? "-"}</div>
                            </div>
                            <div className={styles.field}>
                                <label>학생회비</label>
                                <div>
                                    <span className={`${styles.chip} ${user?.paidUser ? styles.chipOk : styles.chipWarn}`}>
                                        {user?.paidUser ? "납부" : "미납"}
                                    </span>
                                </div>
                            </div>
                            <div className={`${styles.field} ${styles.fieldActions}`}>
                                <button className={`${styles.btn} ${styles.btnPrimary}`} type="button" onClick={openPasswordChange}>비밀번호 변경</button>
                                <button className={`${styles.btn} ${styles.btnSecondary}`} type="button" onClick={openProfileEdit}>정보 수정</button>

                                {/* 회장만 보이는 버튼들 */}
                                {isPresident && (
                                    <>
                                        <button className={`${styles.btn}`} type="button" onClick={() => setShowDeptModal(true)}>부서 배정</button>
                                        <button className={`${styles.btn}`} type="button" onClick={() => setShowPermModal(true)}>권한 부여/변경</button>
                                    </>
                                )}
                            </div>
                        </div>    
                    </section>

                    {/* 이벤트 참여 내역 */}
                    <section className={styles.panel}>
                        <div className={styles.hd}>이벤트 참여 내역</div>
                        <div className={styles.bd}>
                            <div className={styles.toolbar}>
                                <div className={styles.sub}>총 <b>{loading ? "-" : filteredEvents.length}</b>건</div>
                                <input className={styles.search} placeholder="제목 검색" value={keyword} onChange={(e) => setKeyword(e.target.value)}/>
                            </div>

                            {loading ? (
                                <div className={styles.empty}>불러오는 중...</div>
                                ) : filteredEvents.length === 0 ? (
                                <div className={styles.empty}>참여한 이벤트가 없습니다.</div>
                                ) : (
                                    <div className={styles.grid}>
                                        {filteredEvents.map((ev) => (
                                            <article key={ev.postId} className={styles.card}>
                                                <h3>{ev.postTitle}</h3>
                                                <div className={styles.meta}>
                                                    <div className={styles.row}><span>시작일</span><span>{fmtDateTime(ev.postStartDate)}</span></div>
                                                    <div className={styles.row}><span>마감일</span><span>{fmtDateTime(ev.postEndDate)}</span></div>
                                                    <div className={styles.row}><span>납부여부</span>
                                                        <span className={`${styles.badge} ${ev.eventPaidSuccess ? styles.ok : styles.warn}`}>
                                                            {ev.eventPaidSuccess ? "납부" : "미납"}
                                                        </span>
                                                    </div>
                                                    <div className={styles.row}><span>납부금액</span><b>{money(ev.eventPayAmount)}</b></div>
                                                    {ev.eventPaidDate && (
                                                        <div className={styles.row}><span>납부일시</span><span>{fmtDateTime(ev.eventPaidDate)}</span></div>
                                                    )}
                                                    </div>
                                                    <div className={styles.actions}>
                                                        <button className={styles.danger} onClick={() => leaveEvent(ev.postId)}>참여 취소</button>
                                                    </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </main>

                {/* 이제 모달 */}

                {/* 비밀번호: 현재 비번 확인 */}
                {showCheckModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalBody}>
                            <h3>현재 비밀번호 확인</h3>
                            <input
                                type="password"
                                placeholder="현재 비밀번호"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                            <div className={styles.modalFooter}>
                            <button onClick={() => setShowCheckModal(false)}>취소</button>
                            <button className={styles.btnPrimary} onClick={handleCheckPassword}>확인</button>
                            </div>
                        </div>
                    </div>
                )}


                {/* 비밀번호: 새 비번 입력/변경 */}
                {showChangeModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalBody}>
                            <h3>새 비밀번호 설정</h3>
                            <input
                            type="password"
                            placeholder="새 비밀번호"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <div className={styles.modalFooter}>
                            <button onClick={() => setShowChangeModal(false)}>닫기</button>
                            <button className={styles.btnPrimary} onClick={handleChangePassword}>변경</button>
                            </div>
                        </div>
                    </div>
                )}


                {/* 회원 정보 수정 */}
                {showProfile && (
                    <div className={styles.modal}>
                        <div className={styles.modalBody}>
                            <h3>회원 정보 수정</h3>
                            <div className={styles.formGrid}>
                            <label>학번</label>
                            <input value={profileForm.studentId} onChange={(e) => setProfileForm({ ...profileForm, studentId: e.target.value })} />


                            <label>입학년도</label>
                            <input value={profileForm.enterYear} onChange={(e) => setProfileForm({ ...profileForm, enterYear: e.target.value })} />


                            <label>성별</label>
                            <input value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} />


                            <label>이메일</label>
                            <input value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />


                            <label>전화</label>
                            <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />


                            <label>이름</label>
                            <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                        </div>
                        <div className={styles.modalFooter}>
                            <button onClick={() => setShowProfile(false)}>닫기</button>
                            <button className={styles.btnPrimary} onClick={submitProfileEdit}>저장</button>
                        </div>
                    </div>
                </div>
                )}

                {/* (회장) 부서 배정 */}
                {showDeptModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalBody}>
                            <h3>부서 배정</h3>

                            {/* 조직도 로딩, 오류, 성공 */}
                            {deptLoading && <div className={styles.sub}>조직도 불러오는 중...</div>}
                            {!!deptError && <div style={{color: "red"}}>불러오기 실패: {deptError}</div>}
                            <div className={styles.formGrid}>
                                <label>부서</label>
                                <select value={deptForm.departmentName} onChange={(e) => setDeptForm({ ...deptForm, departmentName: e.target.value })} disabled={deptLoading || !!deptError} >
                                    {deptOptions.map((d) => (
                                    <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>

                                <label>대상 학번</label>
                                <input
                                    placeholder="예) 20201234"
                                    value={deptForm.studentId}
                                    onChange={(e) => setDeptForm({ ...deptForm, studentId: e.target.value })}
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setShowDeptModal(false)}>닫기</button>
                                <button className={styles.btnPrimary} onClick={submitDepartmentGiving} disabled={!deptForm.departmentName}>배정</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* (회장) 권한 변경 */}
                {showPermModal && (
                    <div className={styles.modal}>
                        <div className={styles.modalBody}>
                            <h3>권한 부여/변경</h3>
                            <div className={styles.formGrid}>
                                <label>사유</label>
                                <input value={permForm.reason} onChange={(e) => setPermForm({ ...permForm, reason: e.target.value })} />

                                <label>대상 학번</label>
                                <input value={permForm.targetStudentId} onChange={(e) => setPermForm({ ...permForm, targetStudentId: e.target.value })} />

                                <label>권한</label>
                                <select value={permForm.role} onChange={(e) => setPermForm({ ...permForm, role: e.target.value })}>
                                    <option value="100">100 — 일반이용자(User)</option>
                                    <option value="200">200 — 회장(Presidency)</option>
                                    <option value="201">201 — 부장(Manager)</option>
                                    <option value="202">202 — 부원(Member)</option>
                                </select>
                            </div>
                            <div className={styles.modalFooter}>
                                <button onClick={() => setShowPermModal(false)}>닫기</button>
                                <button className={styles.btnPrimary} onClick={submitPermissionChange}>적용</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
    );
}

export default UserPg;
