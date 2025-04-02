import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BsSend, BsSearch, BsTrash } from "react-icons/bs";
import { useUser, UserButton } from "@clerk/clerk-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

const ChatbotContainer = () => {
  const { user } = useUser();
  const userId = user?.id || "guest";

  const [conversations, setConversations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  // Load conversations from localStorage when component mounts or userId changes
  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("chatConversations")) || {};
    if (storedData[userId] && storedData[userId].length > 0) {
      setConversations(storedData[userId]);
    } else {
      setConversations([{ name: "Conversation 1", messages: [] }]);
    }
    setSelectedIndex(0);
  }, [userId]);

  // Save conversations to localStorage when conversations change
  useEffect(() => {
    if (conversations.length > 0) {
      const storedData = JSON.parse(localStorage.getItem("chatConversations")) || {};
      storedData[userId] = conversations;
      localStorage.setItem("chatConversations", JSON.stringify(storedData));
    }
  }, [conversations, userId]);

  // Helper to update conversation messages
  const updateConversation = (newMessages) => {
    setConversations((prev) => {
      const updated = [...prev];
      updated[selectedIndex] = { ...updated[selectedIndex], messages: newMessages };
      return updated;
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Append the user's message
    const newHistory = [
      ...conversations[selectedIndex].messages,
      { sender: "user", text: input },
    ];
    updateConversation(newHistory);

    try {
      const response = await axios.post("http://localhost:5001/api/generate", {
        prompt: input,
      });
      const aiResponse = response.data.response;
      const updatedHistory = [
        ...newHistory,
        { sender: "ai", text: aiResponse },
      ];
      updateConversation(updatedHistory);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      const updatedHistory = [
        ...newHistory,
        { sender: "ai", text: "Sorry, something went wrong." },
      ];
      updateConversation(updatedHistory);
    }
    setInput("");
  };

  const createNewConversation = () => {
    setConversations((prev) => {
      const newConvo = { name: `Conversation ${prev.length + 1}`, messages: [] };
      // The new conversation will be added at the end; set selectedIndex accordingly.
      setSelectedIndex(prev.length);
      return [...prev, newConvo];
    });
  };

  const deleteConversation = (index) => {
    setConversations((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.length ? updated : [{ name: "Conversation 1", messages: [] }];
    });
    setSelectedIndex((prevIndex) => {
      if (prevIndex === index) return 0;
      if (prevIndex > index) return prevIndex - 1;
      return prevIndex;
    });
  };

  // Helper function to format text with code highlighting
  const renderFormattedText = (text) => {
    const parts = text.split(/```/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // Code segment: use SyntaxHighlighter for formatting
        return (
          <SyntaxHighlighter
            key={index}
            language="javascript"
            style={tomorrow}
            customStyle={{ borderRadius: "8px", padding: "1rem" }}
          >
            {part.trim()}
          </SyntaxHighlighter>
        );
      } else {
        // Plain text segment
        return part.trim() ? (
          <p key={index} className="text-base">
            {part}
          </p>
        ) : null;
      }
    });
  };

  // Scroll to the bottom of the chat whenever messages update.
  useEffect(() => {
    chatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, selectedIndex]);

  return (
    <div className="flex h-screen w-screen bg-gray-100 p-6">
      {/* Sidebar */}
      <div className="w-1/4 h-full bg-white rounded-xl shadow-md p-5 flex flex-col">
        <h2 className="text-lg font-bold text-gray-700">CHAT A.I+</h2>
        <div className="flex items-center mt-4">
          <UserButton afterSignOutUrl="/" className="w-16 h-16" />
          <span className="text-gray-700 font-medium px-5">
            {user?.fullName || "Guest"}
          </span>
        </div>
        <button
          className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-full flex items-center justify-center hover:bg-indigo-700 transition"
          onClick={createNewConversation}
        >
          + New Chat
        </button>
        <div className="relative mt-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 rounded-full border focus:outline-none"
          />
          <BsSearch className="absolute right-3 top-2.5 text-gray-500" />
        </div>
        <div className="mt-5 flex-1 overflow-y-auto">
          <p className="text-gray-600 text-sm">Your conversations</p>
          <ul className="mt-2 text-gray-800 space-y-2">
            {conversations.map((conv, index) => (
              <li
                key={index}
                className="flex justify-between items-center cursor-pointer hover:text-indigo-600"
              >
                <span onClick={() => setSelectedIndex(index)}>
                  📄 {conv.name}
                </span>
                <BsTrash
                  className="text-red-500 cursor-pointer hover:text-red-700"
                  onClick={() => deleteConversation(index)}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Chat Window */}
      <div className="w-3/4 h-full flex flex-col bg-white rounded-xl shadow-md ml-6 p-6">
        <h3 className="text-lg font-bold text-gray-700 mb-3">
          {conversations[selectedIndex]?.name}
        </h3>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-100 rounded-md">
          {conversations[selectedIndex]?.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              } mb-2`}
            >
              <div
                className={`p-3 max-w-xs rounded-lg shadow-md ${
                  msg.sender === "user"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}
          <div ref={chatRef}></div>
        </div>

        {/* Chat Input */}
        <form
          onSubmit={sendMessage}
          className="mt-4 flex items-center border rounded-full p-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2 rounded-full focus:outline-none"
            placeholder="Ask me anything..."
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
          >
            <BsSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotContainer;