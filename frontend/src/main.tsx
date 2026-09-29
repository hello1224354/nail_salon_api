import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";
import "./index.css";
import App from "./App";
import AdminLayout from "./layouts/AdminLayout";
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import BookPage from "./pages/BookPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import AppointmentDetailsPage from "./pages/AppointmentDetailsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import AdminAppointmentsPage from "./pages/admin/AdminAppointmentsPage";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route
                    path="/admin"
                    element={<AdminLayout />}
                >
                    <Route
                        index
                        element={
                            <Navigate
                                to="appointments"
                                replace
                            />
                        }
                    />

                    <Route
                        path="appointments"
                        element={<AdminAppointmentsPage />}
                    />
                </Route>

                <Route element={<App />}>
                    <Route
                        path="/"
                        element={<HomePage />}
                    />

                    <Route
                        path="/services"
                        element={<ServicesPage />}
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
                        path="/appointments/details"
                        element={<AppointmentDetailsPage />}
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

                    <Route
                        path="*"
                        element={<NotFoundPage />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    </StrictMode>
);