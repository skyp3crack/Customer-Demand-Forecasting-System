import { useTheme } from "@/hooks/use-theme";
import { Bell, ChevronsLeft, Moon, Search, Sun } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import defaultProfileImg from "@/assets/profile-image.jpg";
import PropTypes from "prop-types";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();

    // Function to get the correct profile image URL
    const getProfileImageUrl = () => {
        if (!user?.image) {
            return defaultProfileImg;
        }

        // If it's already a full URL, return as is
        if (user.image.startsWith('http://') || user.image.startsWith('https://')) {
            return user.image;
        }

        // If it's a path starting with /uploads, ensure proper URL construction
        if (user.image.startsWith('/uploads/')) {
            return `http://localhost:3000${user.image}`;
        }

        // If it's just a filename, assume it's in the uploads folder
        return `http://localhost:3000/uploads/${user.image}`;
    };

    const profileImageSrc = getProfileImageUrl();

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={collapsed && "rotate-180"} />
                </button>
                <div className="input">
                    <Search
                        size={20}
                        className="text-slate-300"
                    />
                    <input
                        type="text"
                        name="search"
                        id="search"
                        placeholder="Search..."
                        className="w-full bg-transparent text-slate-900 outline-0 placeholder:text-slate-300 dark:text-slate-50"
                    />
                </div>
            </div>
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                    <Sun
                        size={20}
                        className="dark:hidden"
                    />
                    <Moon
                        size={20}
                        className="hidden dark:block"
                    />
                </button>
                <button className="btn-ghost size-10">
                    <Bell size={20} />
                </button>
                <button className="size-10 overflow-hidden rounded-full">
                    <img
                        src={profileImageSrc}
                        alt={user ? `${user.name || user.email} profile` : "profile image"}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            // Fallback to default image if the profile image fails to load
                            e.target.src = defaultProfileImg;
                        }}
                    />
                </button>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};