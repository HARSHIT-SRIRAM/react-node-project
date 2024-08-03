import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import "./index.css";

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [orderDetails, setOrderDetails] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = Cookies.get("token");
        if (!token) throw new Error("No token found");

        const response = await axios.get("http://localhost:5000/orders", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (Array.isArray(response.data)) {
          setOrders(response.data);
        } else {
          throw new Error("Unexpected response format");
        }
      } catch (error) {
        setError(
          "Error fetching orders: " + (error.response?.data || error.message)
        );
      }
    };

    fetchOrders();
  }, []);

  const cancelOrder = async (orderId) => {
    try {
      const token = Cookies.get("token");
      if (!token) throw new Error("No token found");

      await axios.delete(`http://localhost:5000/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders((prevOrders) =>
        prevOrders.filter((order) => order.id !== orderId)
      );

      if (orderDetails?.id === orderId) {
        setOrderDetails(null);
      }
    } catch (error) {
      setError(
        "Error canceling order: " + (error.response?.data || error.message)
      );
    }
  };

  return (
    <div className="order-container">
      {error && <p className="error">{error}</p>}

      <section className="orders">
        <h2>Orders</h2>
        {orders.length > 0 ? (
          <ul className="orders-list">
            {orders.map((order) => (
              <li key={order.id}>
                <div>
                  Order ID: {order.id}, Total: ${order.total.toFixed(2)},
                  Status: {order.status}
                  {order.status === "Pending" && (
                    <button
                      onClick={() => cancelOrder(order.id)}
                      className="cancel-order-button"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No orders found.</p>
        )}
      </section>

      {orderDetails && (
        <div className="order-details">
          <h2>Order Details for Order ID: {orderDetails.id}</h2>
          <ul>
            {orderDetails.products?.map((product) => (
              <li key={product.id}>
                Product ID: {product.id}, Quantity: {product.quantity}, Price: $
                {product.price.toFixed(2)}
              </li>
            )) || <p>No products found.</p>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Order;
