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
import AdminServicesPage from "./pages/admin/AdminServicesPage";
import AdminServiceFormPage from "./pages/admin/AdminServiceFormPage";
import AdminBranchesPage from "./pages/admin/AdminBranchesPage";
import AdminBranchFormPage from "./pages/admin/AdminBranchFormPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";

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

                    <Route
                        path="services"
                        element={<AdminServicesPage />}
                    />

                    <Route
                        path="services/new"
                        element={<AdminServiceFormPage />}
                    />

                    <Route
                        path="services/:id/edit"
                        element={<AdminServiceFormPage />}
                    />

                    <Route
                        path="branches"
                        element={<AdminBranchesPage />}
                    />

                    <Route
                        path="branches/new"
                        element={<AdminBranchFormPage />}
                    />

                    <Route
                        path="branches/:id/edit"
                        element={<AdminBranchFormPage />}
                    />

                    <Route
                        path="staff"
                        element={<AdminStaffPage />}
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