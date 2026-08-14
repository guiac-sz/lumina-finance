import { Link } from 'react-router-dom'
import logo from '../../assets/logo.png'
import './Header.css'

export default function Header() {
    return (
        <header className="header">

            <Link to="/" className="logo-container">
                <img src={logo} alt="Lumina Logo" />
                <span>Lumina</span>
            </Link>

            <nav className="nav">

                <Link to="/overview">
                    Visão geral
                </Link>

                <Link to="/transactions">
                    Transações
                </Link>

                <Link to="/categories">
                    Categorias
                </Link>

            </nav>

        </header>
    )
}