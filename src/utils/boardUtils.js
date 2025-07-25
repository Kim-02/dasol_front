import { doLogout} from "./auth.js"

const API_BASE_URL = 'http://3.34.245.155/api/document';

export async function handleLogout(navigate){
    await doLogout();
    navigate("/");
}

export function toggleDropdown(setDropdownOpen){
    setDropdownOpen(prev => !prev);
}

/* 게시판 불러오기 */
export async function loadPosts(setLoading, setPosts) {
    setLoading(true);
    try{
        const res = await fetch(`${API_BASE_URL}/getAllPost`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('Authorization'),
                'rAuthorization': localStorage.getItem('rAuthorization'),
            },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);
        setPosts(body.result);
    } catch(err){
        console.error('게시글 불러오기 오류:', err.message);
    } finally{
        setLoading(false);
    }
}

/* DocumentPost 조회 -> 게시판 클릭 시 함수 실행 */
export async function handleView(postId, setViewPost, setEditMode, setShowModal){
    try {
        const res = await fetch(`${API_BASE_URL}/posts/get/${postId}`,{
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('Authorization'),
                'rAuthorization': localStorage.getItem('rAuthorization'),
            },
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || res.statusText);
        setViewPost(body.result);
        setEditMode(false);
        setShowModal(true);
    } catch (err){
        alert('상세 조회 실패: ' + err.message);
    }
}

/* DocumentPost 수정 */
export async function handleSave(viewPost, setShowModal, setViewPost, setLoading, setPosts){
    try{
        const res = await fetch(`${API_BASE_URL}/posts/${viewPost.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('Authorization'),
                'rAuthorization': localStorage.getItem('rAuthorization'),
        },
        body: JSON.stringify(viewPost),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || res.statusText);
    alert('수정 완료');
    setShowModal(false);
    setViewPost(null);
    await loadPosts(setLoading, setPosts);
    } catch(err){
        alert('수정 실패: ' + err.message);
    }
}

export function handleInputChange(e, setState){
    const {name, value} = e.target;
    setState((prev) => ({
        ...prev,
        [name]: name === 'capacity' ? Number(value) : value,
    }));
}

export function cancelEdit(setEditMode){
    setEditMode(false);
}

/* DocumentPost 생성 */
export async function handleSubmit(e, navigate, createData){
    e.preventDefault();
    // 폼 데이터 수집
    const dto = {
        ...createData,
        title : createData.title.trim(),
        content : createData.content.trim(),
        target : createData.target.trim() || null,
        capacity : createData.capacity || null,
        filePath : createData.filePath.trim() || null,
        realLocation : createData.realLocation.trim() || null
        // studentId는 백엔드에서 SecurityGuardian으로 설정됩니다.
    };
    try {
        const res = await fetch(`${API_BASE_URL}/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': localStorage.getItem('Authorization'),
                'rAuthorization': localStorage.getItem('rAuthorization')
            },
            body: JSON.stringify(dto)
        });
        const result = await res.json();
        if (res.ok) {
            alert(`등록 성공: ${result.message}`);
            navigate('/documentBoard');
        } else {
            alert(`등록 실패: ${result.message || res.statusText}`);
        }
    } catch (err) {
        console.error(err);
        alert('네트워크 오류가 발생했습니다.');
    }
};