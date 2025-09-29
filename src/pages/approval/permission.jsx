import React, {useCallback, useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, fetchWithAuth, doLogout } from "../../utils/auth";
import styles from "./permission.module.css";

const API_BASE = "https://back.kutcse.com/api";

function colorBar(idx){
  const colors = ["var(--barA)","var(--barB)","var(--barC)","var(--barD)"];
  return colors[idx % colors.length];
}

/* roleCode → roleName 매핑 */
const roleNameOf = (code) => {
  if (code === 200) return "Presidency";
  if (code === 201) return "Manager";
  if (code === 202) return "Member";
  return String(code ?? "");
};

/* 백엔드 tree → 기존 UI가 쓰던 구조(leaf / children / nodes)로 변환 */
const toLegacyOrg = (root) => {
  if (!root || typeof root !== "object") return null;

  const person = (n) => ({
    memberId: n.id ?? n.memberId ?? undefined,
    name: n.name ?? "-",
    departmentName: n.departmentName ?? "-",
    roleCode: n.roleCode,
    roleName: roleNameOf(n.roleCode),
  });

  // 상단 루트(회장)
  const leaf = person(root);

  // 1열: Presidency만
  const presidents = (root.children || [])
    .filter((c) => c?.roleCode === 200)
    .map(person);

  // 부서 컬럼: roleCode === 201 을 부서장으로 보고, 그 하위 children을 부원으로
  const deptNodes = (root.children || [])
    .filter((c) => c?.roleCode === 201)
    .map((mgr) => ({
      leaf: person(mgr), // 부서장
      children: (mgr.children || []).map(person), // 부원들
      nodes: [],
    }));

  return {
    leaf,
    children: presidents,
    nodes: deptNodes,
  };
};

/* 문자열/객체 모두 받기 */
const asObject = (v) => {
  if (v == null) return null;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return null; }
  }
  return typeof v === "object" ? v : null;
};

function DeptColum({dept, index}){
  const members = dept.children || [];
  return (
    <div className={styles.dept}>
      <div className={styles.bar} style={{background: colorBar(index)}}>{dept.leaf?.departmentName}</div>
      <div className={styles.bd}>
        <div className={styles.sec}>
          <h4>부서장</h4>
          <div className={styles.mgr}>{dept.leaf?.name}</div>
          <div className={styles.muted}>역할: {dept.leaf?.roleName} · 코드 {dept.leaf?.roleCode}</div>
        </div>
        <div className={styles.sec}>
          <h4>구성원</h4>
          {members.length === 0 ? (
            <div className={styles.muted}>없음</div>
          ): (
            <ul className={styles.list}>
              {members.map((m) => (
                <li key={m.memberId ?? `${m.name}-${m.roleCode}`}>
                  {m.name}<span className={styles.muted}>({m.roleName}·{m.roleCode})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PermissionPage(){
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  /* 조직도 데이터 */
  const [tree, setTree]= useState(null);

  /* 폼 > 부서 변경 */
  const [deptStudentId, setDeptStudentId] = useState("");
  const [deptDepartment, setDeptDepartment] = useState("홍보");
  /* 역할 변경 */
  const [roleStudentId, setRoleStudentId] = useState("");
  const [roleReason, setRoleReason] = useState("");
  const [roleCode, setRoleCode] = useState("100");

  useEffect(() => {
    (async () => {
      try{
        const i = await loadUserInfo();
        setUser(i);
      } catch (e) {
        console.error(e);
        navigate("/");
      }
    })();
  }, [navigate]);

  /* 조직도 로드: result가 문자열/객체 어떤 케이스든 대응 */
    useEffect(() => {
        let aborted = false;
        (async () => {
        try {
            const res = await fetchWithAuth(`${API_BASE}/department/tree`);
            if (!res.ok) {
            const t = await res.text().catch(()=> "");
            throw new Error(t || "조직도 로드 실패");
            }
            const body = await res.json().catch(()=> ({}));
            const raw = body?.result ?? body;
            const parsed = asObject(raw);
            if (!parsed) throw new Error("조직도 파싱 실패");

            const legacy = toLegacyOrg(parsed);
            if (!legacy) throw new Error("조직도 변환 실패");

            if (!aborted) setTree(legacy);
        } catch (e) {
            console.error(e);
        }
        })();
        return () => { aborted = true; };
    }, []);

  const onLogout = useCallback(async () => {
    await doLogout();
    navigate("/");
  }, [navigate]);

  const rootLeaf = tree?.leaf;
  const presidents = tree?.children || [];
  const depts = tree?.nodes || [];

  /* 부서 변경 제출 */
  const submitDept = useCallback(async (e) => {
    e.preventDefault();
    const payload = {
      studentId: deptStudentId.trim(),
      department: deptDepartment,
    };
    console.log("부서 변경 JSON:", payload);
    alert("부서 변경 JSON을 콘솔에 출력함");
  }, [deptStudentId, deptDepartment]);

  /* 역할 변경 */
  const submitRole = useCallback(async (e) => {
    e.preventDefault();
    const payload = {
      studentId: roleStudentId.trim(),
      reason: roleReason.trim(),
      roleCode: Number(roleCode),
    };
    console.log("역할 변경 JSON:", payload);
    alert("역할 변경 JSON을 콘솔에 출력");
  }, [roleStudentId, roleReason, roleCode]);

  return (
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
          <Link to="/monthly_page">월별 결산</Link>
          <Link to="/">설정</Link>
          <Link to="/permission" className={styles.active}>권한변경</Link>
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b></div>
          <button className={styles.logout} onClick={onLogout}>로그아웃</button>
        </header>

        <div className={styles.content}>
          {/* 조직도 */}
          <section className={styles.panel}>
            <div className={styles.hd}>조직도</div>
            <div className={styles.bd}>
              <div className={styles.chart}>
                <div className={styles["level-0"]}>
                  <div className={styles.box}>
                    {rootLeaf ? `${rootLeaf.departmentName} : ${rootLeaf.name}` : "-"}
                  </div>
                </div>
                <div className={styles.connector}></div>
                <div className={`${styles.row} ${styles["level-1"]}`}>
                  {presidents.map((c) => (
                    <div key={c.memberId ?? `${c.name}-200`} className={styles.box}>
                      {c.departmentName} : {c.name}
                    </div>
                  ))}
                </div>
                <div className={styles.connector}></div>
                <div className={styles.row}>
                  {depts.map((d, i) => (
                    <DeptColum key={d.leaf?.memberId ?? `${d.leaf?.departmentName}-${i}`} dept={d} index={i} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* 권한 변경 */}
          <section className={styles.panel}>
            <div className={styles.hd}>권한 변경</div>
            <div className={styles.bd}>
              <div className={styles["grid-forms"]}>
                <div className={styles.form}>
                  <h3>부서 변경</h3>
                  <div className={styles.f} onSubmit={submitDept}>
                    <div className={styles.field}>
                      <label htmlFor="dept-studentId">학번</label>
                      <input id="dept-studentId" className={styles.input} name="studentId" placeholder="예: 20210001" value={deptStudentId} onChange={(e) => setDeptStudentId(e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="dept-department">부서</label>
                      <select id="dept-department" className={styles.select} name="department" value={deptDepartment} onChange={(e) => setDeptDepartment(e.target.value)}>
                        <option value="기획">기획</option>
                        <option value="문화">문화</option>
                        <option value="체육">체육</option>
                        <option value="총무">총무</option>
                        <option value="학술">학술</option>
                        <option value="홍보">홍보</option>
                        <option value="부회장">부회장</option>
                        <option value="회장">회장</option>
                        <option value="컴퓨터공학부">컴퓨터공학부</option>
                      </select>
                    </div>
                    <div><button className={`${styles.btn} ${styles["btn-primary"]}`} type="submit">변경</button></div>
                    <div className={styles.help}>요청 JSON은 콘솔에 출력.</div>
                  </div>
                </div>

                <div className={styles.form}>
                  <h3>역할 변경</h3>
                  <form className={styles.f} onSubmit={submitRole}>
                    <div className={styles.field}>
                      <label htmlFor="role-studentId">학번</label>
                      <input id="role-studentId" className={styles.input} name="studentId" placeholder="예: 20210001" value={roleStudentId} onChange={(e)=>setRoleStudentId(e.target.value)}/>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="role-reason">사유</label>
                      <textarea id="role-reason" className={styles.input} name="reason" rows={3} placeholder="변경 사유 입력" value={roleReason} onChange={(e) => setRoleReason(e.target.value)}></textarea>
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="">역할</label>
                      <select id="role-code" className={styles.select} name="roleCode" value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
                        <option value="100">100 (일반)</option>
                        <option value="200">200 (회장)</option>
                        <option value="201">201 (부장)</option>
                        <option value="202">202 (부원)</option>
                      </select>
                    </div>
                    <div><button className={`${styles.btn} ${styles["btn-primary"]}`} type="submit">변경</button></div>
                    <div className={styles.help}>roleCode 숫자만 전송. 콘솔 확인.</div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default PermissionPage;
