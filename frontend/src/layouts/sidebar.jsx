import { forwardRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { navbarLinks } from "@/constants";

import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

import { cn } from "@/utils/cn";

import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavClick = (path, label) => {
        if (label === 'Logout') {
            logout();
            navigate('/login');
            return;
        }
    };

    return (
        <aside
            ref={ref}
            className={cn(
                "fixed z-[100] flex h-full w-[240px] flex-col overflow-x-hidden border-r border-slate-300 bg-white [transition:_width_300ms_cubic-bezier(0.4,_0,_0.2,_1),_left_300ms_cubic-bezier(0.4,_0,_0.2,_1),_background-color_150ms_cubic-bezier(0.4,_0,_0.2,_1),_border_150ms_cubic-bezier(0.4,_0,_0.2,_1)] dark:border-slate-700 dark:bg-slate-900",
                collapsed ? "md:w-[70px] md:items-center" : "md:w-[240px]",
                collapsed ? "max-md:-left-full" : "max-md:left-0",
            )}
        >
            <div className="flex gap-x-3 p-3">
                <img
                    src={logoLight}
                    alt="Logoipsum"
                    className="dark:hidden"
                />
                <img
                    src={logoDark}
                    alt="Logoipsum"
                    className="hidden dark:block"
                />
                {!collapsed && <p className="text-lg font-medium text-slate-900 transition-colors dark:text-slate-50">Pharmaceutical</p>}
            </div>
            <div className="flex w-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden p-3 [scrollbar-width:_thin]">
                {navbarLinks.map((navbarLink) => (
                    <nav
                        key={navbarLink.title}
                        className={cn("sidebar-group", collapsed && "md:items-center")}
                    >
                        <p className={cn("sidebar-group-title", collapsed && "md:w-[45px]")}>{navbarLink.title}</p>
                        {navbarLink.links.map((link) => (
                            link.path ? (
                                <Link
                                    key={link.label}
                                    to={link.path}
                                    className={cn("sidebar-item", collapsed && "md:w-[45px]", location.pathname === link.path ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800')}
                                >
                                    <link.icon
                                        size={22}
                                        className="flex-shrink-0"
                                    />
                                    {!collapsed && <p className="whitespace-nowrap">{link.label}</p>}
                                </Link>
                            ) : (
                                <button
                                    key={link.label}
                                    onClick={() => handleNavClick(link.path, link.label)}
                                    className={cn("sidebar-item w-full", collapsed && "md:w-[45px]")}
                                >
                                    <link.icon
                                        size={22}
                                        className="flex-shrink-0"
                                    />
                                    {!collapsed && <p className="whitespace-nowrap">{link.label}</p>}
                                </button>
                            )
                        ))}
                    </nav>
                ))}
            </div>
        </aside>
    );
});

Sidebar.displayName = "Sidebar";

Sidebar.propTypes = {
    collapsed: PropTypes.bool,
};