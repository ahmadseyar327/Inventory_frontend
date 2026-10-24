
import { BrowserRouter } from "react-router"
import AppRoutes from "./routes/AppRoutes"
import { ThemeProvider } from "./contexts/ThemeContext"

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
