import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthInit } from "./lib/useAuthInit";
import { useCatalogInit } from "./lib/useCatalogInit";
import { useCMSInit } from "./lib/useCMSInit";
import CustomerLayout from "./components/layout/CustomerLayout";
import AdminLayout from "./components/admin/AdminLayout";
import AdminGuard from "./components/admin/AdminGuard";

import Home from "./pages/customer/Home";
import ProductListing from "./pages/customer/ProductListing";
import ProductDetail from "./pages/customer/ProductDetail";
import Cart from "./pages/customer/Cart";
import Checkout from "./pages/customer/Checkout";
import OrderSuccess from "./pages/customer/OrderSuccess";
import Wishlist from "./pages/customer/Wishlist";
import Login from "./pages/customer/Login";
import Register from "./pages/customer/Register";
import Account from "./pages/customer/Account";
import AccountOrders from "./pages/customer/AccountOrders";
import AccountOrderDetail from "./pages/customer/AccountOrderDetail";
import AccountWishlist from "./pages/customer/AccountWishlist";
import AccountProfile from "./pages/customer/AccountProfile";
import AccountAddresses from "./pages/customer/AccountAddresses";
import AccountReviews from "./pages/customer/AccountReviews";
import TrackOrder from "./pages/customer/TrackOrder";
import FAQPage from "./pages/customer/FAQPage";
import NotFound from "./pages/customer/NotFound";

import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import HomepageCMS from "./pages/admin/HomepageCMS";
import ProductsAdmin from "./pages/admin/ProductsAdmin";
import ProductEditor from "./pages/admin/ProductEditor";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin";
import CollectionsAdmin from "./pages/admin/CollectionsAdmin";
import OrdersAdmin from "./pages/admin/OrdersAdmin";
import OrderDetailAdmin from "./pages/admin/OrderDetailAdmin";
import CustomersAdmin from "./pages/admin/CustomersAdmin";
import CouponsAdmin from "./pages/admin/CouponsAdmin";
import OffersAdmin from "./pages/admin/OffersAdmin";
import InventoryAdmin from "./pages/admin/InventoryAdmin";
import MediaAdmin from "./pages/admin/MediaAdmin";
import AnalyticsAdmin from "./pages/admin/AnalyticsAdmin";
import ReportsAdmin from "./pages/admin/ReportsAdmin";
import SettingsAdmin from "./pages/admin/SettingsAdmin";
import NotificationsAdmin from "./pages/admin/NotificationsAdmin";
import ReviewsAdmin from "./pages/admin/ReviewsAdmin";
import SupportAdmin from "./pages/admin/SupportAdmin";
import PermissionsAdmin from "./pages/admin/PermissionsAdmin";
import AuditLogsAdmin from "./pages/admin/AuditLogsAdmin";
import EmailTemplatesAdmin from "./pages/admin/EmailTemplatesAdmin";
import ShippingAdmin from "./pages/admin/ShippingAdmin";
import FAQsAdmin from "./pages/admin/FAQsAdmin";
import ErrorLogsAdmin from "./pages/admin/ErrorLogsAdmin";

export default function App() {
  useAuthInit();
  useCatalogInit();
  useCMSInit();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CustomerLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductListing />} />
          <Route path="/collections/:slug" element={<ProductListing />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:orderId" element={<OrderSuccess />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track" element={<TrackOrder />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/account" element={<Account />}>
            <Route index element={<AccountOrders />} />
            <Route path="orders" element={<AccountOrders />} />
            <Route path="orders/:orderId" element={<AccountOrderDetail />} />
            <Route path="wishlist" element={<AccountWishlist />} />
            <Route path="profile" element={<AccountProfile />} />
            <Route path="addresses" element={<AccountAddresses />} />
            <Route path="reviews" element={<AccountReviews />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route element={<AdminGuard />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="homepage" element={<HomepageCMS />} />
            <Route path="products" element={<ProductsAdmin />} />
            <Route path="products/new" element={<ProductEditor />} />
            <Route path="products/:id" element={<ProductEditor />} />
            <Route path="categories" element={<CategoriesAdmin />} />
            <Route path="collections" element={<CollectionsAdmin />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="orders/:id" element={<OrderDetailAdmin />} />
            <Route path="customers" element={<CustomersAdmin />} />
            <Route path="coupons" element={<CouponsAdmin />} />
            <Route path="offers" element={<OffersAdmin />} />
            <Route path="inventory" element={<InventoryAdmin />} />
            <Route path="media" element={<MediaAdmin />} />
            <Route path="analytics" element={<AnalyticsAdmin />} />
            <Route path="reports" element={<ReportsAdmin />} />
            <Route path="settings" element={<SettingsAdmin />} />
            <Route path="notifications" element={<NotificationsAdmin />} />
            <Route path="reviews" element={<ReviewsAdmin />} />
            <Route path="support" element={<SupportAdmin />} />
            <Route path="permissions" element={<PermissionsAdmin />} />
            <Route path="audit-logs" element={<AuditLogsAdmin />} />
            <Route path="email-templates" element={<EmailTemplatesAdmin />} />
            <Route path="shipping" element={<ShippingAdmin />} />
            <Route path="faqs" element={<FAQsAdmin />} />
            <Route path="error-logs" element={<ErrorLogsAdmin />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
