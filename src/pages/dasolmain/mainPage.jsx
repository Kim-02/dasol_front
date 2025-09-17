import React, { useState, useEffect, useCallback } from "react";
import styles from './mainPage.module.css'
import { doLogout, loadUserInfo } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";

function MainPage(){
    const [user, setUser] = useState("null");
    const navigate = useNavigate();

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

    const onLogout = useCallback(async () => {
        await doLogout();
        navigate("/");
    }, [navigate]);

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
                <Link to="/permission">권한변경</Link>
            </nav>
            </aside>

            <main className={styles.main}>
                <header className={styles.header}>
                <div>로그인: <b>{user ? `${user.name ?? "-"} (${user.studentId ?? "-"})` : "-"}</b></div>
                <button className={styles.logout} onClick={onLogout}>로그아웃</button>
                </header>

            </main>
        </div>

    )
}

export default MainPage;