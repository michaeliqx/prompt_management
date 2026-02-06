import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 检测平台并添加类名
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
if (isMac) {
  document.body.classList.add('platform-mac')
} else {
  document.body.classList.add('platform-windows')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
