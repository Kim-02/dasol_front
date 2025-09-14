import React, {useRef, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import styles from "./login.module.css"
import { fetchWithAuth } from "../../utils/auth";

const API_BASE = "https://3.34.245.155/api";
function Login(){
    const navigate = useNavigate();
    const [form, setForm] = useState({
        studentId: "",
        password: "",
        remember: false
    });
    const [errors, setErrors] = useState({});
    const [toasts, setToasts] = useState([]);
    const pwInputRef = useRef(null);

    const showToast = (msg, danger = false) => {
        const id = crypto?.randomUUID?.() ?? String(Date.now() + Math.random());
        setToasts((prev) => [...prev, {id, msg, danger}]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 1600);
    }
    const onChange = (e) => {
        const {name, type, value, checked} = e.target;
        setForm((prev) => ({...prev, [name]: type === "checkbox" ? checked: value}));
        setErrors((prev) => ({...prev, [name]: ""}));
    };

    const togglePw = () => {
        const el = pwInputRef.current;
        if(!el) return;
        el.type = el.type === "password" ? "text" : "password";
    };

    const validate = () => {
    const next = {};
    if (!/^\d{10}$/.test(form.studentId)) next.studentId = "학번은 숫자 10자리입니다.";
    if (!form.password) next.password = "비밀번호를 입력하세요.";
    setErrors(next);
    return Object.keys(next).length === 0;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            studentId: form.studentId.trim(),
            password: form.password,
            remember: form.remember
        };

        const btn = document.getElementById("loginBtn");
        const prev = btn?.textContent;
        if (btn) {btn.textContent = "처리 중..."; btn.disabled = true;}

        try {
            const res = await fetchWithAuth(`${API_BASE}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('로그인 실패');
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            if(payload.remember) localStorage.setItem('refreshToken', data.refreshToken);
            navigate('/main');

            console.log('POST 로그인 경로', payload);
            showToast('로그인 성공');
        } catch (err){
            console.error(err);
            showToast('아이디 또는 비밀번호가 올바르지 않습니다.', true);
        } finally{
            if (btn) {btn.textContent = prev; btn.disabled = false; }
        }
    };

    return (
    <div className={styles.auth}>
      <section className={styles.card} aria-labelledby="loginTitle">
        <header>
          <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
          <div className={styles.subline} id="loginTitle">로그인</div>
        </header>

        <div className={styles.body}>
          <form id="loginForm" className={styles.stack} onSubmit={handleSubmit}>
            {/* 학번 */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="studentId">학번</label>
              <input
                id="studentId"
                name="studentId"
                className={styles.input}
                placeholder="예: 2021136000"
                inputMode="numeric"
                maxLength={10}
                autoComplete="username"
                required
                value={form.studentId}
                onChange={onChange}
              />
              {!!errors.studentId && <div className={styles.error}>{errors.studentId}</div>}
            </div>

            {/* 비밀번호 */}
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">비밀번호</label>
              <div className={styles.row}>
                <input
                  id="password"
                  name="password"
                  className={`${styles.input} ${styles.grow}`}
                  type="password"
                  placeholder="비밀번호"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={onChange}
                  ref={pwInputRef}
                />
                <button className={styles.btn} type="button" onClick={togglePw} aria-label="비밀번호 보기">보기</button>
              </div>
              {!!errors.password && <div className={styles.error}>{errors.password}</div>}
            </div>

            {/* 옵션/링크 */}
            <div className={styles.row} style={{ justifyContent: 'space-between' }}>
              <label className={styles.row} style={{ gap: 8 }}>
                <input type="checkbox" id="remember" name="remember" checked={form.remember} onChange={onChange} />
                <span className={styles.hint}>자동 로그인</span>
              </label>
              <Link className={styles.link} to="/forgot">비밀번호 찾기</Link>
            </div>

            {/* 버튼 */}
            <div className={styles.row} style={{ marginTop: 12, gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="submit"
                id="loginBtn"
                className={`${styles.btn} ${styles['btn-primary']}`}  // 하이픈 클래스는 대괄호로
                style={{ minWidth: 120 }}
              >
                로그인
              </button>
            </div>
          </form>

          <div className={styles.divider} />

          <div className={styles.row} style={{ justifyContent: 'center', gap: 6 }}>
            <span className={styles.hint}>처음이신가요?</span>
            <Link className={styles.link} to="/signuppage">회원가입</Link>
          </div>
        </div>
      </section>

      {/* 토스트 */}
      {toasts.map((t) => (
        <Toast key={t.id} msg={t.msg} danger={t.danger} />
      ))}
    </div>
  );
}

function Toast({ msg, danger }) {
  return (
    <div
      className={`${styles.toast} ${styles.show} ${danger ? styles['toast-danger'] : ''}`}
      role="status"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}

export default Login;