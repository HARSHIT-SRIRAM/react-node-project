import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "./index.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false); // Toggle between login and registration
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "https://react-node-project-7thy.onrender.com/login",
        {
          username,
          password,
        }
      );
      Cookies.set("token", response.data.token, { expires: 1 });
      navigate("/");
    } catch (error) {
      setError("Invalid username or password.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "https://react-node-project-7thy.onrender.com/register",
        {
          username: registerUsername,
          password: registerPassword,
        }
      );
      // After successful registration, switch to login form
      setIsRegistering(false);
      setError("Registration successful. Please log in.");
    } catch (error) {
      setError("Registration failed. Try a different username.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h1>{isRegistering ? "Register" : "Login"}</h1>
        {error && <p className="error">{error}</p>}
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <>
              <div className="input-group">
                <label htmlFor="registerUsername">Username:</label>
                <input
                  type="text"
                  id="registerUsername"
                  value={registerUsername}
                  onChange={(e) => setRegisterUsername(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="registerPassword">Password:</label>
                <input
                  type="password"
                  id="registerPassword"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-button">
                Register
              </button>
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsRegistering(false)}>
                  Login
                </button>
              </p>
            </>
          )}
          {!isRegistering && (
            <>
              <div className="input-group">
                <label htmlFor="username">Username:</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label htmlFor="password">Password:</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="login-button">
                Login
              </button>
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => setIsRegistering(true)}>
                  Register
                </button>
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
