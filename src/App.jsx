import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ConstructionApp from "./ConstructionApp";
import DemoApp from "./demo/DemoApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConstructionApp />} />
        <Route path="/demo" element={<DemoApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
