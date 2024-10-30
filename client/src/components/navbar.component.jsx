import { Link, Outlet, useNavigate } from 'react-router-dom';
import logo from '../imgs/logo.png'
import { useContext, useState } from 'react';
import { UserContext } from '../App';
import UserNavigationPanel from './user-navigation.component';

const Navbar = () => {
    const [searchBoxVisibility, setSearchBoxVisibility] = useState(false);
    const { userAuth: { access_token, profile_img } } = useContext(UserContext);
    const [userNavPanel, setUserNavPanel] = useState(false);
    const navigate = useNavigate();

    const handleSearchFun = (e) => {
        let query = e.target.value;
        console.log(query);
        if (e.keyCode == 13 && query.length) {
            navigate(`/search/${query}`);
        }
    }
    return (
        <>
            <nav className='z-10 sticky top-0 flex items-center gap-12 w-full px-[5vw] py-5 h-[80px] border-b border-grey bg-white'>
                <Link to="/" className='flex-none w-10'>
                    <img src={logo} className='w-full' alt="" />
                </Link>

                <div className={`absolute w-full left-0 top-full mt-0 border-b border-gray-300 py-2 px-[5vw] md:relative md:border-0 md:inset-0 md:opacity-100 ${searchBoxVisibility ? "opacity-100 pointer-events-auto duration-100" : "opacity-0"}`}>
                    <input type="text" placeholder='Search'
                        className='w-full md:w-auto bg-gray-300 p-4 pl-6 pr-[12%] md:pr-6 rounded-full placeholder:text-dark-grey' onKeyDown={handleSearchFun} />
                    <i className='fi fi-rr-search absolute md:hidden right-[10%]  md:pointer-events-none md:left-12 top-1/2 -translate-y-1/2 text-2xl md:text-xl'></i>
                </div>

                <div className='flex items-center gap-3 md:gap-6 ml-auto'>
                    <button className='md:hidden bg-grey w-12 h-12 rounded-full flex items-center justify-center ' onClick={() => {
                        setSearchBoxVisibility(!searchBoxVisibility)
                    }}>
                        <i className='fi fi-rr-search text-xl'></i>
                    </button>

                    <Link to="/editor" className='hidden md:flex rounded-full gap-2 link'>
                        <i className='fi fi-rr-file-edit'></i>
                        <p>Write</p>
                    </Link>
                    {
                        access_token ? <>
                            <Link to="/dashboard/notification">
                                <button className='w-12 h-12 rounded-full bg-grey relative hover:bg-black/10'>
                                    <i className='fi fi-rr-bell text-2xl block mt-1'></i>
                                </button>
                            </Link>

                            <div className='relative'>
                                <button className='w-12 h-12 mt-1' onClick={() => {
                                    setUserNavPanel(!userNavPanel);
                                }}>
                                    <img src={profile_img} className='w-full h-full object-cover rounded-full' />
                                </button>
                                {userNavPanel ? <UserNavigationPanel /> : ""}
                            </div>
                        </> : <>
                            <Link className='btn-dark py-2' to="/signin"
                            >
                                Sign In
                            </Link>
                            <Link className='btn-light hidden md:block py-2' to="/signup"
                            > Sign Up
                            </Link>
                        </>
                    }

                </div>


            </nav>
            <Outlet />
        </>
    )
}

export default Navbar;