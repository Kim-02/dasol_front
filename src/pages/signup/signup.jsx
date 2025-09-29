import React, {useState, useEffect, useRef, useMemo} from "react";
import styles from "./signup.module.css"
import {Link, useNavigate} from "react-router-dom";
import { fetchWithAuth } from "../../utils/auth";

const API_BASE = "https://kutcse.com";

function Signup(){
    const navigate = useNavigate();
    const [form, setForm] = useState({
        studentId: "",
        name: "",
        gender: "M",
        phone: "",
        email: "",
        verificationCode: "",
        password: "",
        password2: "",
    });

    /* 각 상황별 오류 메시지 */
    const [errors, setErrors] = useState({});

    /* consent state */
    const [consentGiven, setConsentGiven] = useState(false);
    const [policyOpen, setPolicyOpen] = useState(false);

    /* email verification flow */
    const [codeSectionShown, setCodeSectionShown] = useState(false);
    const [remain, setRemain] = useState(0); /* sec */
    const timerRef = useRef(null);

    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]); /* {id, msg, danger} */

    /* utils */
    const emailOk = (v) => /.+@.+\..+/.test(v||'');
    const phoneOk = (v) => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test((v||'').trim());
    const pwStrength = (v) => {
        let s=0;
        if((v||'').length>=8)s++;
        if(/[A-Z]/.test(v))s++;
        if(/[a-z]/.test(v))s++;
        if(/\d/.test(v))s++;
        if(/[^\w]/.test(v))s++;
        return s;
    };
    const mmss = (sec) => {
        const m=String(Math.floor(sec/60)).padStart(2,'0');
        const ss=String(sec%60).padStart(2,'0');
        return `${m}:${ss}`;
    };
    const showToast = (msg, danger = false) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, {id, msg, danger}]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 1600);
    };
    const pwStrengthLabel = useMemo(() => {
        const map = ['약','약','보통','보통','강','매우 강'];
        return `강도: ${map[pwStrength(form.password)]}`;
    }, [form.password]);

    useEffect(() => {
        if (remain <= 0){
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        return () => {
            if (timerRef.current){
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [remain]);

    const onChange = (e) => {
        const {name, value} = e.target;
        setForm((prev) => ({...prev, [name]: value}));
        /* name 필드 오류 초기화 */
        setErrors((prev) => ({...prev, [name]: ""}));
    };

    const handleOpenPolicy = () => setPolicyOpen(true);
    const handleClosePolicy = (agree) => {
        setPolicyOpen(false);
        if (agree) {
            setConsentGiven(true);
            showToast("개인정보 동의가 완료되었습니다");
        }
    };
    const startTimer = (sec) => {
        if(timerRef.current) clearInterval(timerRef.current);
        setRemain(sec);
        timerRef.current = setInterval(() => {
            setRemain((r) => {
                if (r <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    showToast("인증 유효시간이 만료되었습니다", true);
                    return 0;
                }
                return r-1;
            });
        }, 1000);
    };

    const handleSendCode = async () => {
        if(!consentGiven) {
            setErrors((e) => ({...e, consent: "약관 동의가 필요합니다."}));
            showToast("개인정보 동의 후 진행하세요", true);
            return;
        }
        if (!emailOk(form.email)){
            setErrors((e) => ({...e, email:"이메일 형식이 올바르지 않습니다."}));
            return;
        }
        /* TODO 실제 메일 전송 API */
        await fetchWithAuth (`${API_BASE}/auth/verify`, {
            method: 'POST',
            body: JSON.stringify({email: form.email})
        });

        setCodeSectionShown(true);
        showToast("인증코드를 전송했습니다.");
        startTimer(120);
    };

    const togglePw = () => {
        const el = document.getElementById("password");
        if(!el) return;
        el.type = el.type === "password" ? "text" : "password"
    };

    const validate = () => {
        const next = {};
        if (!/^\d{10}$/.test(form.studentId)) next.studentId = "학번은 숫자 10자리입니다.";
        if (!form.name.trim()) next.name = "이름을 입력하세요.";
        if (!phoneOk(form.phone)) next.phone = "전화번호 형식을 확인하세요.";
        if (!emailOk(form.email)) next.email = "이메일 형식을 확인하세요.";
        if ((form.password || "").length < 8) next.password = "8자 이상 입력하세요.";
        if (form.password !== form.password2) next.password2 = "비밀번호가 일치하지 않습니다.";
        if (!consentGiven) next.consent = "약관 동의가 필요합니다.";

        if(codeSectionShown) {
            if (remain <= 0) next.code = "인증코드 유효시간이 만료되었습니다.";
            if (!form.verificationCode || form.verificationCode.length < 6)
                next.code = "인증코드를 입력하세요."
        } else {
            next.code = "인증코드를 먼저 전송하세요.";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const payload = {
            studentId: form.studentId.trim(),
            password: form.password,
            gender: form.gender,
            email: form.email.trim(),
            phone: form.phone.trim(),
            name: form.name.trim(),
            personalInfoYn: true,
            verificationCode: form.verificationCode.trim(),
        };

        setSubmitting(true);
        try{
            /* TODO: 실제 가입 API */
            const res = await fetch(`${API_BASE}/auth/signup`, {
                method: 'POST',
                body: JSON.stringify(payload)});
                if (!res.ok) throw new Error('가입 실패');

            console.log("POST payload", payload);
            showToast("가입 요청을 전송했습니다.");
            navigate('/login');
        } catch (err){
            console.error(err);
            showToast("오류가 발생했습니다. 다시 시도하세요.", true);
        } finally{
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.auth}>
        <section className={styles.card} aria-labelledby="joinTitle">
            <header>
            <div className={styles.brand}>컴퓨터공학부 종합관리시스템</div>
            <div className={styles.subline}>회원가입</div>
            </header>
            <div className={styles.body}>
            <form id="joinForm" className={styles.stack} onSubmit={handleSubmit}>
                <div className={styles.field}>
                <label className={styles.label} htmlFor="studentId">학번</label>
                <input
                    id="studentId"
                    name="studentId"
                    className={styles.input}
                    placeholder="예: 2021136000"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={form.studentId}
                    onChange={onChange}
                />
                <div className={styles.hint}>숫자 10자리</div>
                {!!errors.studentId && <div className={styles.error}>{errors.studentId}</div>}
                </div>

                <div className={styles.field}>
                <label className={styles.label} htmlFor="name">이름</label>
                <input
                    id="name"
                    name="name"
                    className={styles.input}
                    placeholder="예: 홍길동"
                    required
                    value={form.name}
                    onChange={onChange}
                />
                {!!errors.name && <div className={styles.error}>{errors.name}</div>}
                </div>

                <div className={styles.field}>
                <label className={styles.label} htmlFor="genderM">성별</label>
                <div className={styles.row} role="radiogroup" aria-label="성별">
                    <label className={styles.row}>
                    <input
                        type="radio"
                        name="gender"
                        id="genderM"
                        value="M"
                        checked={form.gender === "M"}
                        onChange={onChange}
                    />
                    &nbsp;남
                    </label>
                    <label className={styles.row} style={{ marginLeft: 12 }}>
                    <input
                        type="radio"
                        name="gender"
                        id="genderF"
                        value="F"
                        checked={form.gender === "F"}
                        onChange={onChange}
                    />
                    &nbsp;여
                    </label>
                </div>
                </div>

                <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">전화번호</label>
                <input
                    id="phone"
                    name="phone"
                    className={styles.input}
                    placeholder="010-1234-5678"
                    inputMode="tel"
                    required
                    value={form.phone}
                    onChange={onChange}
                />
                {!!errors.phone && <div className={styles.error}>{errors.phone}</div>}
                </div>

                <div className={styles.field}>
                <label className={styles.label} htmlFor="email">이메일</label>
                <div className={styles.row}>
                    <input
                    id="email"
                    name="email"
                    className={`${styles.input} ${styles.grow}`}
                    placeholder="name@koreatech.ac.kr"
                    type="email"
                    required
                    value={form.email}
                    onChange={onChange}
                    />
                    <button
                    type="button"
                    id="sendCodeBtn"
                    className={styles.btn}
                    onClick={handleSendCode}
                    disabled={remain > 0}
                    >
                    {remain > 0 ? "재전송 대기" : "인증코드 전송"}
                    </button>
                </div>
                <div className={styles.hint}>학교 이메일 권장</div>
                {!!errors.email && <div className={styles.error}>{errors.email}</div>}
                </div>

                {codeSectionShown && (
                <div id="codeSection" className={styles.field}>
                    <label className={styles.label} htmlFor="verificationCode">인증코드</label>
                    <div className={styles.row}>
                    <input
                        id="verificationCode"
                        name="verificationCode"
                        className={`${styles.input} ${styles.grow}`}
                        placeholder="8자리 코드"
                        maxLength={8}
                        required
                        value={form.verificationCode}
                        onChange={onChange}
                    />
                    <div id="timer" className={styles.hint} aria-live="polite" style={{ minWidth: 72, textAlign: "right" }}>
                        {remain > 0 ? mmss(remain) : "만료"}
                    </div>
                    </div>
                    {!!errors.code && <div className={styles.error}>{errors.code}</div>}
                </div>
                )}

                <div className={styles.field}>
                <label className={styles.label} htmlFor="password">비밀번호</label>
                <div className={styles.row}>
                    <input
                    id="password"
                    name="password"
                    className={`${styles.input} ${styles.grow}`}
                    type="password"
                    placeholder="영문+숫자 8자 이상"
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={onChange}
                    />
                    <button className={styles.btn} type="button" onClick={togglePw} aria-label="비밀번호 보기">
                    보기
                    </button>
                </div>
                <div className={styles.hint} id="pwHint">{pwStrengthLabel}</div>
                {!!errors.password && <div className={styles.error}>{errors.password}</div>}
                </div>

                <div className={styles.field}>
                <label className={styles.label} htmlFor="password2">비밀번호 확인</label>
                <input
                    id="password2"
                    name="password2"
                    className={styles.input}
                    type="password"
                    autoComplete="new-password"
                    required
                    value={form.password2}
                    onChange={onChange}
                />
                {!!errors.password2 && <div className={styles.error}>{errors.password2}</div>}
                </div>

                <div className={styles.divider} />

                <div className={styles.field}>
                <div className={styles.row} style={{ justifyContent: "space-between", width: "100%" }}>
                    <div>
                    <div className={styles.hint}>개인정보 수집·이용 동의 상태</div>
                    <div id="consentState" className={consentGiven ? styles.ok : styles.error}>
                        {consentGiven ? "동의 완료" : "미동의"}
                    </div>
                    </div>
                    <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleOpenPolicy}>
                    개인정보 처리방침 보기
                    </button>
                </div>
                <div className={styles.hint}>약관을 열람하고 동의해야 인증코드 전송 및 회원가입이 가능합니다.</div>
                {!!errors.consent && <div className={styles.error}>{errors.consent}</div>}
                </div>

                <div className={styles.row} style={{ marginTop: 12, gap: 8, justifyContent: "flex-end" }}>
                <button type="submit" id="submitBtn" className={`${styles.btn} ${styles.btnPrimary}`} disabled={submitting}>
                    {submitting ? "처리 중..." : "회원가입"}
                </button>
                </div>
            </form>
            </div>
            <div className={styles.foot}>
            <span className={styles.hint}>이미 계정이 있습니까?</span>
            <Link className={styles.link} to="/login">로그인</Link>
            </div>
        </section>

        <PolicyModal open={policyOpen} onClose={handleClosePolicy} />

        {toasts.map((t) => (
            <Toast key={t.id} msg={t.msg} danger={t.danger} />
        ))}
        </div>
    );
}

function PolicyModal({ open, onClose }) {
  return (
    <div
      id="policyModal"
      className={`${styles.modal} ${open ? styles.show : ""}`}
      aria-hidden={open ? "false" : "true"}
      aria-labelledby="policyTitle"
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.shade} onClick={() => onClose(false)} />
      <div className={styles.dialog}>
        <header>
          <strong id="policyTitle">[ 개인정보 수집∙이용에 대한 동의 ]</strong>
          <button type="button" className={styles.btn} onClick={() => onClose(false)}>
            닫기
          </button>
        </header>
        <div className={styles.body}>
          <ol>
            <li>수집하는 개인정보 항목</li>
            <li>개인식별정보 : 학번, 성명, 휴대전화번호, 이메일, 성별</li>
            <li>개인정보의 수집 및 이용목적</li>
            <li>제공하신 정보는 이벤트 참여 및 본인 정보 확인 목적으로 사용됩니다.</li>
            <li>① 이벤트 참여 시 재학 여부확인에 이용 : 성명, 학번</li>
            <li>② 이벤트 참여 시 연락 용도에 이용 : 학번, 휴대전화번호, 이메일</li>
            <li>③ 기본적인 인권 침해의 유려가 있는 민감한 개인정보(인종 및 민족, 사상 및 신조, 주민번호, 정치적 성향)는 수집하지 않습니다.</li>
            &nbsp;
            <li>개인정보의 보유 및 이용기간</li>
            <li>수집된 개인정보는 탈퇴요청, 편입, 자퇴, 전과 요청시까지 위 이용목적을 위하여 보유‧이용됩니다.</li>
            <li>※ 귀하는 이에 대한 동의를 거부할 수 있으며, 다만, 동의가 없을 경우 회원가입 진해이 불가능 할 수 있음을 알려드립니다.</li>
          </ol>
        </div>
        <footer>
          <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onClose(true)}>
            동의
          </button>
        </footer>
      </div>
    </div>
  );
}

function Toast({ msg, danger }) {
  return (
    <div
      className={`${styles.toast} ${styles.show} ${danger ? styles.toastDanger : ""}`}
      role="status"
      aria-live="polite"
    >
      {msg}
    </div>
  );
}


export default Signup;