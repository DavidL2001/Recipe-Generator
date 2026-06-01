import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage'; // M3
import RecipesPage from './pages/RecipesPage';       // M4
import MealPlanPage from './pages/MealPlanPage';     // M5
import { OfflineBanner } from './components/ui/OfflineBanner'; // M6

function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected (M2+) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />  {/* M3 */}
          <Route path="/recipes"   element={<RecipesPage />} />    {/* M4 */}
          <Route path="/meal-plans" element={<MealPlanPage />} />  {/* M5 */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
