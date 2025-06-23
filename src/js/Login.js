import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";
import axios from "axios";

function Login() {
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    // Hook to programmatically navigate between pages
    const navigate = useNavigate();

    const successMessage = useRef(null);

    useEffect(() => {
        document.title = "iChat - Login";
    }, []);

    // Function to handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
        try {
            // Send a POST request to the backend login route with user credentials
            const res = await axios.post("http://192.168.1.7:5000/login", {
                name,
                password,
            });

            // Store the received JWT token in local storage for authentication
            localStorage.setItem("token", res.data.token);

            localStorage.setItem("username", res.data.user.name);
            successMessage.current.style.color = "rgb(0, 255, 0)";
            successMessage.current.innerHTML = "Successfully logged in!";
            // Redirect the user to the home page after successful login
            setTimeout(() => {
                navigate("/");
                window.location.reload();
            }, 2000);
        } catch (err) {
            successMessage.current.style.color = "red";
            successMessage.current.innerHTML = err.response.data.message + "!";
            // Log any errors that occur during the login process
            console.log(err.response.data.message);
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
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
                        <button type="submit">Login</button>
                        <p className="success-message" ref={successMessage}></p>
                    </form>
                    <p className="already-registered">
                        Don't have an account?{" "}
                        <Link to="/register">Register</Link>.
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
