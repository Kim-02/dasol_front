import React,{ useState, useEffect, useRef, useCallback } from "react";
import './approval.css'
import './depart.css'
import { loadUserInfo, fetchWithAuth } from "../../utils/auth";
import { useNavigate, Link} from "react-router-dom";
import { handleLogout, toggleDropdown} from "../../utils/boardUtils";

const API_BASE_URL_RE = 'http://3.34.245.155/api';

function ApprovalRequest() {
    const [userInfo, setUserInfo] = useState("로딩 중...");
    const [dropdownboard, setDropdownBoard] = useState(false); 
    const [dropdownApproval, setDropdownApproval] = useState(false);
    const navigate = useNavigate();

    const orgChartRef = useRef(null);
    const formRef = useRef();
    const [deptData, setDeptData] = useState(null);
    const [selectedApprovers, setSelectedApprovers] = useState(new Map())
    const [orgChartReady, setOrgChartReady] = useState(false);
    const [showDeptModal, setShowDeptModal] = useState(false);

    useEffect(() => {
        // 페이지 로드 시 정보 가져옴
        loadUserInfo()
        .then(result => {
            if (!result) throw new Error("사용자 정보 없음");
            setUserInfo(`${result.name || '이름 없음'} (${result.studentId || '학번 없음'})`);

            if (window.google && window.google.charts){
                window.google.charts.load('current', { packages: ['orgchart'] });
                window.google.charts.setOnLoadCallback(() => setOrgChartReady(true));
            }
        })
        .catch(err => {
            alert("로그인이 필요함");
            /* navigate('/'); */
        });

    }, []);
    

    async function loadDeptData() {
        if (!deptData){
            try {
                const res = await fetchWithAuth(`${API_BASE_URL_RE}/department/tree`);
                const body = await res.json();
                if(!res.ok) throw new Error(body.message || res.statusText);
                setDeptData(body.result);
            } catch (err) {
                alert ('부서 트리 로드 실패' + err.message);
            }
        } else {
            drawOrgChart(deptData);
        }
    }

    const drawOrgChart = useCallback((data) => {
        const dataTable = new window.google.visualization.DataTable();
          dataTable.addColumn('string', 'id');
          dataTable.addColumn('string', 'manager');
          dataTable.addColumn('string', 'tooltip');

          const rows = [];
          function traverse(node, parentId){
            if (node.leaf){
                const id = String(node.leaf.memberId);
                rows.push([
                    {v: id, f: `<div class="node-label" data-id="${id}">${node.leaf.name}</div>`},
                    parentId,
                    node.leaf.name
                ]);
                parentId = id;
            }
            (node.children || []).forEach(c => {
                const id = String(c.memberId);
                rows.push([
                    {v: id, f: `<div class="node-label" data-id="${id}">${c.name}</div>`},
                    parentId,
                    c.name
                ]);
            });
            (node.nodes || []).forEach(sub => traverse(sub, parentId));
          }
          traverse(data, '');
          dataTable.addRows(rows);

          /* Org차트 그리기 */
          orgChartRef.current = new window.google.visualization.OrgChart(document.getElementById('deptChart'));
          orgChartRef.current.draw(dataTable, {
            allowHtml: true,
            nodeClass: 'google-visualization-orgchart-node'
          });

          /* 클릭 이벤트 리스너 */
          window.google.visualization.events.addListener(orgChartRef.current, 'select', () => {
              const sel = orgChartRef.current.getSelection();
              if (!sel.length) return;

              const row      = sel[0].row;
              const memberId = dataTable.getValue(row, 0);
              const labelDiv = document.querySelector(`.node-label[data-id="${memberId}"]`);
              if (!labelDiv) return;

              const td = labelDiv.closest('td.google-visualization-orgchart-node');
              if (!td) return;

              setSelectedApprovers(prev => {
                const updatedMap = new Map(prev);
                if (td.classList.contains('selected')) {
                    td.classList.remove('selected');
                    updatedMap.delete(memberId);
                } else {
                    td.classList.add('selected');
                    updatedMap.set(memberId, dataTable.getValue(row, 2));
                }
                return updatedMap;
              });              
          });
    },[setSelectedApprovers]);

    useEffect(() => {
        if (orgChartReady && deptData) {
            drawOrgChart(deptData);
        }
    }, [orgChartReady, deptData, drawOrgChart]);

    function handleDeptModalOpen(){
        loadDeptData();
        setShowDeptModal(true);
    }

    function handleDeptModalClose(){
        setShowDeptModal(false);
    }

    function confirmDeptSelection(){
        handleDeptModalClose();
    }

    async function submitApproval(e){
        e.preventDefault();
        const form = formRef.current;
        const file = form.receiptFile.files[0];

        if (!file || !file.name.match(/\.(jpe?g)$/i)){
            alert('영수증은 JPG 파일만 업로드 가능합니다.');
            return;
        }

        const formData = new FormData(form);
        selectedApprovers.forEach((_, id) => {
            formData.append('approversId', id);
        });

        try{
            const res = await fetchWithAuth(`${API_BASE_URL_RE}/approval/post`, {
                method: 'POST',
                body: formData
            });

            const body = await res.json();
            if(!res.ok) throw new Error(body.message || res.statusText);
            alert('결재 요청 성공: ' + body.message);
            form.reset();
            setSelectedApprovers(new Map());

            document.querySelectorAll('.google-visualization-orgchart-node.selected').forEach(td => td.classList.remove('selected'));
        } catch (err){
            alert('결재 요청 실패' + err.message);
        }
    }

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

                <section className="content">
                <div className="board-header">
                    <h1>결재 신청</h1>
                </div>

                <form id="approvalForm" className="modal-body" ref={formRef} onSubmit={submitApproval}>
                    <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input type="text" id="title" name="title" required />
                    </div>
                    <div className="form-group">
                    <label htmlFor="accountNumber">계좌번호</label>
                    <input type="text" id="accountNumber" name="accountNumber" required />
                    </div>
                    <div className="form-group">
                    <label htmlFor="payerName">입금자명</label>
                    <input type="text" id="payerName" name="payerName" required />
                    </div>
                    <div className="form-group">
                    <label htmlFor="requestAmount">요청 금액</label>
                    <input type="number" id="requestAmount" name="requestAmount" required />
                    </div>
                    <div className="form-group">
                    <label htmlFor="requestDate">요청 일시</label>
                    <input type="datetime-local" id="requestDate" name="requestDate" required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="approvalCode">결재 코드</label>
                        <select id="approvalCode" name="approvalCode" defaultValue="" required>
                            <option value="" disabled>선택하세요</option>
                            <option value="210">사무용품비</option>
                            <option value="220">출장비</option>
                            <option value="230">업무추진비</option>
                            <option value="240">부서별활동비</option>
                            <option value="310">정기사업비</option>
                            <option value="320">공약사업비</option>
                            <option value="330">대규모사업비</option>
                            <option value="510">활동지원비</option>
                            <option value="530">학생지원비</option>
                            <option value="610">환불금</option>
                            <option value="620">비상금</option>
                            <option value="710">수수료</option>
                    </select>
                    </div>
                    <div className="form-group">
                    <label htmlFor="requestDetails">요청 사유</label>
                    <textarea id="requestDetails" name="requestDetails" rows="4" required></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="receiptFile">영수증 첨부 (JPG만 가능)</label>
                        <input
                            type="file"
                            id="receiptFile"
                            name="receiptFile"
                            accept=".jpg, .jpeg"
                            required
                        />
                    </div>
                <div className="form-group">
                    <label>승인자 선택</label>
                    <button type="button" className="btn-search" onClick={handleDeptModalOpen}>승인자 선택</button>
                    <div id="selectedApprovers" className="selected-list">
                        {[...selectedApprovers.values()].map((name, i) => (
                            <div key={i} className="selected-item">{name}</div>
                        ))}
                    </div>
                </div>
                <div className="form-actions">
                    <button type="submit" className="btn-submit">신청하기</button>
                </div>
                </form>
                </section>
                
                {/* 조직도 모달 */}
                <div id="deptModal" className={`modal ${showDeptModal ? 'show' : ''}`}>
                <div className="modal-content">
                <div className="modal-header">
                    <h2>승인자 선택</h2>
                    <span className="close" onClick={handleDeptModalClose}>×</span>
                </div>
                <div className="modal-body">
                    {/* OrgChart를 그릴 곳 */}
                    <div id="deptChart" style={{overflow: 'auto', height: '400px'}}></div>
                </div>
                <div className="form-actions" style={{padding: '1rem'}}>
                    <button className="btn-cancel" onClick={handleDeptModalClose}>취소</button>
                    <button className="btn-submit" onClick={confirmDeptSelection}>확인</button>
                </div>
            </div>
        </div>
    </div>
    </div>
    );
}

export default ApprovalRequest;