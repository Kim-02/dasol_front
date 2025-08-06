import { fetchWithAuth } from "./auth.js";

const API_BASE_URL_EVENT = 'http://3.34.245.155/api/event_post';

/* 이벤트 게시판 관련 function */

/* 이벤트 불러오기 */
export async function loadEvents(setLoading, setEvents) {
    setLoading(true);
    try{
        const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/getAllEvent`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);
        setEvents(body.result);
    } catch(err){
        console.error('게시글 불러오기 오류:', err.message);
    } finally{
        setLoading(false);
    }
}

/* Event 조회 -> 이벤트 게시판 클릭 시 함수 실행 */
export async function handleView(postId, setViewEvent, setEditMode, setShowModal){
    try {
        const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/posts/get/${postId}`);
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);
        setViewEvent(body.result);
        setEditMode(false);
        setShowModal(true);
    } catch (err){
        alert('상세 조회 실패: ' + err.message);
    }
}

/* Event 수정 */
export async function handleSave(viewEvent, setShowModal, setViewEvent, setLoading, setEvents){
    try{
        const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/posts/${viewEvent.id}`, {
            method: 'PATCH',
            body: JSON.stringify(viewEvent),
        });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || res.statusText);
    alert('수정 완료');
    setShowModal(false);
    setViewEvent(null);
    await loadEvents(setLoading, setEvents);
    } catch(err){
        alert('수정 실패: ' + err.message);
    }
}

/* Event 생성 */
export async function handleSubmit(e, navigate, createData){
    e.preventDefault();
    // 폼 데이터 수집
    const dto = {
        ...createData,
        title : createData.title.trim(),
        content : createData.content.trim(),
        target : createData.target.trim() || null,
        capacity : createData.capacity || null,
        notice : createData.notice,
        payAmount : createData.payAmount.trim() || null
        // studentId는 백엔드에서 SecurityGuardian으로 설정됩니다.
    };
    try {
        const res = await fetchWithAuth(`${API_BASE_URL_EVENT}/create`, {
            method: 'POST',
            body: JSON.stringify(dto)
        });
        const result = await res.json();
        if (res.ok) {
            alert(`등록 성공: ${result.message}`);
            navigate('/event_board');
        } else {
            alert(`등록 실패: ${result.message || res.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert('네트워크 오류가 발생했습니다.');
    }
};