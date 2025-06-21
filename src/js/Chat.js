// Import necessary dependencies from React and other libraries
import React, { useState, useEffect, useRef } from "react"; // useState for managing state, useEffect for side effects
import "../css/Chat.css"; // Import the CSS file for styling
import axios from "axios"; // Import Axios for making HTTP requests
import io from "socket.io-client";

const socket = io("http://192.168.1.9:5000"); // Adjust the IP if needed

function Chat() {
    // State to store messages retrieved from the server
    const [messages, setMessages] = useState([]);

    // State to store the new message input
    const [newMessage, setNewMessage] = useState("");

    const [showScrollDownBtn, setShowScrollDownBtn] = useState(false); // State to control the visibility of the scroll down button
    const [clickedKey, setClickedKey] = useState(null); // State to track the clicked key for the image message
    const [editing, setEditing] = useState(false); // State to track if a message is being edited
    const [messageId, setMessageId] = useState(null); // State to store the ID of the message being edited

    const messagesEndRef = useRef(null); // Reference to the latest message element for smooth scrolling

    const chatContainerRef = useRef(null); // Reference to the chat container for IntersectionObserver

    const fileInputRef = useRef(null); // Reference to the file input for image upload
    const imageMessageRef = useRef({}); // Reference to the image message for smooth scrolling
    const overlayRef = useRef(null); // Reference to the overlay element

    // Fetch messages when the component mounts
    useEffect(() => {
        document.title = "iChat - Chat";
        // Function to fetch initial messages from the server
        const fetchMessages = async () => {
            const res = await axios.get("http://192.168.1.9:5000/messages"); // Make a GET request to fetch messages
            setMessages(res.data); // Update the state with the fetched messages
        };
        fetchMessages(); // Call the function

        // Listen for incoming messages from the server
        socket.on("message", (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        return () => {
            socket.off("message");
        };
    }, []); // Empty dependency array ensures this runs only once when the component mounts

    useEffect(() => {
        scrollToBottom();
        // Create a new IntersectionObserver to detect visibility changes of an element
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the observed element is not visible, show the scroll-down button
                setShowScrollDownBtn(!entry.isIntersecting);
            },
            {
                root: chatContainerRef.current, // Set the scrolling container as the viewport
                threshold: 1.0, // Trigger only when the entire element is fully visible
            }
        );

        // If the last message element exists, start observing it
        if (messagesEndRef.current) {
            observer.observe(messagesEndRef.current);
        }
    }, [messages]); // Run this effect whenever the messages state changes

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    // Function to handle sending a new message
    const handleSendMessage = async (e) => {
        e.preventDefault(); // Prevent the default form submission behavior

        // Check if the message is empty after trimming spaces
        if (newMessage.trim() === "") return;

        // Send the new message to the server
        await axios.post("http://192.168.1.9:5000/messages", {
            text: newMessage,
            user: localStorage.getItem("username") || "Anonymous", // Use the logged-in username or default to "Anonymous"
        });

        // Clear the input field after sending
        setNewMessage("");
    };

    const renderSendButton = () => {
        if (localStorage.getItem("username")) {
            if (editing) {
                return (
                    <button
                        type="button"
                        onClick={async () => {
                            const message = messages.find(
                                (msg) => msg._id === messageId
                            );
                            setMessages((prevMessages) =>
                                prevMessages.map((msg) =>
                                    msg._id === messageId
                                        ? { ...msg, text: newMessage }
                                        : msg
                                )
                            );
                            await axios.patch(
                                `http://192.168.1.9:5000/messages/${message._id}`,
                                {
                                    text: newMessage,
                                }
                            );
                            setNewMessage(""); // Clear the input field
                            setEditing(false); // Reset editing state
                            setMessageId(null); // Reset message ID
                        }}
                    >
                        Edit
                    </button>
                );
            }
            return <button type="submit">Send</button>;
        }
        return;
    };

    const formatTime = (timestamp) => {
        // Create a new Date object from the given timestamp
        const date = new Date(timestamp);

        // Get the day, month, and year from the date object
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based
        const year = date.getFullYear();

        // Get the hours from the date object and convert them to a string
        // Pad with "0" if the number is less than 10 (e.g., "9" becomes "09")
        const hours = date.getHours().toString().padStart(2, "0");

        // Get the minutes from the date object and convert them to a string
        // Pad with "0" if the number is less than 10 (e.g., "5" becomes "05")
        const minutes = date.getMinutes().toString().padStart(2, "0");

        // Return the formatted time in "HH:MM" format
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    const displayEdit = (index) => {
        const displayEditDiv =
            document.querySelectorAll(".display-edit")[index];
        if (displayEditDiv.style.display === "") {
            displayEditDiv.style.display = "flex";
        } else {
            displayEditDiv.style.display = "";
        }
    };

    const deleteMessage = async (message, index) => {
        try {
            // Send a delete request to the server
            await axios.delete(
                `http://192.168.1.9:5000/messages/${message._id}`
            );
            setMessages(
                (prevMessages) => prevMessages.filter((_, i) => i !== index) // Filter out the deleted message from the state
            );
            console.log("Message deleted successfully");
        } catch (error) {
            console.error("Error deleting message: ", error);
        }
    };

    const editMessage = async (message) => {
        try {
            setNewMessage(message.text); // Set the current message text to the input field
            setEditing(true); // Set editing state to true
            setMessageId(message._id); // Set the ID of the message being edited
        } catch (error) {
            console.error("Error updating message:", error);
        }
    };

    const renderMessages = (message, index) => {
        const isImage = message.text.startsWith("data:image/");
        if (localStorage.getItem("username") === message.user)
            return (
                <div
                    key={index}
                    style={{
                        alignSelf: "flex-end",
                        backgroundColor: "rgb(100 7 7)",
                    }}
                    className="message"
                >
                    {isImage ? (
                        <img
                            ref={(el) => (imageMessageRef.current[index] = el)}
                            src={message.text}
                            alt="Uploaded"
                            className="message-image"
                            onClick={() => {
                                setClickedKey(index);
                                overlayRef.current.appendChild(
                                    imageMessageRef.current[index]
                                );
                                overlayRef.current.style.display = "block";
                                imageMessageRef.current[index].classList.remove(
                                    "message-image"
                                );
                                imageMessageRef.current[index].classList.add(
                                    "message-image-fullscreen"
                                );
                                const isLandScape =
                                    imageMessageRef.current[index]
                                        .naturalWidth >
                                    imageMessageRef.current[index]
                                        .naturalHeight;
                                console.log(isLandScape);
                                if (isLandScape) {
                                    imageMessageRef.current[index].style.width =
                                        "90%";
                                } else {
                                    imageMessageRef.current[
                                        index
                                    ].style.height =
                                        window.innerWidth > 585 ? "90%" : "70%";
                                }
                            }}
                        />
                    ) : (
                        <p className="message-text">{message.text}</p>
                    )}
                    <div className="display-edit" key={index}>
                        <p
                            className="display-edit-item"
                            onClick={() => {
                                editMessage(message);
                            }}
                        >
                            Edit
                        </p>
                        <p
                            className="display-edit-item"
                            onClick={() => {
                                deleteMessage(message, index);
                            }}
                        >
                            Delete
                        </p>
                    </div>
                    <div
                        className="edit-message"
                        onClick={() => displayEdit(index)}
                    >
                        <i className="fa fa-ellipsis-h"></i>
                    </div>
                    <p className="message-time">
                        {formatTime(message.createdAt)}
                    </p>
                </div>
            );
        return (
            <div key={index} className="message">
                <h4 className="message-user">{message.user}</h4>
                {isImage ? (
                    <img
                        ref={(el) => (imageMessageRef.current[index] = el)}
                        src={message.text}
                        alt="Uploaded"
                        className="message-image"
                        onClick={() => {
                            setClickedKey(index);
                            overlayRef.current.appendChild(
                                imageMessageRef.current[index]
                            );
                            overlayRef.current.style.display = "block";
                            imageMessageRef.current[index].classList.remove(
                                "message-image"
                            );
                            imageMessageRef.current[index].classList.add(
                                "message-image-fullscreen"
                            );
                            const isLandScape =
                                imageMessageRef.current[index].naturalWidth >
                                imageMessageRef.current[index].naturalHeight;
                            console.log(isLandScape);
                            if (isLandScape) {
                                imageMessageRef.current[index].style.width =
                                    "90%";
                            } else {
                                imageMessageRef.current[index].style.height =
                                    window.innerWidth > 585 ? "90%" : "70%";
                            }
                        }}
                    />
                ) : (
                    <p className="message-text">{message.text}</p>
                )}
                <div className="display-edit" key={index}>
                    <p className="display-edit-item">Edit</p>
                    <p className="display-edit-item">Delete</p>
                </div>
                <div
                    className="edit-message"
                    onClick={() => displayEdit(index)}
                    style={{ display: "none" }}
                >
                    <i className="fa fa-ellipsis-h"></i>
                </div>
                <p className="message-time">{formatTime(message.createdAt)}</p>
            </div>
        );
    };

    const handleClick = (e) => {
        fileInputRef.current.click(); // Trigger the file input click event to open the file dialog
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0]; // Get the selected file from the input
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setNewMessage(reader.result); // Set the base64 image data as the new message
            };

            reader.readAsDataURL(file); // Read the file as a data URL (base64)
        }
    };

    const handleExitImage = (e) => {
        overlayRef.current.style.display = "none"; // Hide the overlay when clicking outside the image
        Object.values(imageMessageRef.current).forEach((element) => {
            if (element.classList.contains("message-image-fullscreen")) {
                element.classList.remove("message-image-fullscreen");
                element.classList.add("message-image");
                const originalParent = document.querySelectorAll(".message");
                originalParent[clickedKey].insertBefore(
                    element,
                    originalParent[clickedKey].lastElementChild
                ); // Append the image back to its original parent
                element.style.width = "auto"; // Reset the width to auto
                element.style.height = "auto"; // Reset the height to auto
            }
        });
    };

    return (
        <>
            <div className="overlay" ref={overlayRef} onClick={handleExitImage}>
                <div className="overlay-close" onClick={handleExitImage}>
                    <i className="fa fa-x"></i>
                </div>
            </div>
            <div className="chat-container" ref={chatContainerRef}>
                <h3>Public Chat</h3>
                {/* Display chat messages */}
                <div className="messages">
                    {messages.map((message, index) =>
                        renderMessages(message, index)
                    )}
                    <div ref={messagesEndRef} />{" "}
                    {/* Reference to scroll to the latest message */}
                </div>

                {/* Input field and send button */}
                <div className="message-form-container">
                    {showScrollDownBtn && (
                        <button
                            className="scroll-down-btn"
                            onClick={scrollToBottom}
                        >
                            <i className="fa fa-arrow-down"></i>
                        </button>
                    )}
                    <form className="message-form" onSubmit={handleSendMessage}>
                        <div className="input-container">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)} // Update state on input change
                                placeholder={
                                    localStorage.getItem("username")
                                        ? "Type your message..."
                                        : "Login to send messages..."
                                }
                                disabled={!localStorage.getItem("username")} // Disable input if user is not logged in
                            />
                            {localStorage.getItem("username") && (
                                <i
                                    className="fa fa-image input-icon"
                                    onClick={handleClick}
                                ></i>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload} // Handle image upload
                                style={{ display: "none" }}
                            />
                        </div>
                        {renderSendButton()}
                    </form>
                </div>
            </div>
        </>
    );
}

export default Chat; // Export the Chat component for use in other parts of the app
