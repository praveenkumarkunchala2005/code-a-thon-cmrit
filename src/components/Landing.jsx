import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6">
      <h1 className="text-5xl font-bold mb-4">Welcome to Chat A.I+</h1>
      <p className="text-lg mb-6 text-gray-200">Your personal AI chatbot assistant</p>
      <Link to="/chat">
        <button className="bg-white text-indigo-600 py-3 px-8 rounded-full text-lg font-semibold hover:bg-gray-200 transition">
          Get Started
        </button>
      </Link>
    </div>
  );
};

export default Landing;
