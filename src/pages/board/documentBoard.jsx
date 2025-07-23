import React,{ useState, useEffect } from "react";
import './documentBoard.css'
import { loadUserInfo } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown, loadPosts, handleView, handleSave, handleInputChange, cancelEdit} from "../../utils/boardUtils";


function DocumentBoard(){
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownOpen, setDropdownOpen] = useState(false); 
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewPost, setViewPost] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // 페이지 로드 시 정보 가져옴
        loadUserInfo()
        .then(result => {
            if (!result) throw new Error("사용자 정보 없음");
            setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`);
        })
        .catch(err => {
            alert("로그인이 필요함");
            navigate('/');
        });

        loadPosts(setLoading, setPosts);
    }, [navigate]);
    

    return(
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

                {/* 본문: 게시판 내용 */}
                <section className="content">
                    <div className="board-header">
                        <h1>문서게시판</h1>
                        <button className="btn-create" onClick={() => navigate('/document_create')}>새 문서 작성</button>
                    </div>

                <div className="search-section">
                    <div className="search-box">
                    <input type="text" id="searchInput" placeholder="제목 또는 내용으로 검색..."></input>
                    <button className="btn-search" onClick={() => alert("검색 아직 미구현")}>검색</button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading">게시글을 불러오는 중...</div>
                ):(
                    <div className="posts-container">
                        <div className="posts-header">
                        <div className="col-title">제목</div>
                        <div className="col-author">작성자</div>
                        <div className="col-capacity">인원</div>
                        <div className="col-target">대상</div>
                        <div className="col-startdate">시작일시</div>
                        <div className="col-enddate">종료일시</div>
                    </div>
                    <div id="postsList" className="posts-list">
                        {posts.length === 0 ? (
                            <div className="no-data">등록된 문서가 없습니다.</div>
                        ) : posts.map(post => (
                            <div className="post-row" key={post.id} onClick={() => handleView(post.id, setViewPost, setEditMode, setShowModal)}>
                                <div className="col-title">{post.title}</div>
                                <div className="col-author">{post.memberName}</div>
                                <div className="col-capacity">{post.capacity}</div>
                                <div className="col-target">{post.target}</div>
                                <div className="col-startdate">{new Date(post.startDate).toLocaleString()}</div>
                                <div className="col-enddate">{new Date(post.endDate).toLocaleString()}</div>
                            </div>
                        ))}
                        </div>
                    </div>
                )}
            </section>

            {showModal && viewPost &&(
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editMode ? '수정' : '상세 보기'}</h2>
                            <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            {!editMode ? (
                                <div>
                                    <p><strong>작성자:</strong> {viewPost.memberName}</p>
                                    <p><strong>인원:</strong> {viewPost.capacity}</p>
                                    <p><strong>대상:</strong> {viewPost.target}</p>
                                    <p><strong>내용:</strong> {viewPost.content}</p>
                                    <p><strong>시작일시:</strong> {new Date(viewPost.startDate).toLocaleString()}</p>
                                    <p><strong>종료일시:</strong> {new Date(viewPost.endDate).toLocaleString()}</p>
                                    <p><strong>파일경로:</strong> {viewPost.filePath}</p>
                                    <p><strong>실제위치:</strong> {viewPost.realLocation}</p>

                                    <div className="modal-footer">
                                        <button className="btn-edit" onClick={() => setEditMode(true)}>수정</button>
                                    </div>
                                </div>
                            ) : (
                                <form>
                                    <div className="form-group">
                                        <label>제목</label>
                                        <input type="text" name="title" value={viewPost.title} onChange={(e) => handleInputChange(e, setViewPost)} required/>
                                    </div>
                                    <div className="form-group">
                                        <label>내용</label>
                                        <textarea name="content" value={viewPost.content} onChange={(e) => handleInputChange(e, setViewPost)} rows="4" required></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label>시작일시</label>
                                        <input type="datetime-local" name="startDate" value={viewPost.startDate ? viewPost.startDate.slice(0, 16) : ''} onChange={(e) => handleInputChange(e, setViewPost)} required/>
                                    </div>
                                    <div className="form-group">
                                        <label>종료일시</label>
                                        <input type="datetime-local" name="endDate" value={viewPost.endDate ? viewPost.endDate.slice(0, 16) : ''} onChange={(e) => handleInputChange(e, setViewPost)} required/>
                                    </div>
                                    <div className="form-group">
                                        <label>대상</label>
                                        <input type="text" name="target" value={viewPost.target} onChange={(e) => handleInputChange(e, setViewPost)} />
                                    </div>
                                    <div className="form-group">
                                        <label>인원</label>
                                        <input type="number" name="capacity" value={viewPost.capacity} onChange={(e) => handleInputChange(e, setViewPost)} />
                                    </div>
                                    <div className="form-group">
                                        <label>파일경로</label>
                                        <input type="text" name="filePath" value={viewPost.filePath} onChange={(e) => handleInputChange(e, setViewPost)} />
                                    </div>
                                    <div className="form-group">
                                        <label>실제위치</label>
                                        <input type="text" name="realLocation" value={viewPost.realLocation} onChange={(e) => handleInputChange(e, setViewPost)} />
                                    </div>
                                    <div className="form-action">
                                        <button type="button" className="btn-cancel" onClick={() => cancelEdit(setEditMode)}>취소</button>
                                        <button type="button" className="btn-submit" onClick={() => handleSave(viewPost, setShowModal, setViewPost, loadPosts)}>저장</button>
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

export default DocumentBoard;