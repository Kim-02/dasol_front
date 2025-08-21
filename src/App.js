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
import MonthlySummary from './pages/approval/monthlySummary';
import EventBoard from './pages/board/eventBoard';
import EventCreate from './pages/board/eventCreate';
import ElectronicDoc from './pages/approval/electronicDoc';
import ApprovalSkeleton from './pages/approval/approvalSkeleton';
import ApprovalApproved from './pages/approval/approvalApproved';
import ApprovalRequestPage from './pages/approval/approvalRequestPage';
import MonthPage from './pages/approval/monthPage';
import PermissionPage from './pages/approval/permission';
import UserPg from './pages/user/userpg';


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
        <Route path="/monthly_summary" element={<MonthlySummary />} />
        <Route path="/event_board" element={<EventBoard />} />
        <Route path="/event_create" element={<EventCreate />} />
        <Route path="/electronic_doc" element={<ElectronicDoc />} />
        
        <Route path="/approval_skeleton" element={<ApprovalSkeleton />} />
        <Route path="/approval_approved" element={<ApprovalApproved />} />
        <Route path="/approval_req" element={<ApprovalRequestPage />} />
        <Route path="/monthly_page" element={<MonthPage />} />
        <Route path="/permission" element={<PermissionPage />} />
        <Route path="/userpg" element={<UserPg />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;
