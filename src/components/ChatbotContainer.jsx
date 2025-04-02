import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { BsSend, BsSearch, BsTrash } from "react-icons/bs";
import { useUser, UserButton } from "@clerk/clerk-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

const ChatbotContainer = () => {
  const { user } = useUser();
  const userId = user?.id || "guest";

  const [conversations, setConversations] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  useEffect(() => {
    const storedData = JSON.parse(localStorage.getItem("chatConversations")) || {};
    setConversations(storedData[userId] || [{ name: "Conversation 1", messages: [] }]);
    setSelectedIndex(0);
  }, [userId]);

  useEffect(() => {
    if (conversations.length > 0) {
      const storedData = JSON.parse(localStorage.getItem("chatConversations")) || {};
      storedData[userId] = conversations;
      localStorage.setItem("chatConversations", JSON.stringify(storedData));
    }
  }, [conversations, userId]);

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
    const newHistory = [...conversations[selectedIndex].messages, { sender: "user", text: input }];
    updateConversation(newHistory);
    try {
      const response = await axios.post("http://localhost:5001/api/generate", { prompt: input });
      updateConversation([...newHistory, { sender: "ai", text: response.data.response }]);
    } catch (error) {
      updateConversation([...newHistory, { sender: "ai", text: "Error fetching response." }]);
    }
    setInput("");
  };

  const renderFormattedText = (text) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          return !inline && match ? (
            <SyntaxHighlighter
              style={tomorrow}
              language={match[1]}
              PreTag="div"
              className="rounded-lg p-4"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>{children}</code>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div className="flex h-screen w-screen bg-slate-100 p-6">
      <div className="w-1/4 h-full bg-white rounded-xl shadow-lg p-5 flex flex-col">
        <h2 className="text-lg font-bold text-indigo-700">Chat AI+</h2>
        <div className="flex items-center mt-4">
          <UserButton afterSignOutUrl="/" className="w-12 h-12" />
          <span className="text-gray-700 font-medium px-4">{user?.fullName || "Guest"}</span>
        </div>
        <button className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">+ New Chat</button>
        <div className="relative mt-4">
          <input type="text" placeholder="Search..." className="w-full px-4 py-2 rounded-lg border" />
          <BsSearch className="absolute right-3 top-3 text-gray-500" />
        </div>
        <div className="mt-5 flex-1 overflow-y-auto">
          <p className="text-gray-600 text-sm">Your conversations</p>
          <ul className="mt-2 text-gray-800 space-y-2">
            {conversations.map((conv, index) => (
              <li key={index} className="flex justify-between items-center cursor-pointer hover:text-indigo-600">
                <span onClick={() => setSelectedIndex(index)}>📄 {conv.name}</span>
                <BsTrash className="text-red-500 cursor-pointer" onClick={() => deleteConversation(index)} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-3/4 h-full flex flex-col bg-white rounded-xl shadow-lg ml-6 p-6">
        <h3 className="text-lg font-bold text-indigo-700 mb-3">{conversations[selectedIndex]?.name}</h3>
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 rounded-md">
          {conversations[selectedIndex]?.messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} mb-2`}>
              <div className={`p-4 max-w-[70%] rounded-lg shadow-md ${msg.sender === "user" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-800"}`}>
                {renderFormattedText(msg.text)}
              </div>
            </div>
          ))}
          <div ref={chatRef}></div>
        </div>

        <form onSubmit={sendMessage} className="mt-4 flex items-center border rounded-lg p-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 px-4 py-2 rounded-lg focus:outline-none" placeholder="Ask me anything..." />
          <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700">
            <BsSend size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatbotContainer;
