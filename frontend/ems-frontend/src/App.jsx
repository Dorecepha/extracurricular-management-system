import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import EventList from './features/events/EventList';
import CreateProposalForm from './features/events/CreateProposalForm';
import ProposalReviewList from './features/admin/ProposalReviewList';
import ProposalDetails from './features/admin/ProposalDetails';

// Create the client outside the component to prevent re-renders
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<div className="p-4 text-2xl">Dashboard Placeholder</div>} />
            <Route path="/events" element={<EventList />} />
            <Route path="/propose" element={<CreateProposalForm />} />
            <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
            <Route path="proposals" element={<ProposalReviewList />} />
            <Route path="proposals/:proposalID" element={<ProposalDetails />} />
      </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
