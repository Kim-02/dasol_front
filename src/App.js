import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ApprovalSkeleton from './pages/approval/approvalSkeleton';
import ApprovalApproved from './pages/approval/approvalApproved';
import ApprovalRequestPage from './pages/approval/approvalRequestPage';
import MonthPage from './pages/approval/monthPage';
import PermissionPage from './pages/approval/permission';
import UserPg from './pages/user/userpg';
import Signup from './pages/signup/signup';
import Login from './pages/login/login';
import MainPage from './pages/dasolmain/mainPage';


function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signuppage" element={<Signup />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/userpg" element={<UserPg />} />        
        <Route path="/approval_skeleton" element={<ApprovalSkeleton />} />
        <Route path="/approval_approved" element={<ApprovalApproved />} />
        <Route path="/approval_req" element={<ApprovalRequestPage />} />
        <Route path="/monthly_page" element={<MonthPage />} />
        <Route path="/permission" element={<PermissionPage />} />
        
      </Routes>
    </BrowserRouter>
  )
}

export default App;
