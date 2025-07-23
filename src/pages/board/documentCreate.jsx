import React, { useState, useEffect } from "react";
import './documentBoard.css'
import { loadUserInfo } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown, handleInputChange, handleSubmit} from "../../utils/boardUtils";

function DocumentCreate(){
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const navigate = useNavigate();

    const [createData, setCreateData] = useState({
        title: '',
        content: '',
        startDate: '',
        endDate: '',
        target: '',
        capacity: '',
        filePath: '',
        realLocation: ''
    });

    useEffect(() => {
        // 페이지 로드 시 정보 가져옴
        loadUserInfo()
        .then(result => {
            if (!result) throw new Error("사용자 정보 없음");
                setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`)
        })
        .catch(err => {
            alert("로그인이 필요함");
            navigate('/');
        });

    }, [navigate]);
    

  return (
    <div className="main-wrapper">
        <nav className="sidebar">
            <ul>
            <li><Link to="/main" className="sidebar-link">대시보드</Link></li>
            {/* 게시판 드롭다운 */}
            <li className="dropdown">
                <div className="dropdown-toggle" onClick={() => toggleDropdown(setDropdownOpen)}>게시판 <span className="arrow">
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
            </ul>
        </nav>

        {/* 메인 영역 */}
        <div className="main">
            {/* 헤더: 우측 상단 사용자 정보 */}
            <header className="header">
            {/* auth.js가 자동으로 이 요소를 채웁니다 */}
            <div className="user-info" style={{cursor: "pointer"}} onClick={() => navigate("/user")}>
                {userInfo}
            </div>
            <button id="logoutBtn" className="logout-btn" onClick={() => handleLogout(navigate)}>로그아웃</button>
            </header>

        {/* 본문: 새 문서 작성 폼 */}
        <section className="content">
        <div className="board-header">
            <h1>새 문서 작성</h1>
            <button className="btn-create" onClick={() => navigate('/document_board')}>목록으로</button>
        </div>

        <form id="createPostForm" className="form-container" onSubmit={(e) => handleSubmit(e, navigate, createData)}>
            <div className="form-group">
            <label htmlFor="title">제목</label>
            <input type="text" id="title" name="title" value={createData.title} onChange={(e) => handleInputChange(e, setCreateData)} required></input>
            </div>
            
            <div className="form-group">
            <label htmlFor="content">내용</label>
            <textarea id="content" name="content" rows="6" value={createData.content} onChange={(e) => handleInputChange(e, setCreateData)} required></textarea>
            </div>
            
            <div className="form-group">
            <label htmlFor="startDate">시작일시</label>
            <input type="datetime-local" id="startDate" name="startDate" value={createData.startDate} onChange={(e) => handleInputChange(e, setCreateData)} required></input>
            </div>

            <div className="form-group">
            <label htmlFor="endDate">종료일시</label>
            <input type="datetime-local" id="endDate" name="endDate" value={createData.endDate} onChange={(e) => handleInputChange(e, setCreateData)} required></input>
            </div>

            <div className="form-group">
            <label htmlFor="target">대상</label>
            <input type="text" id="target" name="target" value={createData.target} onChange={(e) => handleInputChange(e, setCreateData)}></input>
            </div>

            <div className="form-group">
            <label htmlFor="capacity">인원</label>
            <input type="number" id="capacity" name="capacity" min="1" value={createData.capacity} onChange={(e) => handleInputChange(e, setCreateData)}></input>
            </div>

            <div className="form-group">
            <label htmlFor="filePath">파일 경로</label>
            <input type="text" id="filePath" name="filePath" placeholder="/uploads/파일명.pdf" value={createData.filePath} onChange={(e) => handleInputChange(e, setCreateData)}></input>
            </div>

            <div className="form-group">
            <label htmlFor="realLocation">실제 위치</label>
            <input type="text" id="realLocation" name="realLocation" placeholder="서울특별시 강남구 ..." value={createData.realLocation} onChange={(e) => handleInputChange(e, setCreateData)}></input>
            </div>

            <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/document_board')}>취소</button>
            <button type="submit" className="btn-submit">등록</button>
            </div>
        </form>
        </section>
  </div>
  </div>
  )
}

export default DocumentCreate;