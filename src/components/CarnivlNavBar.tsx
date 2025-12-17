// src/components/CarnivlNavBar.tsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Calendar,
  Shield,
  Info,
  Podcast,
  Images,
  Briefcase,
  BookMarked,
  Menu,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


const items = [
  { title: "Home", url: "#home", icon: Home, type: "anchor" },
  { title: "About", url: "#about", icon: Info, type: "anchor" },
  // { title: "Projects", url: "#opportunities", icon: Briefcase, type: "anchor" },
  { title: "Seminars", url: "#lectures", icon: Podcast, type: "anchor" },
  { title: "Events", url: "#events", icon: Calendar, type: "anchor" },
  { title: "Members", url: "#members", icon: Users, type: "anchor" },
  { title: "Gallery", url: "#gallery", icon: Images, type: "anchor" },
  { title: "Resources", url: "/resources", icon: BookMarked, type: "route" },
  { title: "Admin", url: "/admin", icon: Shield, type: "route" },
];

const CarnivalNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname === '/') {
        let currentSection = '';
        const scrollPosition = window.scrollY + 150; 

        items.forEach(item => {
          if (item.type === 'anchor') {
            const element = document.querySelector(item.url);
            if (element) {
              const { offsetTop, offsetHeight } = element as HTMLElement;
              if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                currentSection = item.url;
              }
            }
          }
        });
        setActiveSection(currentSection);
      } else {
        setActiveSection('');
      }
    };

    if (location.pathname === '/') {
      window.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.pathname]);

  const handleItemClick = (item: any) => {
    if (item.type === "route") {
      navigate(item.url);
    } else if (item.type === "anchor") {
      if (location.pathname !== "/") {
        navigate("/");
        setTimeout(() => {
          const element = document.querySelector(item.url);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const element = document.querySelector(item.url);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };
  
  const homeItem = items.find(item => item.title === 'Home');
  const adminItem = items.find(item => item.title === 'Admin');
  // Navigation items now explicitly exclude Home and Admin for the main desktop links
  const navItems = items.filter(item => item.title !== 'Home' && item.title !== 'Admin');

  return (
    <nav className="fixed top-4 left-4 right-4 z-50 bg-white/30 backdrop-blur-md shadow-lg rounded-xl px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Home Button (Left Side) */}
        {homeItem && (
          <button
            onClick={() => handleItemClick(homeItem)}
            className={`flex items-center transition-colors text-lg font-semibold ${activeSection === homeItem.url ? 'text-[#ff007f]' : 'text-gray-700 hover:text-[#ff007f]'}`}
          >
            {React.createElement(homeItem.icon, { className: "mr-2", size: 20 })}
            <span className="hidden md:inline">{homeItem.title}</span>
          </button>
        )}

        {/* Desktop Navigation Links (Center) */}
        <div className="hidden md:flex flex-wrap justify-center gap-4 text-sm sm:text-base font-medium">
          {navItems.map((item) => (
            <button
              key={item.title}
              onClick={() => handleItemClick(item)}
              className={`flex items-center transition-colors ${activeSection === item.url ? 'text-[#ff007f]' : 'text-gray-700 hover:text-[#ff007f]'}`}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* Right Side Items */}
        <div className="flex items-center gap-2">
          {/* Admin Icon for Desktop */}
          {adminItem && (
            <button
              onClick={() => handleItemClick(adminItem)}
              className="hidden md:flex text-gray-600 hover:text-[#ff007f] transition-colors"
              aria-label="Admin"
            >
              {React.createElement(adminItem.icon, { size: 24 })}
            </button>
          )}

          {/* Mobile Dropdown Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                  {navItems.map((item) => (
                    <DropdownMenuItem key={item.title} onClick={() => handleItemClick(item)}>
                      {React.createElement(item.icon, { className: "mr-2 h-4 w-4" })}
                      <span>{item.title}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                {adminItem && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleItemClick(adminItem)}>
                      {React.createElement(adminItem.icon, { className: "mr-2 h-4 w-4" })}
                      <span>{adminItem.title}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default CarnivalNavBar;