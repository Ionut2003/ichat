import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";
import axios from "axios";

function Login() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();
    const successMessage = useRef(null);

    useEffect(() => {
        document.title = "iChat - Register";
    }, []);

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            await axios.post("http://192.168.1.7:5000/register", {
                name,
                password,
            });
            successMessage.current.style.color = "rgb(0, 255, 0)";
            successMessage.current.innerHTML = "Registration successful!";
            setTimeout(() => {
                navigate("/login"); // Redirect to the login page after successful registration
            }, 2000);
        } catch (err) {
            successMessage.current.style.color = "red";
            successMessage.current.innerHTML =
                "Registration failed: " + err.response.data.message;
            console.error("Registration failed:", err.response.data.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Register</h2>
            {!localStorage.getItem("username") ? (
                <>
                    <form className="login-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Name:</label>
                            <input
                                placeholder="Enter your name"
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)} // Update state on input change
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password:</label>
                            <input
                                placeholder="Enter your password"
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} // Update state on input change
                                required
                            />
                        </div>
                        <button type="submit">Register</button>
                        <p className="success-message" ref={successMessage}></p>
                    </form>
                    <p className="already-registered">
                        Already have an account? <Link to="/login">Login</Link>
                    </p>
                </>
            ) : (
                <h1 className="already-logged-in">
                    You are already logged in...
                    <span>Please logout first!</span>
                </h1>
            )}
        </div>
    );
}

export default Login;
