import React, { useRef, useState, useEffect } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import logo from "./images/logo.png";
import "./App.css";
import Login from "./js/Login";
import Register from "./js/Register";
import Chat from "./js/Chat";
import Home from "./js/Home";

function App() {
    const linksRef = useRef(null); // Create a ref for the .links element
    const [screen, setScreen] = useState(window.innerWidth);
    const [authenticated, setAuthenticated] = useState(!!localStorage.getItem("username")); // Track authentication status

    useEffect(() => {
        setScreen(window.innerWidth);
    }, []);
    const rotateBars = () => {
        const bars = document.querySelectorAll(".nav-icon");
        const nav = document.querySelector(".toggle-nav");
        bars[0].classList.toggle("rotate-bar1");
        bars[1].classList.toggle("rotate-bar2");
        nav.classList.toggle("rotate-nav");
        if (screen <= 576) {
            if (linksRef.current.classList.contains("show-links")) {
                linksRef.current.classList.remove("show-links");
                linksRef.current.classList.add("hide-links"); // Add the hide-links class when hiding
                setTimeout(() => {
                    linksRef.current.style.display = "none"; // Set display to none after the animation ends
                }, 500); // Adjust the timeout duration to match the animation duration
            } else {
                linksRef.current.classList.remove("hide-links");
                linksRef.current.classList.add("show-links"); // Add the show-links class when showing
                linksRef.current.style.display = "flex";
            }
        }
    };

    return (
        <>
            <nav className="navbar">
                <ul>
                    <li>
                        <NavLink to="/" className="logo-name">
                            <img
                                src={logo}
                                width="56px"
                                height="56px"
                                alt="error"
                            />
                            IChat
                        </NavLink>
                    </li>
                    <li className="links" ref={linksRef}>
                        <NavLink
                            to="/"
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""
                            }
                            onClick={() => rotateBars()}
                        >
                            <i className="fas fa-home"></i>
                            Home
                        </NavLink>
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""
                            }
                            onClick={() => rotateBars()}
                        >
                            <i className="fas fa-sign-in-alt"></i>
                            Login
                        </NavLink>
                        <NavLink
                            to="/register"
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""
                            }
                            onClick={() => rotateBars()}
                        >
                            <i className="fas fa-user-plus"></i>
                            Register
                        </NavLink>
                        <NavLink
                            to="/chat"
                            className={({ isActive }) =>
                                isActive ? "active-link" : ""
                            }
                            onClick={() => rotateBars()}
                        >
                            <i className="fas fa-comment-dots"></i>
                            Chat
                        </NavLink>
                        {authenticated && (
                            <NavLink
                                onClick={() => {
                                    localStorage.removeItem("username");
                                    setAuthenticated(!!localStorage.getItem("username"));
                                    rotateBars();
                                    alert("Logged out successfully!");
                                }}
                            >
                                <i className="fas fa-sign-out"></i>
                                Logout
                            </NavLink>
                        )}
                    </li>
                    <div className="toggle-nav" onClick={() => rotateBars()}>
                        <div className="nav-icon"></div>
                        <div className="nav-icon"></div>
                        <div className="nav-icon"></div>
                    </div>
                </ul>
            </nav>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/chat" element={<Chat />} />
            </Routes>
        </>
    );
}

export default App;
