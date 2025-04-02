import { Routes, Route, Navigate } from "react-router-dom";
import { SignedIn, SignedOut, SignIn, SignUp } from "@clerk/clerk-react";
import Landing from "./components/Landing";
import ChatbotContainer from "./components/ChatbotContainer";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/chat"
        element={
          <>
            <SignedIn>
              <ChatbotContainer />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/sign-in"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <SignIn routing="path" path="/sign-in" />
          </div>
        }
      />

      <Route
        path="/sign-up"
        element={
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <SignUp routing="path" path="/sign-up" />
          </div>
        }
      />
      <Route path="*" element={<h1>404 - Page Not Found</h1>} />
    </Routes>
  );
}

export default App;
