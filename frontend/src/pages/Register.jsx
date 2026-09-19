import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Eye, EyeOff, Loader2, User, Mail, Lock, CheckCircle2 } from "lucide-react";
import api from "../services/api";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            setMessage("Password must be at least 6 characters long");
            setIsSuccess(false);
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const response = await api.post("/api/auth/register", {
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password
            });

            setIsSuccess(true);
            setMessage("Account created! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (error) {
            setIsSuccess(false);
            setMessage(
                error.response?.data?.message || "Registration failed"
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
                    <h2>Create Account</h2>
                    <p>Start your AI-enhanced notes journey</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="input-field-wrapper">
                        <User size={16} className="field-icon" />
                        <input
                            type="text"
                            name="name"
                            placeholder="Full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                            placeholder="Create password (min 6 chars)"
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
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <span>Create Free Account</span>
                        )}
                    </button>
                </form>

                {message && (
                    <div className={`auth-error-banner ${isSuccess ? "auth-success-banner" : ""}`}>
                        {isSuccess ? <CheckCircle2 size={16} /> : null}
                        <span>{message}</span>
                    </div>
                )}

                <div className="auth-footer">
                    <span>Already have an account?</span>{" "}
                    <Link to="/login">Log In</Link>
                </div>
            </div>
        </div>
    );
}

export default Register;