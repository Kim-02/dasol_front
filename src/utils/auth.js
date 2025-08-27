const API_BASE_URL = 'http://localhost:8080/api';

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
  /* const res = await fetchWithAuth(`${API_BASE_URL}/main/user_info`); */
  const res = await fetchWithAuth(`${API_BASE_URL}/user/profile`);

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
export async function fetchWithAuth(url, options = {}) {
  const at = localStorage.getItem('Authorization') || '';
  const rt = localStorage.getItem('rAuthorization') || '';

  // 기본 헤더 구성 (FormData면 Content-Type 자동 설정되므로 건드리지 않음)
  const baseHeaders = new Headers(options.headers || {});
  if (!baseHeaders.has('Content-Type') && !(options.body instanceof FormData)) {
    baseHeaders.set('Content-Type', 'application/json');
  }
  baseHeaders.set('Accept', 'application/json');
  if (at) baseHeaders.set('Authorization', at);
  if (rt) baseHeaders.set('rAuthorization', rt);

  const doFetch = async (headers) => {
    const res = await fetch(url, { ...options, headers });
    // 서버가 회신한 새 토큰 저장(성공/실패와 무관)
    const newAT = res.headers.get('Authorization');
    const newRT = res.headers.get('rAuthorization');
    if (newAT) localStorage.setItem('Authorization', newAT);
    if (newRT) localStorage.setItem('rAuthorization', newRT);
    return res;
  };

  // 1차 요청
  let res = await doFetch(baseHeaders);
  if (res.ok) return res;

  // 재시도 여부 판단
  let bodyText = '';
  try { bodyText = await res.clone().text(); } catch {}
  const expiredMsg = /jwt\s*expired|token\s*expired/i.test(bodyText);

  const gotNewTokens =
    !!res.headers.get('Authorization') || !!res.headers.get('rAuthorization');

  const shouldRetry =
    !options._retry && (res.status === 401 || expiredMsg || gotNewTokens);

  if (!shouldRetry) return res;

  // 저장된(혹은 방금 받은) 최신 토큰으로 1회 재시도
  const h2 = new Headers(options.headers || {});
  if (!h2.has('Content-Type') && !(options.body instanceof FormData)) {
    h2.set('Content-Type', 'application/json');
  }
  h2.set('Accept', 'application/json');
  const at2 = localStorage.getItem('Authorization') || '';
  const rt2 = localStorage.getItem('rAuthorization') || '';
  if (at2) h2.set('Authorization', at2);
  if (rt2) h2.set('rAuthorization', rt2);

  return fetch(url, { ...options, headers: h2, _retry: true });
}
