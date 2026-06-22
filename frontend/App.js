import { useState } from "react";
import Home from "./Home";
import Jobs from "./Jobs";
import Login from "./Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          margin: "20px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#ef4444",
          color: "white",
          cursor: "pointer",
        }}
      >
        Logout
      </button>

      <Home />
      <Jobs />
    </div>
  );
}

export default App;