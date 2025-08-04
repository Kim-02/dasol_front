import React,{ useState, useEffect } from "react";
import './approval.css'
import './depart.css'
import { loadUserInfo, fetchWithAuth } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown} from "../../utils/boardUtils";

const API_BASE_URL_APPROVAL = 'http://3.34.245.155/api/approval';

function ApprovalProcess(){
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [canApproveSet, setCanApproveSet] = useState(new Set());
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 페이지 로드 시 정보 가져옴
        loadUserInfo()
        .then(result => {
            if (!result) throw new Error("사용자 정보 없음");
            setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`);

            loadRequests();
        })
        .catch(err => {
            alert("로그인이 필요함");
            /* navigate('/'); */
        });

    }, []);

    async function loadRequests(){
        setLoading(true);
        try{
            const [allRes, authRes] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL_APPROVAL}/getAllRequest`),
                fetchWithAuth(`${API_BASE_URL_APPROVAL}/getAcceptPost`),
            ]);
    
            const allJson = await allRes.json();
            const authJson = await authRes.json();
    
            if(!allRes.ok) throw new Error(allJson.message || allRes.statusText);
            if(!authRes.ok) throw new Error(authJson.message || authRes.statusText);
    
            const all = allJson.result;
            const auth = new Set(authJson.result.requests.map(r => String(r.requestId)));
    
            setRequests(all);
            setCanApproveSet(auth);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function openDetailModal(request){
        setSelectedRequest(request);
    }
    
    function closeDetailModal(){
        setSelectedRequest(null);
    }
    
    async function submitDecision(approved){
        if (!selectedRequest) return;
    
        try {
            const form = new FormData();
            form.append('postId', selectedRequest.requestId);
            form.append('approved', approved.toString());
    
            const res = await fetchWithAuth(`${API_BASE_URL_APPROVAL}/postAccept`, {
                method: 'POST',
                body: form,
            });
    
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || res.statusText);
    
            alert('승인 처리되었습니다.');
            closeDetailModal();
            loadRequests();
        } catch (err){
            alert ('처리 실패: ' + err.message);
        }
    }

    function escapeHtml(text){
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    return (
        <div className="main-wrapper">
            {/*사이드바*/}
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
                <section className="content">
                    <div className="board-header">
                        <h1>결재 처리</h1>
                    </div>
                    <div className="posts-container">
                        <div className="posts-header">
                        <div>제목</div>
                        <div>요청금액</div>
                        <div>분류</div>
                        <div>완료 여부</div>
                        </div>
                        <div id="approvalList" className="posts-list">
                            {loading ? (
                                <div className="loading">결재 요청 목록을 불러오는 중...</div>
                            ): error ?(
                                <div className="empty-state">오류: {error}</div>
                            ) : requests.length === 0 ? (
                                <div className="empty-state">결재 요청이 없음</div>
                            ) : (
                                requests.map(r => (
                                    <div key={r.requestId} className="post-row" onClick={() => openDetailModal(r)}>
                                        <div>{escapeHtml(r.title)}</div>
                                        <div>{Number(r.requestedAmount).toLocaleString()}원</div>
                                        <div>{escapeHtml(r.approvalCode)}</div>
                                        <div className="col-completed">
                                            <input type="checkbox" checked={r.isCompleted} readOnly />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </section>
                
                {selectedRequest && (
                    <div className="modal">
                        <div className="modal-content">
                        <div className="modal-header">
                            <h2>요청 상세</h2>
                            <span className="close" onClick={closeDetailModal}>×</span>
                        </div>
                        <div className="modal-body">
                            <div className="form-group"><label>제목</label><div>{escapeHtml(selectedRequest.title)}</div></div>
                            <div className="form-group"><label>요청금액</label><div>{Number(selectedRequest.requestedAmount).toLocaleString()}원</div></div>
                            <div className="form-group"><label>분류</label><div>{escapeHtml(selectedRequest.approvalCode)}</div></div>
                            <div className="form-group"><label>계좌번호</label><div>{selectedRequest.accountNumber}</div></div>
                            <div className="form-group"><label>요청입금자명</label><div>{selectedRequest.payerName}</div></div>
                            <div className="form-group"><label>상세정보</label><div>{selectedRequest.requestDetail}</div></div>
                            <div className="form-group"><label>완료 여부</label>
                                <input type="checkbox" checked={selectedRequest.isCompleted} readOnly />
                            </div>
                            <div className="form-group"><label>완료 일시</label><div>{selectedRequest.approvalDate || ''}</div></div>
                            <div className="form-group"><label>승인자</label><div>{(selectedRequest.approvers || []).map(a => a.name).join(', ') || '없음'}</div></div>
                            <div className="form-group"><label>영수증</label>
                                {selectedRequest.byteFile ? (
                                    <img src={`data:image/jpeg;base64,${selectedRequest.byteFile}`} alt="receipt" style={{ maxWidth:'100%', border : '1px solid #ccc'}} />
                                ) : (
                                    <div>영수증 없음</div>
                                )}
                            </div>
                        </div>
                        <div className="form-actions">
                            <button className="btn-cancel" onClick={closeDetailModal}>닫기</button>
                            {canApproveSet.has(String(selectedRequest.requestId)) && !selectedRequest.isCompleted && (
                                <button className="btn-submit" onClick={() => submitDecision(true)}>승인</button>
                            )}
                        </div>
                        </div>
                        </div>
                )}
            </div>
        </div>
    )
}

export default ApprovalProcess;