import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import './index.css'
import App from './App.jsx'

import Overview from './pages/Overview/Overview.jsx'
import Transactions from './pages/Transactions/Transactions.jsx'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>

                <Route path="/" element={<App />}>

                    <Route
                        path="overview"
                        element={<Overview />}
                    />

                    <Route
                        path="transactions"
                        element={<Transactions />}
                    />

                </Route>

            </Routes>
        </BrowserRouter>
    </StrictMode>,
)