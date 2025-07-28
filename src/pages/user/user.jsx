import React,{ useState, useEffect } from "react";
import './user.css'
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown} from "../../utils/boardUtils";
import { fetchWithAuth } from "../../utils/auth";

const API_BASE = 'http://3.34.245.155/api';

function UserPage(){
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false); 

    const [user, setUser] = useState(null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showCheckModal, setShowCheckModal] = useState(false);
    const [showChangeModal, setShowChangeModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        async function fetchUser(){
            try{
                const res = await fetchWithAuth(`${API_BASE}/user/profile`,);
                const json = await res.json();
                if (!res.ok) throw new Error(json.message || res.statusText);
                setUser(json.result);
            } catch (err){
                alert("회원 정보 불러오기 실패: " + err.message);
                /* navigate('/'); */
            }
        }

        async function fetchEvents(){
            try{
                const res = await fetchWithAuth(`${API_BASE}/user/event`,);
                const json = await res.json();
                
                if (!res.ok) throw new Error(json.message || res.statusText);
                setEvents(json.result || []);
            } catch(err){
                alert("이벤트 내역 불러오기 실패: " + err.message);
            } finally{
                setLoading(false);
            }
        }
        fetchUser();
        fetchEvents();
    }, []);

    const handleCheckPassword = async() => {
        if (!oldPassword) return alert('현재 비밀번호를 입력하세요.');
        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/password/check`,{
               method: 'POST' ,
               body: JSON.stringify({oldPassword}),
            });
            const json = await res.json();
            if(!res.ok) throw new Error(json.message);
            setShowCheckModal(false);
            setShowChangeModal(true);
            setNewPassword('');
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
            if(!res.ok) throw new Error(json.message);
            alert("비밀번호가 변경되었씁니다.");
            setShowChangeModal(false);
        } catch (err) {
            alert("비밀번호 변경 실패: " + err.message);
        }
    };

    return (
        <div className = "main-wrapper">
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
                        {user?.name ?? "로딩 중..."}
                    </div>
                    <button id="logoutBtn" className="logout-btn" onClick={() => handleLogout(navigate)}>로그아웃</button>
                </header>


                {/* 본문: 회원 정보 / 이벤트 참여 내역 */}
                <section className="content user-page">

                    {/* 1) 회원 정보 구역 */}
                    <section className="user-info-section">
                        <h2>회원 정보</h2>
                        <div className="field">
                        <label>이름:</label>
                        <span>{user?.name}</span>
                        </div>
                        <div className="field">
                        <label>학번:</label>
                        <span>{user?.studentId}</span>
                        </div>
                        <div className="field">
                        <label>전화번호:</label>
                        <span>{user?.phone}</span>
                        </div>
                        <div className="field">
                        <label>성별:</label>
                        <span>{user?.gender}</span>
                        </div>
                        <div className="field">
                        <label>학생회비 납부 여부:</label>
                        <input type="checkbox" disabled checked={user?.paidUser || false} />
                        </div>
                        <div className="field">
                        <label>이메일:</label>
                        <span>{user?.email}</span>
                        </div>
                        <div className="field">
                        <button id="changePasswordBtn" onClick={() => {
                            setOldPassword('');
                            setShowCheckModal(true);
                        }}>비밀번호 변경</button>
                        </div>
                    </section>

                    {/* 이벤트 참여 내역 구역 */}
                    <section className="user-events-section">
                        <h2>이벤트 참여 내역</h2>
                        {loading ? (
                            <div>로딩 중...</div>
                        ) : events.length === 0 ? (
                            <div className="no-events">참여한 이벤트가 없습니다.</div>
                        ) : (
                            events.map((ev, idx) => (
                                <div className="event-card" key={idx}>
                                    <div className="event-name">{escapeHtml(ev.postTitle)}</div>
                                    <div className="field">
                                        <label>납입 여부:</label>
                                        <input type="checkbox" className="event-paid" disabled checked={ev.eventPaidSuccess} />
                                    </div>
                                    <div className="field">
                                        <label>납부 금액:</label>
                                        <span className="event-amount">{ev.eventPayAmount ?? '-'}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </section>
                </section>
            </div>

            {/* 현재 비밀번호 확인 모달 */}
            {showCheckModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>현재 비밀번호 확인</h3>
                        <input type="password" placeholder="현재 비밀번호 입력" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                        <div className="modal-actions">
                        <button onClick={handleCheckPassword}>확인</button>
                        <button onClick={() => setShowCheckModal(false)}>취소</button>
                    </div>
                </div>
            </div>
            )}

            {/* 새 비밀번호 입력 모달 */}
            {showChangeModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>새 비밀번호 설정</h3>
                        <input type="password" placeholder="새 비밀번호 입력" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        <div className="modal-actions">
                            <button onClick={handleChangePassword}>변경</button>
                            <button onClick={() => setShowChangeModal(false)}>취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


export default UserPage;