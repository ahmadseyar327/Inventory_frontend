
import { Navigate, Route, Routes, useNavigate } from "react-router"

import Auth from "../pages/Auth/Auth"
import Dashboard from "../pages/Dashboard/Dashboard"
import Customers from "../pages/Customers/Customer"

import { clearAuthToken, getAuthToken } from "../services/api"
import ProductsPage from "../pages/Products/Product"
import { useToast } from "../contexts/useToast"
import SuppliersPage from "../pages/Suppliers/Suppier"
import ProfilePage from "../pages/Profile/Profile"
import UsersPage from "../pages/Users/Users"
import PurchasesPage from "../pages/Purchases/Purchase"
import PurchaseDetailPage from "../pages/Purchases/PurchaseDetail"
import SalesPage from "../pages/Sales/Sale"
import SaleDetailPage from "../pages/Sales/SaleDetail"
import { Settings } from "lucide-react"
import SettingsPage from "../pages/Settings/Settings"
import Product from "../pages/Products/Product"
import ProductTypesPage from "../pages/ProductTypes/ProductTypes"

function AppRoutes() {
  const navigate = useNavigate()
  const { showToast } = useToast()
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
                showToast({ title: "Signed out", message: "You have been securely signed out.", variant: "success" })
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
        path="/products"
        element={
          isAuthenticated ? (
            <ProductsPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/suppliers"
        element={
          isAuthenticated ? (
            <SuppliersPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      /> 

      <Route
        path="/users"
        element={
          isAuthenticated ? (
            <UsersPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/purchase"
        element={
          isAuthenticated ? (
            <PurchasesPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/sale"
        element={
          isAuthenticated ? (
            <SalesPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/product-types"
        element={
          isAuthenticated ? (
            <ProductTypesPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/settings"
        element={
          isAuthenticated ? (
            <SettingsPage/>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/sale/:id"
        element={
          isAuthenticated ? (
            <SaleDetailPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/purchases/:id"
        element={
          isAuthenticated ? (
            <PurchaseDetailPage />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/profile"
        element={
          isAuthenticated ? (
            <ProfilePage/>
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
