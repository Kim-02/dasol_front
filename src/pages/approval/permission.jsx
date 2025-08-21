import React, {useCallback, useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, /* fetchWithAuth,  */doLogout } from "../../utils/auth";
import "./permission.css";

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
        children: [{ memberId:6, name: "김민준", departmentName: "부회장", roleName: "Presidency", roleCode: 200}],
        leaf: { memberId:5, name: "조승훈", departmentName: "회장", roleName: "Presidency", roleCode: 200},
    },
};

function colorBar(idx){
    const colors = ["var(--barA)","var(--barB)","var(--barC)","var(--barD)"];
    return colors[idx % colors.length];
}

function DeptColum({dept, index}){
    const members = dept.children || [];
    return (
        <div className="dept">
            <div className="bar" style={{background: colorBar(index)}}>{dept.leaf?.departmentName}</div>
            <div className="bd">
                <div className="sec">
                    <h4>부서장</h4>
                    <div className="mgr">{dept.leaf?.name}</div>
                    <div className="muted">역할: {dept.leaf?.roleName} · 코드 {dept.leaf?.roleCode}</div>
                </div>
                <div className="sec">
                    <h4>구성원</h4>
                    {members.length === 0 ? (
                        <div className="muted">없음</div>
                    ): (
                        <ul className="list">
                            {members.map((m) => (
                                <li key={m.memberId}>
                                    {m.name}<span className="muted">({m.roleName}·${m.roleCode})</span>
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

    /* 조직도 데이터(수정필요) */
    const [tree]= useState(ORG_API.result);
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
                /* navigate("/"); */
            }
        })();
    }, [navigate]);

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
        // 실제 API 연결 시:
        // const res = await fetchWithAuth(`${API_BASE_URL}/admin/department`, {
        //   method: "POST",
        //   body: JSON.stringify(payload),
        // });
        // const json = await res.json();
        // if (!res.ok) alert(json.message || "부서 변경 실패"); else alert("부서 변경 완료");

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
        console.log("역할 변경 JsoN:", payload);
        
        // 실제 API 연결 시:
        // const res = await fetchWithAuth(`${API_BASE_URL}/admin/role`, {
        //   method: "POST",
        //   body: JSON.stringify(payload),
        // });
        // const json = await res.json();
        // if (!res.ok) alert(json.message || "역할 변경 실패"); else alert("역할 변경 완료");

        alert("역할 변경 JSON을 콘솔에 출력");
    }, [roleStudentId, roleReason, roleCode]);

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
                <Link to="/approval_approved">결재</Link>
                <Link to="/approval_skeleton">결재-스켈레톤</Link>
                <Link to="/monthly_page">월별 결산</Link>
                <Link to="/">설정</Link>
                <Link to="/permission" className="active">권한변경</Link>
            </nav>
            </aside>

            <main className="main">
                <header className="header">
                <div>로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b></div>
                <button className="logout" onClick={onLogout}>로그아웃</button>
                </header>

            <div className="content">
                {/* <!-- 조직도 --> */}
                <section className="panel">
                <div className="hd">조직도</div>
                <div className="bd">
                    <div className="chart">
                    <div className="level-0">
                        <div className="box">
                            {rootLeaf ? `${rootLeaf.departmentName} : ${rootLeaf.name}` : "-"}
                        </div>
                    </div>
                    <div className="connector"></div>
                    <div className="row level-1">
                        {presidents.map((c) => (
                            <div key={c.memberId} className="box">
                                {c.departmentName} : {c.name}
                            </div>
                        ))}
                    </div>
                    <div className="connector"></div>
                    <div className="row">
                        {depts.map((d, i) => (
                            <DeptColum key={d.leaf?.memberId ?? i} dept={d} index={i} />
                        ))}
                    </div>
                    </div>
                </div>
                </section>

                {/* <!-- 권한 변경 --> */}
                <section className="panel">
                <div className="hd">권한 변경</div>
                <div className="bd">
                    <div className="grid-forms">
                    <div className="form">
                        <h3>부서 변경</h3>
                        <div className="f" onSubmit={submitDept}>
                        <div className="field">
                            <label htmlFor="dept-studentId">학번</label>
                            <input id="dept-studentId" className="input" name="studentId" placeholder="예: 20210001" value={deptStudentId} onChange={(e) => setDeptStudentId(e.target.value)} />
                        </div>
                        <div className="field">
                            <label htmlFor="dept-department">부서</label>
                            <select id="dept-department" className="select" name="department" value={deptDepartment} onChange={(e) => setDeptDepartment(e.target.value)}>
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
                        <div><button className="btn btn-primary" type="submit">변경</button></div>
                        <div className="help">요청 JSON은 콘솔에 출력.</div>
                        </div>
                    </div>

                    <div className="form">
                        <h3>역할 변경</h3>
                        <form className="f" onSubmit={submitRole}>
                        <div className="field">
                            <label htmlFor="role-studentId">학번</label>
                            <input id="role-studentId" className="input" name="studentId" placeholder="예: 20210001" value={roleStudentId} onChange={(e)=>setRoleStudentId(e.target.value)}/>
                        </div>
                        <div className="field">
                            <label htmlFor="role-reason">사유</label>
                            <textarea id="role-reason" className="input" name="reason" rows={3} placeholder="변경 사유 입력" value={roleReason} onChange={(e) => setRoleReason(e.target.value)}></textarea>
                        </div>
                        <div className="field">
                            <label htmlFor="">역할</label>
                            <select id="role-code" className="select" name="roleCode" value={roleCode} onChange={(e) => setRoleCode(e.target.value)}>
                            <option value="100">100 (일반)</option>
                            <option value="200">200 (회장)</option>
                            <option value="201">201 (부장)</option>
                            <option value="202">202 (부원)</option>
                            </select>
                        </div>
                        <div><button className="btn btn-primary" type="submit">변경</button></div>
                        <div className="help">roleCode 숫자만 전송. 콘솔 확인.</div>
                        </form>
                    </div>
                    </div>
                </div>
                </section>
            </div>
            </main>
        </div>

    )
}

export default PermissionPage;