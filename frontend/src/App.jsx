import CrimeDashboard from './components/CrimeDashboard'
import { ThemeProvider } from './components/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <CrimeDashboard />
    </ThemeProvider>
  )
}

export default App
