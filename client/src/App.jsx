import Navbar from "./components/navbar.component";
import './index.css';
import { Route, Routes } from "react-router-dom";
import UserAuthForm from "./pages/userAuthForm.page";
import { Toaster } from "react-hot-toast";
import { createContext, useEffect, useState } from "react";
import { lockInSession } from "./common/session";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import Editor from "./pages/editor.pages";
import PageNotFound from "./pages/404.page";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";

export const UserContext = createContext();

const App = () => {
    const [userAuth, setUserAuth] = useState({ access_token: null, profile_img: null, username: null, fullname: null });

    useEffect(() => {
        // Check if user data is available in session storage
        let userInSession = lockInSession("user");
        if (userInSession) {
            setUserAuth(JSON.parse(userInSession)); // Set user from session if exists
        }
    }, []);

    return (
        <UserContext.Provider value={{ userAuth, setUserAuth }}>
            {/* Display toast notifications */}
            <Toaster position="top-right" />

            {/* Define application routes */}
            <Routes>
                {/* Define root route with Navbar */}
                <Route path="/editor" element={<Editor />}></Route>
                <Route path="/blog/editor/:blog_id" element={<Editor />}></Route>
                <Route path="/" element={<Navbar />}>
                    {/* Nested routes for sign-in and sign-up */}
                    <Route index element={<HomePage />} />
                    <Route path="signin" element={<UserAuthForm type="signin" />} />
                    <Route path="signup" element={<UserAuthForm type="signup" />} />
                    <Route path="search/:query" element={<SearchPage />} />
                    <Route path="/user/:id" element={<ProfilePage />} />
                    <Route path="/blog/:blog_id" element={<BlogPage/>}/>
                    <Route path="*" element={<PageNotFound />} />
                </Route>
            </Routes>
        </UserContext.Provider>
    );
}

export default App;
