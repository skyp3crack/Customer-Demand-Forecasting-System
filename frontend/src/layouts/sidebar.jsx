import { forwardRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { navbarLinks } from "@/constants";

import logoLight from "@/assets/logo-light.svg";
import logoDark from "@/assets/logo-dark.svg";

import { cn } from "@/utils/cn";

import PropTypes from "prop-types";

export const Sidebar = forwardRef(({ collapsed }, ref) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleNavClick = (path, label) => {
        if (label === 'Logout') {
            logout();
            navigate('/login');
            return;
        }
    };

    // Filter navigation items based on user role
    const filteredNavbarLinks = navbarLinks.map(section => ({
        ...section,
        links: section.links.filter(link => {
            // If no roles are specified, show to all
            if (!link.roles) return true;
            // Check if user's role is in the allowed roles
            return user?.RoleId && link.roles.includes(user.RoleId);
        })
    })).filter(section => section.links.length > 0); // Remove empty sections

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
                {filteredNavbarLinks.map((navbarLink) => (
                    <nav key={navbarLink.title} className="flex flex-col gap-y-1">
                        {!collapsed && (
                            <h3 className="mb-1 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                {navbarLink.title}
                            </h3>
                        )}
                        <ul className="flex flex-col gap-y-1">
                            {navbarLink.links.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        to={link.path || "#"}
                                        onClick={(e) => {
                                            if (!link.path) {
                                                e.preventDefault();
                                                handleNavClick(link.path, link.label);
                                            }
                                        }}
                                        className={cn(
                                            "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            location.pathname === link.path
                                                ? "bg-[#B13BFF] text-black dark:bg-[#471396] dark:text-white"
                                                : "text-black hover:text-black dark:text-white dark:hover:text-white"
                                        )}
                                    >
                                        <link.icon className="h-5 w-5 shrink-0 text-current" />
                                        {!collapsed && <span>{link.label}</span>}
                                    </Link>
                                </li>
                            ))}
                        </ul>
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