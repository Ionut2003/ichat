import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
    useEffect(() => { 
       document.title = "iChat - Home";
    }, []);

    return (
        <div className="container">
            <h1>Chat with your friends in an easy and fast way!</h1>
            <button onClick={() => navigate("/chat")}>Chat now!</button>
        </div>
    );
}

export default Home;
