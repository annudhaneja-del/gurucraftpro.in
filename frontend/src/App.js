import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./lib/auth";
import { CartProvider } from "./lib/cart";
import { Toaster } from "sonner";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppFloat from "./components/WhatsAppFloat";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Services from "./pages/Services";
import ServiceDetail from "./pages/ServiceDetail";
import DesignStudio from "./pages/DesignStudio";
import Shop from "./pages/Shop";
import Learn from "./pages/Learn";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import Checkout from "./pages/Checkout";
import DressingRoom from "./pages/DressingRoom";
import ARArtwork from "./pages/ARArtwork";

function Layout({ children }) {
  return (
    <div className="App">
      <Navbar />
      <main className="pt-16">{children}</main>
      <WhatsAppFloat />
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" theme="dark" richColors />
          <Routes>
            <Route path="/" element={<Layout><Home /></Layout>} />
            <Route path="/services" element={<Layout><Services /></Layout>} />
            <Route path="/services/:slug" element={<Layout><ServiceDetail /></Layout>} />
            <Route path="/studio" element={<Layout><DesignStudio /></Layout>} />
            <Route path="/shop" element={<Layout><Shop /></Layout>} />
            <Route path="/learn" element={<Layout><Learn /></Layout>} />
            <Route path="/contact" element={<Layout><Contact /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/signup" element={<Layout><Signup /></Layout>} />
            <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
            <Route path="/dressing-room" element={<Layout><DressingRoom /></Layout>} />
            <Route path="/ar-view" element={<Layout><ARArtwork /></Layout>} />
            <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute admin><Layout><Admin /></Layout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
