import { Routes, Route } from "react-router-dom";
import Menu from "./pages/Menu";
import Dashboard from "./pages/Dashboard";
import QRPage from "./pages/QRPage";
import MenuPrint from "./pages/MenuPrint";
import ServiceStaff from './pages/ServiceStaff';
import OrderView from './pages/OrderView';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Menu />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/qr" element={<QRPage />} />
      <Route path="/menu-print" element={<MenuPrint />} />
      <Route path="/service-staff" element={<ServiceStaff />} />
      <Route path="/orders" element={<OrderView />} />
    </Routes>
  );
}