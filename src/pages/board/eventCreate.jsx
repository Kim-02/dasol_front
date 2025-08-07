import React,{ useState, useEffect } from "react";
import './documentBoard.css'
import { loadUserInfo } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown, handleInputChange } from "../../utils/boardUtils";
import { handleSubmit } from "../../utils/eventUtils";

function EventCreate(){
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownboard, setDropdownBoard] = useState(false);
    const [dropdownApproval, setDropdownApproval] = useState(false);
    const navigate = useNavigate();
    const [prizes, setPrizes] = useState([{ prizeId: '', prizeName: '', prizePrice: '' }]);
    const [allowDupli, setAllowDupli] = useState(false);

    const [createData, setCreateData] = useState({
        title: '',
        content: '',
        startDate: '',
        endDate: '',
        target: '',
        capacity: '',
        notice: true,
        payAmount: '',
        prizes: prizes
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
            /* navigate('/'); */
        });

    }, []);

    const handlePrizeChange = (e, index) => {
        const {name, value} = e.target;
        setPrizes(prev => {
            const updated = [...prev];
            updated[index][name] = name === 'prizePrice' ? Number(value) : value;
            return updated;
        });
    };

    const addPrize = () => {
        setPrizes(prev => [...prev, {prizeId: '', prizeName: '', prizePrice: ''}]);
    };

    const removePrize = (index) => {
        setPrizes(prev => prev.filter((_, i) => i !== index));
    };
    
    const handleAllowDuplicateChange = (e) => {
        setAllowDupli(e.target.checked);
    }

  return (
    <div className="main-wrapper">
        <nav className="sidebar">
            <ul>
            <li><Link to="/main" className="sidebar-link">대시보드</Link></li>
            {/* 게시판 드롭다운 */}
            <li className="dropdown">
                <div className="dropdown-toggle" onClick={() => toggleDropdown(setDropdownBoard)}>게시판 <span className="arrow">
                    {dropdownboard ? "▲" : "▼"}</span>
                </div>
                {dropdownboard && (
                    <ul className={`dropdown-menu ${dropdownboard ? 'show' : ''}`}>
                        <li><Link to="/document_board">문서게시판</Link></li>
                        <li><Link to="/event_board">이벤트게시판</Link></li>
                        <li><Link to="/inquiry_board.html">문의게시판</Link></li>
                    </ul>
                )}
            </li>
            {/* 결재 드롭다운 */}
            <li className="dropdown">
                <div className="dropdown-toggle" onClick={() => toggleDropdown(setDropdownApproval)}>결재<span className="arrow">
                    {dropdownApproval ? "▲" : "▼"}</span>
                </div>
                {dropdownApproval && (
                    <ul className={`dropdown-menu ${dropdownApproval ? 'show' : ''}`}>
                        <li><Link to="/approval_request" className="sidebar-link">결재 신청</Link></li>
                        <li><Link to="/approval_process" className="sidebar-link">결재 처리</Link></li>
                    </ul>
                )}
            </li>
            <li><Link to="/monthly_summary" className="sidebar-link">월별 결산</Link></li>
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

        {/* 본문: 새 이벤트 작성 폼 */}
        <section className="content">
        <div className="board-header">
            <h1>새 이벤트 작성</h1>
            <button className="btn-create" onClick={() => navigate('/event_board')}>목록으로</button>
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
            <label htmlFor="notice">공지 사항 여부</label>
            <input type="checkbox" id="notice" name="notice" checked={createData.notice} onChange={(e) => setCreateData(prev => ({...prev, notice: e.target.checked}))}></input>
            </div>

            <div className="form-group">
            <label htmlFor="payAmount">참가비</label>
            <input type="number" id="payAmount" name="payAmount" min="0" value={createData.payAmount} onChange={(e) => handleInputChange(e, setCreateData)}></input>
            </div>

            <form>
            <div className="form-group">
                <label htmlFor="selectDuplicate">상품 중복 선택 허용</label>
                <input type="checkbox" checked={allowDupli} onChange={handleAllowDuplicateChange} />
            </div>

            <div className="form-group">
                <label>상품</label>

                {prizes.map((prize, index) => (
                    <div key={index} className="prize-row">
                        <input type="text" name="prizeName" placeholder="상품명" value={prize.prizeName} onChange={(e) => handlePrizeChange(e, index)} />
                        <input type="number" name="prizePrice" placeholder="가격" value={prize.prizePrice} onChange={(e) => handlePrizeChange(e, index)} />
                        <input type="text" name="prizeId" placeholder="상품 고유 ID" value={prize.prizeId} onChange={(e) => handlePrizeChange(e, index)} />
                        <button type="button" onClick={() => removePrize(index)}>-</button>
                    </div>
                    
                ))}

                <button type="button" onClick={addPrize}>+</button>
            </div>


            <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate('/event_board')}>취소</button>
            <button type="submit" className="btn-submit">등록</button>
            </div>
            </form>
        </form>
        </section>
  </div>
  </div>
  )
}

export default EventCreate;