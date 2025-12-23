import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import EventList from './features/events/EventList';
import RegistrationHistory from './features/events/RegistrationHistory';
import CreateProposalForm from './features/events/CreateProposalForm';
import MyProposalsList from './features/events/MyProposalsList';
import ProposalReviewList from './features/admin/ProposalReviewList';
import ProposalDetails from './features/admin/ProposalDetails';
import UpdateEventForm from './features/events/UpdateEventForm';
import UpdateReviewList from './features/admin/UpdateReviewList';
import UpdateReviewDetails from './features/admin/UpdateReviewDetails';
import OrganizerEvents from './features/events/OrganizerEvents';
import Dashboard from './features/dashboard/Dashboard';
import AuditLogs from './features/admin/AuditLogs';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<EventList />} />
            <Route path="/events/:eventID/update" element={<UpdateEventForm />} />
            <Route path="/my-events" element={<RegistrationHistory />} />
            <Route path="/managed-events" element={<OrganizerEvents />} />
            <Route path="/proposals/submit" element={<CreateProposalForm />} />
            <Route path="/proposals/my" element={<MyProposalsList />} />

            <Route path="/admin/proposals" element={<ProposalReviewList />} />
            <Route path="/admin/proposals/:proposalID" element={<ProposalDetails />} />
            <Route path="/admin/updates" element={<UpdateReviewList />} />
            <Route path="/admin/updates/:requestID" element={<UpdateReviewDetails />} />
            <Route path="/admin/audit" element={<AuditLogs />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
