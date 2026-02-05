import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PromptList from './pages/PromptList'
import PromptDetail from './pages/PromptDetail'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PromptList />} />
          <Route path="/prompt/:id" element={<PromptDetail />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
