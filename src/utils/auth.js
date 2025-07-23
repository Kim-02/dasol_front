
// 로그인
export async function doLogin(studentID, password){
    // 기존 토큰 삭제
    localStorage.removeItem('Authorization');
    localStorage.removeItem('rAuthorization');

    const payload = {studentID: studentID.trim(), password};

    // 로그인 요청
    const res = await fetch('http://localhost:8081/api/auth/login', {
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
    const res = await fetch('http://localhost:8081/api/auth/signup', {
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
    const accessToken = localStorage.getItem('Authorization');
    const refreshToken = localStorage.getItem('rAuthorization');

    if (!accessToken){
        throw new Error("로그인 필요");
    }

    const res = await fetch('http://localhost:8081/api/main/user_info', {
    method: 'GET',
    headers: {
      'Content-Type':  'application/json',
      'Authorization':  accessToken,
      'rAuthorization': refreshToken
    }
  });

  if (res.status === 401) {
    throw new Error("인증 로유");
  }

  const json = await res.json();
  return json.result;
}

// 로그아웃
export async function doLogout(){
  try{
    await fetch("http://localhost:8081/api/auth/logout", {
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