import { useTheme } from "@/hooks/use-theme";
import { ChevronsLeft, Moon, Search as SearchIcon, Sun, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import defaultProfileImg from "@/assets/profile-image.jpg";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { debounce } from "lodash";
import NotificationBell from "@/components/ui/NotificationBell";

export const Header = ({ collapsed, setCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Debounced search function
    const debouncedSearch = useRef(
        debounce(async (query) => {
            if (query.trim() === '') {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            try {
                const response = await apiService.searchDrugs(query);
                if (response && response.success) {
                    setSearchResults(response.data || []);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300)
    ).current;

    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        
        if (query.trim() !== '') {
            setIsSearching(true);
            debouncedSearch(query);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setShowResults(false);
    };

    const handleResultClick = (drug) => {
        // Navigate to the drug detail page or search results page
        navigate(`/analytics?drug=${encodeURIComponent(drug.code)}`);
        setShowResults(false);
        setSearchQuery('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            navigate(`/analytics?search=${encodeURIComponent(searchQuery)}`);
            setShowResults(false);
        }
    };

    // Function to get the correct profile image URL or imported image
    const getProfileImageUrl = () => {
        // If no user or no user image, return the default imported image
        if (!user || !user.image) {
            return defaultProfileImg;
        }
        
        // If it's already a full URL (for social logins), use it as is
        if (user.image.startsWith('http')) {
            return user.image;
        }
        
        // If it's a path starting with /uploads/profile-images, serve from /profile-images
        if (user.image.startsWith('/uploads/profile-images/')) {
            return `http://localhost:3000${user.image.replace('/uploads', '')}`;
        }
        
        // If it's a path starting with /uploads, serve from /uploads
        if (user.image.startsWith('/uploads/')) {
            return `http://localhost:3000${user.image}`;
        }
        
        // If it's a path to frontend assets or default image, return the imported default image
        if (user.image.includes('profile-image.jpg') || user.image.includes('/src/assets/') || user.image === 'profile-image.jpg') {
            return defaultProfileImg;
        }
        
        // For any other local paths, assume they're from the backend
        return `http://localhost:3000${user.image.startsWith('/') ? '' : '/'}${user.image}`;
    };

    return (
        <header className="relative z-10 flex h-[60px] items-center justify-between bg-white px-4 shadow-md transition-colors dark:bg-slate-900">
            <div className="flex items-center gap-x-3">
                <button
                    className="btn-ghost size-10"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronsLeft className={collapsed && "rotate-180"} />
                </button>
                <div className="relative w-64" ref={searchRef}>
                    <div className="input relative">
                        <SearchIcon
                            size={20}
                            className="text-slate-300 absolute left-3 top-1/2 transform -translate-y-1/2"
                        />
                        <input
                            type="text"
                            name="search"
                            id="search"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery && setShowResults(true)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search drugs..."
                            className="w-full pl-10 pr-8 py-2 bg-transparent text-slate-900 outline-0 placeholder:text-slate-300 dark:text-slate-50"
                        />
                        {searchQuery && (
                            <button
                                onClick={handleClearSearch}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>
                    
                    {/* Search Results Dropdown */}
                    {showResults && searchQuery && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-md shadow-lg max-h-60 overflow-auto">
                            {isSearching ? (
                                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                    Searching...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <ul>
                                    {searchResults.map((drug) => (
                                        <li
                                            key={drug.id}
                                            className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                            onClick={() => handleResultClick(drug)}
                                        >
                                            <div className="font-medium text-slate-900 dark:text-white">
                                                {drug.name}
                                            </div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                {drug.code}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : searchQuery.trim() !== '' ? (
                                <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
                                    No results found for "{searchQuery}"
                                </div>
                            ) : null}
                        </div>
                    )}
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
                <NotificationBell />
                <div className="relative flex-shrink-0">
                    <div 
                        className="overflow-hidden rounded-full border-2 border-slate-200 dark:border-slate-700 w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                        style={{ cursor: 'pointer' }}
                    >
                        <img
                            src={getProfileImageUrl()}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                                console.error('Error loading profile image:', e.target.src);
                                e.target.onerror = null; // Prevent infinite loop
                                e.target.src = defaultProfileImg;
                            }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    collapsed: PropTypes.bool,
    setCollapsed: PropTypes.func,
};