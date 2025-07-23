import React, { useState } from "react";
import './loginPage.css'
import { doLogin } from "../../utils/auth";
import { useNavigate, Link } from "react-router-dom";

function LoginPage(){
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async(e) => {
    e.preventDefault();
    try{
      await doLogin(studentId, password);
      alert('로그인 성공');
      navigate();
    } 
    catch(err){
      alert('로그인 실패: ' + err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="title">로그인</h1>
        <form id="loginForm" className="login-form" onSubmit={handleLogin}>
          <label htmlFor="studentId">학번</label>
          <input
            type="text"
            id="studentId"
            name="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="학번을 입력하세요."
            required
          />

          <label htmlFor="password">비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요."
            required
          />

          <button type="submit" id="loginBtn">로그인</button>
        </form>
        <Link to="/signup" className="signup-link">회원가입</Link>
      </div>
    </div>
  );
}

export default LoginPage;