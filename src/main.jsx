import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'
import App from './App.jsx'

import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<App />}>

                    <Route index element={<Home />} />

                    <Route
                        path="dashboard"
                        element={<Dashboard />}
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    </StrictMode>,
)