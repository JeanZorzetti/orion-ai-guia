import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';
import Dashboard from './pages/Dashboard';
import ContasAPagar from './pages/ContasAPagar';
import ProdutoDetalhes from './pages/ProdutoDetalhes';
import OnboardingProvider from './components/onboarding/OnboardingProvider';
import { Toaster } from '../src/components/ui/sonner';

function App() {
  return (
    <OnboardingProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="financeiro/contas-a-pagar" element={<ContasAPagar />} />
              <Route path="estoque/produtos/:id" element={<ProdutoDetalhes />} />
            </Route>
          </Routes>
          <Toaster />
        </div>
      </Router>
    </OnboardingProvider>
  );
}

export default App;