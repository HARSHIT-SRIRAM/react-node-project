import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { ClipLoader } from "react-spinners";
import "./index.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(
          "https://react-node-project-7thy.onrender.com/products"
        );
        setProducts(response.data);
      } catch (error) {
        setError("Error fetching products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = async (product) => {
    const token = Cookies.get("token");
    if (!token) {
      alert("You must be logged in to add items to the cart.");
      return;
    }

    try {
      await axios.post(
        "https://react-node-project-7thy.onrender.com/Carts/add",
        { product_id: product.id, quantity: 1 },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(`Added ${product.name} to the cart`);
    } catch (error) {
      console.error(
        "Error adding item to cart:",
        error.response?.data || error.message
      );
      alert(
        `Error adding item to cart: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <ClipLoader color="#007bff" loading={loading} size={50} />
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <div key={product.id} className="product">
          <h2>{product.name}</h2>
          <p>{product.description}</p>
          <p className="price">Price: ${product.price.toFixed(2)}</p>
          <p className="stock">Stock: {product.stock}</p>
          <button
            className="add-to-cart-button"
            onClick={() => handleAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
};

export default Product;
