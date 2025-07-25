import React, { useState, useEffect } from "react";
import './mainPage.css'
import { doLogout, loadUserInfo } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";

function MainPage(){
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // 페이지 로드 시 정보 가져옴
        loadUserInfo()
        .then(result => {
            if (!result) throw new Error("사용자 정보 없음");
            setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`)
        })
        .catch(err => {
            alert("로그인이 필요함");
            /* navigate('/'); */
        });
    }, []);

    const handleLogout = async () => {
        await doLogout();
        navigate("/");
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <div className="main-wrapper">
            {/* 사이드바 */}
            <nav className="sidebar">
                <ul>
                <li><Link to="미개발" className="sidebar-link">대시보드</Link></li>
                
                {/* 게시판 드롭다운 */}
                <li className="dropdown">
                    <div className="dropdown-toggle" onClick={toggleDropdown}>게시판 <span className="arrow">
                        {dropdownOpen ? "▲" : "▼"}</span>
                    </div>
                    {dropdownOpen && (
                        <ul className={`dropdown-menu ${dropdownOpen ? 'show' : ''}`}>
                            <li><Link to="/document_board">문서게시판</Link></li>
                            <li><Link to="/event_board">이벤트게시판</Link></li>
                            <li><Link to="/inquiry_board.html">문의게시판</Link></li>
                        </ul>
                    )}
                </li>
                
                <li><Link to="/" className="sidebar-link">설정</Link></li>
                <li><Link to="/eventpost" className="sidebar-link">이벤트작성테스트</Link></li>
                </ul>
            </nav>

            {/* 메인 */}
            <div className="main">
                {/* 헤더: 우측 상단 사용자 정보 */}
                <header className="header">
                {/* auth.js가 자동으로 이 요소를 채웁니다 */}
                <div className="user-info" style={{cursor: "pointer"}} onClick={() => navigate("/user")}>
                    {userInfo}
                </div>
                <button id="logoutBtn" className="logout-btn" onClick={handleLogout}>로그아웃</button>
                </header>

                {/* 본문: 추후 컨텐츠 영역 */}
                <section className="content">
                    <h1>대시보드</h1>
                    <p>환영합니다! 좌측 메뉴에서 원하는 기능을 선택해주세요.</p>
                    
                    <div className="dashboard-cards">
                        <div className="card">
                        <h3>문서게시판</h3>
                        <p>공지사항 및 문서를 확인하세요</p>
                        <Link to="/document_board" className="card-link">바로가기</Link>
                        </div>
                        
                        <div className="card">
                        <h3>이벤트게시판</h3>
                        <p>최신 이벤트 정보를 확인하세요</p>
                        <Link to="/event_board" className="card-link">바로가기</Link>
                        </div>
                        
                        <div className="card">
                        <h3>문의게시판</h3>
                        <p>궁금한 점을 문의하세요</p>
                        <Link to="/inquiry_board" className="card-link">바로가기</Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default MainPage;