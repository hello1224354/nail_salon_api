import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./index.css";
import App from "./App";
import HomePage from "./pages/HomePage";
import BookPage from "./pages/BookPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route element={<App />}>
                    <Route
                        path="/"
                        element={<HomePage />}
                    />

                    <Route
                        path="/book"
                        element={<BookPage />}
                    />

                    <Route
                        path="/appointments"
                        element={<AppointmentsPage />}
                    />

                    <Route
                        path="/profile"
                        element={<ProfilePage />}
                    />

                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>
);