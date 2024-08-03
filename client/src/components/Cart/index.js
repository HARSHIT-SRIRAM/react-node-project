import React, { Component } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import "./index.css";

class Cart extends Component {
  state = {
    cart: [],
    total: 0,
    notification: "",
  };

  getToken = () => Cookies.get("token");

  showNotification = (message) => {
    this.setState({ notification: message });
    setTimeout(() => this.setState({ notification: "" }), 3000);
  };

  updateCartState = (cart) => {
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    this.setState({ cart, total });
  };

  loadCart = async () => {
    const token = this.getToken();
    if (!token) {
      this.showNotification("You must be logged in to view the cart.");
      return;
    }

    try {
      const { data } = await axios.get("http://localhost:5000/carts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      this.updateCartState(data);
    } catch {
      this.showNotification("Error fetching cart items.");
    }
  };

  handleQuantityUpdate = async (id, newQuantity) => {
    if (newQuantity <= 0) return;

    try {
      const token = this.getToken();
      if (!token) {
        this.showNotification("You must be logged in to update the cart.");
        return;
      }

      await axios.post(
        "http://localhost:5000/carts/update",
        { product_id: id, quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCart = this.state.cart.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      );
      this.updateCartState(updatedCart);
    } catch {
      this.showNotification("Error updating item quantity.");
    }
  };

  handleIncrease = (id, currentQuantity) => {
    this.handleQuantityUpdate(id, currentQuantity + 1);
  };

  handleDecrease = (id, currentQuantity) => {
    if (currentQuantity > 1) {
      this.handleQuantityUpdate(id, currentQuantity - 1);
    }
  };

  handleRemove = async (id) => {
    try {
      const token = this.getToken();
      if (!token) {
        this.showNotification("You must be logged in to remove items.");
        return;
      }

      await axios.delete(`http://localhost:5000/carts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedCart = this.state.cart.filter((item) => item.id !== id);
      this.updateCartState(updatedCart);
      this.showNotification("Item removed successfully.");
    } catch {
      this.showNotification("Error removing item.");
    }
  };

  handleOrder = async () => {
    if (this.state.total <= 0) {
      this.showNotification("Add items  into cart");
      return;
    }

    try {
      const token = this.getToken();
      if (!token) {
        this.showNotification("You must be logged in to place an order.");
        return;
      }

      const orderResponse = await axios.post(
        "http://localhost:5000/orders",
        { total: this.state.total, status: "Pending" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const clearCartResponse = await axios.delete(
        "http://localhost:5000/cartsclear",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (orderResponse.status === 201 && clearCartResponse.status === 200) {
        this.setState({ cart: [], total: 0 });

        if (typeof this.props.onOrderPlaced === "function") {
          this.props.onOrderPlaced();
        } else {
          console.error("onOrderPlaced is not a function or not provided.");
        }

        this.showNotification("Order placed successfully.");
      } else {
        this.showNotification("Order creation failed.");
      }
    } catch (error) {
      console.error(
        "Order Error:",
        error.response ? error.response.data : error.message
      );
      this.showNotification("Order creation failed.");
    }
  };

  componentDidMount() {
    this.loadCart();
  }

  render() {
    return (
      <div className="cart-container">
        {this.state.notification && (
          <p className="notification">{this.state.notification}</p>
        )}
        <ul className="cart-items">
          {this.state.cart.map((item) => (
            <li key={item.id} className="cart-item">
              <span className="item-name">{item.name}</span>
              <div className="item-quantity">
                <button
                  className="quantity-button"
                  onClick={() => this.handleIncrease(item.id, item.quantity)}
                >
                  +
                </button>
                <span>{item.quantity}</span>
                <button
                  className="quantity-button"
                  onClick={() => this.handleDecrease(item.id, item.quantity)}
                >
                  -
                </button>
              </div>
              <span className="item-price">${item.price.toFixed(2)}</span>
              <button
                className="remove-button"
                onClick={() => this.handleRemove(item.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <h2>Total Amount: ${this.state.total.toFixed(2)}</h2>
        <button onClick={this.handleOrder}>Place Order</button>
      </div>
    );
  }
}

export default Cart;
