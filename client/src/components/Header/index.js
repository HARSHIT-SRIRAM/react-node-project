import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import "./index.css";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = () => !!Cookies.get("token");

  const handleLogout = async () => {
    try {
      const token = Cookies.get("token");
      if (token) {
        await axios.post(
          "http://localhost:5000/logout",
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      Cookies.remove("token");
      navigate("/");
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <h1>simple BUY</h1>
      </div>
      <nav className="nav">
        {location.pathname !== "/" && (
          <Link to="/" className="nav-link">
            Products
          </Link>
        )}
        {isAuthenticated() ? (
          <>
            <Link to="/order" className="nav-link">
              Orders
            </Link>
            <Link to="/cart" className="nav-link cart-link">
              <FontAwesomeIcon icon={faShoppingCart} />
            </Link>
            <button className="nav-link logout-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-link">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
