import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/login/loginPage';
import SignupPage from './pages/signup/signupPage';
import MainPage from './pages/dasolmain/mainPage';
import DocumentBoard from './pages/board/documentBoard';
import DocumentCreate from './pages/board/documentCreate';
import UserPage from './pages/user/user';
import './App.css';
import ApprovalProcess from './pages/approval/approvalProcess';
import ApprovalRequest from './pages/approval/approvalRequest';


function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/document_board" element={<DocumentBoard />} />
        <Route path="/document_create" element={<DocumentCreate />} />
        <Route path="/user" element={<UserPage />} />
        <Route path="/approval_process" element={<ApprovalProcess />} />
        <Route path="/approval_request" element={<ApprovalRequest />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
