const API_BASE_URL = 'http://3.34.245.155/api';

// 로그인
export async function doLogin(studentID, password){
    // 기존 토큰 삭제
    localStorage.removeItem('Authorization');
    localStorage.removeItem('rAuthorization');

    const payload = {studentID: studentID.trim(), password};

    // 로그인 요청
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    });

    // (A) CORS 환경이면, 서버에서 이 헤더들을 노출해 주어야 함
    // Authorization, rAuthorization

    if (!res.ok){
        const err = await res.json().catch(_ => ({message: res.statusText}));
        throw new Error(err.message);
    }

    // 헤더에서 토큰 꺼내기
    const accessToken = res.headers.get('Authorization');   // "Bearer eyJ..."
    const refreshToken = res.headers.get('rAuthorization'); // "Bearer 36218..."

    if (!accessToken){
        throw new Error('서버가 accessToken을 반환하지 않았습니다.');
    }

    // 로컬 스토리지에 저장
    localStorage.setItem('Authorization', accessToken);
    localStorage.setItem('rAuthorization', refreshToken);

    // 로그인 성공
    return true;
}


// 회원가입
export async function doSignup(body){
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    });

    const result = await res.json();
    if (!res.ok){
        alert(result.message || '회원가입 실패');
    }

    return result;
}

// 사용자 정보 로드, 토큰 없으면 loginPage로 리다이렉트
export async function loadUserInfo(){
  const res = await fetchWithAuth(`${API_BASE_URL}/main/user_info`);

  if (!res.ok){
    if (res.status === 401){
      throw new Error("인증 오류, 로그인이 필요함");
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }

  const json = await res.json();
  return json.result;
}

// 로그아웃
export async function doLogout(){
  try{
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization':  localStorage.getItem('Authorization'),
        'rAuthorization': localStorage.getItem('rAuthorization')
      }
    });
  } catch (_){

  } finally{
    localStorage.removeItem('Authorization');
    localStorage.removeItem('rAuthorization');
  }

}

// 헤더에 토큰 두개 정보 담기
// 토큰 만료 에러 시 다른 토큰을 통해 다시 접근 시도
export async function fetchWithAuth(url, options = {}){  
  const accessToken = localStorage.getItem('Authorization');
  const refreshToken = localStorage.getItem('rAuthorization');

  const headers = {
    'Content-Type':   'application/json',
    'Authorization':  accessToken,
    'rAuthorization': refreshToken,
    ...options.headers,
  };
  
  const res = await fetch(url, {...options, headers});

  const newAccessToken = res.headers.get('Authorization');
  const newRefreshToken = res.headers.get('rAuthorization');

  if (newAccessToken) setItem('Authorization', newAccessToken);
  if (newRefreshToken) setItem('rAuthorization', newRefreshToken);

  // _retry는 재시도 플래그
  if (res.status === 401 && !options._retry){
    return fetchWithAuth(url, {...options, _retry : true});
  }

  return res;
}