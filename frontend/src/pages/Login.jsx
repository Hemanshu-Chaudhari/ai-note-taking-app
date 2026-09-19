import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";
import api from "../services/api";

function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await api.post("/api/auth/login", {
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            localStorage.setItem("token", response.data.token);
            localStorage.setItem("user", JSON.stringify(response.data.user));

            navigate("/dashboard");

        } catch (error) {
            setMessage(
                error.response?.data?.message || "Invalid email or password"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-brand-logo">
                        <Sparkles size={24} />
                    </div>
                    <h2>Welcome to MindKeep</h2>
                    <p>Log in to access your smart notes & AI tools</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-field-wrapper">
                        <Mail size={16} className="field-icon" />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="input-field-wrapper">
                        <Lock size={16} className="field-icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button type="submit" className="btn-auth-submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 size={16} className="spin" />
                                <span>Logging in...</span>
                            </>
                        ) : (
                            <span>Log In</span>
                        )}
                    </button>
                </form>

                {message && (
                    <div className="auth-error-banner">
                        <span>{message}</span>
                    </div>
                )}

                <div className="auth-footer">
                    <span>Don't have an account?</span>{" "}
                    <Link to="/register">Create one</Link>
                </div>
            </div>
        </div>
    );
}

export default Login;