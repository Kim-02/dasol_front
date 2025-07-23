import React, { useState } from "react";
import './signupPage.css'
import { doSignup } from "../../utils/auth";
import { useNavigate, Link } from "react-router-dom";

function SignupPage(){
  const navigate = useNavigate();
  const [form, setForm] = useState({
    studentId: '',
    password: '',
    gender: '',
    email: '',
    phone: '',
    name: ''
  });

  const handleChange = (e) => {
    const {name, value} = e.target;
    setForm(prev => ({...prev, [name]:value}));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const trimmed = {
      ...form,
      studentID: form.studentId.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      name: form.name.trim()
    };

    try {
      await doSignup(trimmed);
      alert('회원가입 성공! 로그인 페이지로 이동합니다.')
      navigate('/');
    }
    catch(err){
      alert('회원가입 실패' + err.message)
    }
  };

  return (
    <div className="login-container">
      <h2 className="title">회원가입</h2>
      <form id="signup-form" className="login-form" onSubmit={handleSubmit}>

        <label htmlFor="studentId">학번</label>
        <input
          type="text"
          id="studentId"
          name="studentId"
          value={form.studentId}
          onChange={handleChange}
          placeholder="학번을 입력하세요."
          required
        />

        <label htmlFor="password">비밀번호</label>
        <input
          type="password"
          id="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="비밀번호를 입력하세요."
          required
        />


        <label htmlFor="gender">성별</label>
        <select 
          id="gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          required
        >
          <option value="">성별을 선택하세요.</option>
          <option value="M">남</option>
          <option value="F">여</option>
        </select>

        <label htmlFor="email">이메일</label>
        <input
          type="email"
          id="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="e-mail을 입력하세요."
          required
        />

        <label htmlFor="phone">핸드폰번호</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="핸드폰번호를 입력하세요."
          required
        />

        <label htmlFor="name">이름</label>
        <input
          type="text"
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="이름을 입력하세요."
          required
        />

        <button type="submit">가입하기</button>
      </form>

      <Link className="signup-link" to="/">로그인으로 돌아가기</Link>
  </div>
  );
}

export default SignupPage;