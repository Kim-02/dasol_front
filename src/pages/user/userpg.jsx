import React, {useCallback, useEffect, useState} from "react";
import { Link, useNavigate } from "react-router-dom";
import { loadUserInfo, /* fetchWithAuth, */ doLogout } from "../../utils/auth";
import "./userpg.css";

function UserPg(){
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

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

    return (
        <div className="wrap">
            <aside className="sidebar">
            <div className="brand">컴퓨터공학부 종합관리시스템</div>
            <div className="section-title">메뉴</div>
            <nav className="nav">
                <Link to="/userpg" className="active">마이페이지</Link>
                <Link to="/">문서 게시판</Link>
                <Link to="/">이벤트 게시판</Link>
                <Link to="/approval_req">결재 신청</Link>
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
                {/* <!-- 유저 정보 --> */}
                <section className="panel">
                <div className="hd">회원 정보</div>
                <div className="bd">
                    <div className="field"><label>이름</label><div>{user?.name ?? "-"}</div></div>
                    <div className="field"><label>학번</label><div>{user?.studentId ?? "-"}</div></div>
                    <div className="field"><label>전화</label><div>{user?.phone ?? "-"}</div></div>
                    <div className="field"><label>이메일</label><div>{user?.email ?? "-"}</div></div>
                    <div className="field">
                        <label>학생회비</label>
                        <div>
                            <span class="chip chip-warn">{user?.paidUser ?? "미납"}</span>
                        </div>
                    </div>
                    <div className="field field-actions">
                        <button className="btn btn-primary" type="button">비밀번호 변경</button>
                        <button className="btn btn-secondary" type="button">정보 수정</button>
                    </div>
                </div>    
                </section>

                {/* <!-- 이벤트 참여 내역 --> */}
                <section className="panel">
                <div className="hd">이벤트 참여 내역</div>
                <div className="bd">
                    <div className="toolbar">
                    <div className="sub">총 <b>2</b>건</div>
                    <input className="search" placeholder="제목 검색" />
                    </div>
                    <div className="grid">
                    <article className="card">
                        <h3>t12</h3>
                        <div className="meta">
                        <div className="row"><span>시작일</span><span>2025-06-11 18:00</span></div>
                        <div className="row"><span>마감일</span><span>2025-06-11 20:00</span></div>
                        <div className="row"><span>납부여부</span><span class="badge warn">미납</span></div>
                        <div className="row"><span>납부금액</span><b>1,300,000</b></div>
                        </div>
                        <div className="actions"><button class="danger">참여 취소</button></div>
                    </article>
                    <article className="card">
                        <h3>테스트 데이터1</h3>
                        <div className="meta">
                        <div className="row"><span>시작일</span><span>2025-06-11 18:00</span></div>
                        <div className="row"><span>마감일</span><span>2025-06-11 20:00</span></div>
                        <div className="row"><span>납부여부</span><span className="badge warn">미납</span></div>
                        <div className="row"><span>납부금액</span><b>0</b></div>
                        </div>
                        <div className="actions"><button className="danger">참여 취소</button></div>
                    </article>
                    </div>
                </div>
                </section>
            </div>
            </main>
            </div>
    );
}

export default UserPg;