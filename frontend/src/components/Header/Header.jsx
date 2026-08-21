import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo.png";
import "./Header.css";

export default function Header() {
    return (
        <header className="header">

            <Link to="/" className="logo-container">
                <img src={logo} alt="Logo Lumina" />

                <span>Lumina</span>
            </Link>

            <nav className="nav-menu">

                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                    }
                >
                    Visão geral
                </NavLink>

                <NavLink
                    to="/transactions"
                    className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                    }
                >
                    Transações
                </NavLink>

                <NavLink
                    to="/categories"
                    className={({ isActive }) =>
                        isActive ? "nav-link active" : "nav-link"
                    }
                >
                    Categorias
                </NavLink>

            </nav>

            <div className="user-area">

                <div className="user-info">
                    <span className="user-name">
                        Guilherme
                    </span>

                    <span className="user-label">
                        Minha conta
                    </span>
                </div>

                <div className="user-avatar">
                    G
                </div>

            </div>

        </header>
    );
}