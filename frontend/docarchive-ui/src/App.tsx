import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DocumentListPage from './pages/documents/DocumentListPage';
import DocumentAddPage from './pages/documents/DocumentAddPage';
import DocumentEditPage from './pages/documents/DocumentEditPage';
import DocumentViewPage from './pages/documents/DocumentViewPage';
import CategoryListPage from './pages/categories/CategoryListPage';
import CategoryFormPage from './pages/categories/CategoryFormPage';
import UserListPage from './pages/users/UserListPage';
import UserFormPage from './pages/users/UserFormPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/documents" replace />} />
          <Route path="documents" element={<DocumentListPage />} />
          <Route path="documents/add" element={<DocumentAddPage />} />
          <Route path="documents/:id" element={<DocumentViewPage />} />
          <Route path="documents/:id/edit" element={<DocumentEditPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:id/edit" element={<CategoryFormPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="users/new" element={<UserFormPage />} />
          <Route path="users/:id/edit" element={<UserFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
