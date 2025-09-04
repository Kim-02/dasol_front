import React,{ useState, useEffect, useCallback } from "react";
import styles from './documentBoard.module.css'
import { loadUserInfo, doLogout } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";

function DocumentBoard(){

    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

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

    /* 로그아웃 */
    const onLogout = useCallback(async () => {
      await doLogout();
      navigate("/");
    }, [navigate]);
    

    return(
        <div className={styles.wrap}>
        <aside className={styles.sidebar}>
            <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
            <div className={styles.sectionTitle}>메뉴</div>
            <nav className={styles.nav}>
            <Link to="/userpg">마이페이지</Link>
            <Link to="/document_board" className={styles.active}>문서 게시판</Link>
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
            <div>로그인: <b>{currentUser?.name ?? "-"}</b></div>
            <div style={{display: "flex", gap:8}}>
                <button className={styles.logout} onClick={onLogout}>로그아웃</button>
            </div>
            </header>

            <div className={styles.content}>
                <h1>공사중</h1>
            </div>

        </main>
        </div>
    );
}

export default DocumentBoard;