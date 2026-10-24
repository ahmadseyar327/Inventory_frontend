
import { Navigate, Route, Routes, useNavigate } from "react-router"

import Auth from "../pages/Auth/Auth"
import Dashboard from "../pages/Dashboard/Dashboard"
import Customers from "../pages/Customers/Customer"

import { clearAuthToken, getAuthToken } from "../services/api"

function AppRoutes() {
  const navigate = useNavigate()
  const isAuthenticated = Boolean(getAuthToken())

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Auth
              onAuthenticated={() =>
                navigate("/dashboard", { replace: true })
              }
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Dashboard
              onLogout={() => {
                clearAuthToken()
                navigate("/login", { replace: true })
              }}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/customers"
        element={
          isAuthenticated ? (
            <Customers />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to={isAuthenticated ? "/dashboard" : "/login"}
            replace
          />
        }
      />
    </Routes>
  )
}

export default AppRoutes
