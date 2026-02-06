import React from 'react'
import ReactDOM from 'react-dom/client'
import FloatBall from './components/FloatBall/FloatBall'
// 只导入CSS变量定义，不影响背景透明度
import './float-ball-vars.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <FloatBall />
  </React.StrictMode>,
)
