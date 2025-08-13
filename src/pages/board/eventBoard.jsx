    import React,{ useState, useEffect } from "react";
    import './documentBoard.css'
    import { loadUserInfo, fetchWithAuth } from "../../utils/auth";
    import { useNavigate, Link} from "react-router-dom";
    import { handleLogout, toggleDropdown, handleInputChange, cancelEdit} from "../../utils/boardUtils";
    import { loadEvents, handleView, handleSave } from "../../utils/eventUtils";

    const API_BASE_URL_EVENT = 'http://3.34.245.155/api/event_post';
    const ALLOW_MULTI = null;

    function EventBoard(){
        const [userInfo, setUserInfo] = useState("로딩 중...");
        const [dropdownboard, setDropdownBoard] = useState(false); 
        const [dropdownApproval, setDropdownApproval] = useState(false);
        const navigate = useNavigate();

        const [searchEvents, setSearchEvents] = useState("");
        const [events, setEvents] = useState([]);
        const [loading, setLoading] = useState(true);
        const [viewEvent, setViewEvent] = useState(null);
        const [editMode, setEditMode] = useState(false);
        const [showModal, setShowModal] = useState(false);
        const [selectedPrizes, setSelectedPrizes] = useState([]);

        const [user, setUser] = useState(null);
        const [isAuthor, setIsAuthor] = useState(false);
        const [hasApplied, setHasApplied] = useState(false);

        const openEvent = (id) => {
            setSelectedPrizes([]);
            setHasApplied(false);
            setEditMode(false);
            handleView(id, setViewEvent, setEditMode, setShowModal);
        };

        const filteredEvents= events.filter(event => (event.title || '').toLowerCase().includes(searchEvents.toLowerCase()) || (event.content || '').toLowerCase().includes(searchEvents.toLowerCase()));

        useEffect(() => {
            // 페이지 로드 시 정보 가져옴
            loadUserInfo()
            .then(result => {
                if (!result) throw new Error("사용자 정보 없음");
                setUser(result);
                setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`);
            })
            .catch(err => {
                alert("로그인이 필요함");
                /* navigate('/'); */
            });

            loadEvents(setLoading, setEvents);
        }, []);

        useEffect(() => {
            if(!showModal || !viewEvent || !user) return;

            /* 게시글 작성자 확인 */
            const author = (viewEvent.memberId && user.memberId && viewEvent.memberId === user.memberId) || 
            (viewEvent.memberName && user.name && viewEvent.memberName === user.name);
            setIsAuthor(!!author);

            /* 해당 이벤트 신청 상태 조회 */
            (async () => {
                try {
                    /* 안되면 경로 수정 */
                    const res = await fetchWithAuth(/* `${API_BASE_URL_EVENT}/posts/participate` */);
                    if (!res.ok) throw new Error();
                    const data = await res.json();
                    setHasApplied(!!(data.result?.applied ?? data.applied));
                } catch {
                    setHasApplied(false);
                }
            })();
        }, [showModal, viewEvent, user]);

        const handlePrizeSelect = (item) => {
            const allowMulti = (ALLOW_MULTI ?? !!(viewEvent?.allowDupli ?? viewEvent?.allowDuplicate));
            setSelectedPrizes(prev => {
                const exists = prev.some(i => (i.id ?? i.itemName) === (item.id ?? item.itemName));
                if (allowMulti){
                    return exists ? prev.filter(i => (i.id ?? i.itemName) !== (item.id ?? item.itemName)) : [...prev, item];
                } else {
                    return exists ? [] : [item];
                }
            });
        };

        const handleApply = async () => {
            if (!viewEvent) return;
            if (!selectedPrizes.length) {alert('선택한 상품이 없음'); return;}
            const postId = viewEvent.postId ?? viewEvent.id;
            const itemIds = selectedPrizes.map(x => x.id).filter(id => id != null);
            if (itemIds.length === 0) {alert('선택한 상품에 id가 없습니다.'); return;}
            try {
                const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/posts/participate`, {
                    method: 'POST',
                    body: JSON.stringify({postId, itemIds}) ,
                });
                if (!res.ok) throw new Error();
                setHasApplied(true);
                alert('신청이 완료되었습니다.');
            } catch {
                alert('신청에 실패했습니다.')
            }
        };

        const handleCancelApply = async () => {
            if(!viewEvent) return;
            const postId = viewEvent.postId ?? viewEvent.id;
            try {
                const res = await fetchWithAuth(`http://3.34.245.155/api/user/event/leave/${postId}`, {
                    method: 'POST',
                });
                if(!res.ok) throw new Error();
                setHasApplied(false);
                setSelectedPrizes([]);
                alert('신청이 취소되었습니다.');
            } catch {
                alert('실패했습니다. 그냥 참여하세요.');
            }
        };

        const handleDelete = async () => {
            if(!viewEvent) return;
            const postId = viewEvent.postId ?? viewEvent.id;
            if (!confirm('정말 삭제하시겠습니가?')) return;
            try {
                const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/delete?post_id=${postId}`, {
                    method: 'DELETE'
                });
                if(!res.ok) throw new Error();
                setShowModal(false);
                setViewEvent(null);
                loadEvents(setLoading, setEvents);
                alert('삭제되었습니다.');
            } catch {
                alert('삭제 실패했습니다.');
            }
        };

        return(
            <div className="main-wrapper">
                {/*사이드바*/}
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

                    {/* 본문: 게시판 내용 */}
                    <section className="content">
                        <div className="board-header">
                            <h1>이벤트 게시판</h1>
                            <button className="btn-create" onClick={() => navigate('/event_create')}>이벤트 생성</button>
                        </div>

                    <div className="search-section">
                        <div className="search-box">
                        <input type="text" id="searchInput" value={searchEvents} onChange={(e) => setSearchEvents(e.target.value)} placeholder="제목 또는 내용으로 검색..."></input>
                        <button className="btn-search" onClick={() => {if (!searchEvents.trim()){alert("검색어를 입력하세요.")}}}>검색</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading">이벤트를 불러오는 중...</div>
                    ):(
                        <div className="events-container">
                            <div className="events-header">
                            <div className="col-title">제목</div>
                            <div className="col-author">작성자</div>
                            <div className="col-capacity">인원</div>
                            <div className="col-target">대상</div>
                            <div className="col-payAmount">참가비</div>
                            <div className="col-startdate">시작일시</div>
                            <div className="col-enddate">종료일시</div>
                        </div>
                        <div id="eventsList" className="events-list">
                            {filteredEvents.length === 0 ? (
                                <div className="no-data">등록된 이벤트가 없습니다.</div>
                            ) : filteredEvents.map(event => (
                                <div className="post-row" key={event.postId} onClick={() => openEvent(event.postId)}>
                                    <div className="col-title">{event.title}</div>
                                    <div className="col-author">{event.memberName}</div>
                                    <div className="col-capacity">{event.capacity}</div>
                                    <div className="col-target">{event.target}</div>
                                    <div className="col-payAmount">{event.payAmount}</div>
                                    <div className="col-startdate">{new Date(event.startDate).toLocaleString()}</div>
                                    <div className="col-enddate">{new Date(event.endDate).toLocaleString()}</div>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </section>

                {showModal && viewEvent &&(
                    <div className="modal">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2>{editMode ? '수정' : '상세 보기'}</h2>
                                <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                            </div>
                            <div className="modal-body">
                                {!editMode ? (
                                    <div>
                                        <p><strong>작성자:</strong> {viewEvent.memberName}</p>
                                        <p><strong>인원:</strong> {viewEvent.capacity}</p>
                                        <p><strong>대상:</strong> {viewEvent.target}</p>
                                        <p><strong>내용:</strong> {viewEvent.content}</p>
                                        <p><strong>시작일시:</strong> {new Date(viewEvent.startDate).toLocaleString()}</p>
                                        <p><strong>종료일시:</strong> {new Date(viewEvent.endDate).toLocaleString()}</p>
                                        <p><strong>참가비:</strong> {viewEvent.payAmount}</p>

                                        <p><strong>상품 목록:</strong></p>
                                            {Array.isArray(viewEvent.eventItem) && viewEvent.eventItem.length > 0 ? (
                                                <ul>
                                                {viewEvent.eventItem.map(item => (
                                                    <li key={item.id ?? item.itemName}>
                                                        <input type="checkbox" id={`item-${item.id ?? item.itemName}`} checked={selectedPrizes.some(i => (i.id ?? i.itemName) === (item.id ?? item.itemName))} onChange={() => handlePrizeSelect(item)} />
                                                        <label htmlFor={`item-${item.id ?? item.itemName}`}>{item.itemName} - {item.itemCost}원</label>
                                                    </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>상품 없음</p>
                                            )}

                                        <div className="modal-footer">
                                            {isAuthor ? (
                                                <>
                                                <button className="btn-edit" onClick={() => setEditMode(true)}>수정</button>
                                                <button className="btn-delete" onClick={handleDelete}>삭제</button>
                                                </>
                                            ) : (
                                                <>
                                                <button className="btn-apply" onClick={handleApply} disabled={hasApplied}>신청하기</button>
                                                <button className="btn-cancel" onClick={handleCancelApply} disabled={!hasApplied}>취소하기</button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <form>
                                        <div className="form-group">
                                            <label>제목</label>
                                            <input type="text" name="title" value={viewEvent.title} onChange={(e) => handleInputChange(e, setViewEvent)} required/>
                                        </div>
                                        <div className="form-group">
                                            <label>내용</label>
                                            <textarea name="content" value={viewEvent.content} onChange={(e) => handleInputChange(e, setViewEvent)} rows="4" required></textarea>
                                        </div>
                                        <div className="form-group">
                                            <label>시작일시</label>
                                            <input type="datetime-local" name="startDate" value={viewEvent.startDate ? viewEvent.startDate.slice(0, 16) : ''} onChange={(e) => handleInputChange(e, setViewEvent)} required/>
                                        </div>
                                        <div className="form-group">
                                            <label>종료일시</label>
                                            <input type="datetime-local" name="endDate" value={viewEvent.endDate ? viewEvent.endDate.slice(0, 16) : ''} onChange={(e) => handleInputChange(e, setViewEvent)} required/>
                                        </div>
                                        <div className="form-group">
                                            <label>대상</label>
                                            <input type="text" name="target" value={viewEvent.target} onChange={(e) => handleInputChange(e, setViewEvent)} />
                                        </div>
                                        <div className="form-group">
                                            <label>인원</label>
                                            <input type="number" name="capacity" value={viewEvent.capacity} onChange={(e) => handleInputChange(e, setViewEvent)} />
                                        </div>
                                        <div className="form-group">
                                            <label>참가비</label>
                                            <input type="number" name="payAmount" value={viewEvent.payAmount} onChange={(e) => handleInputChange(e, setViewEvent)} />
                                        </div>
                                        <div className="form-group">
                                            <label>공지사항 여부</label>
                                            <input type="checkbox" name="notice" checked={viewEvent.notice} onChange={(e) => setViewEvent(prev => ({...prev, notice: e.target.checked}))} />
                                        </div>
                                        <div className="form-action">
                                            <button type="button" className="btn-cancel" onClick={() => cancelEdit(setEditMode)}>취소</button>
                                            <button type="button" className="btn-submit" onClick={() => handleSave(viewEvent, setShowModal, setViewEvent, setLoading, setEvents)}>저장</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                </div>
            </div>
        );
    }

    export default EventBoard;