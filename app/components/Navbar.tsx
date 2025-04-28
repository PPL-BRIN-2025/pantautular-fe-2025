"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation"; 
import { User } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui-profile/dropdown-menu";
import PasswordSettings from "./password-settings";

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href} 
      className={`h-full flex items-center ${isActive ? "font-bold text-[#1e3a8a]" : "text-[#0069cf]"}`}
    >
      {label}
    </Link>
  );
};

const ProfileIcon = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 shadow-md ml-8">
          <User className="h-6 w-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <span className="text-gray-800">Pengaturan</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <span className="text-red-500">Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showSettings && <PasswordSettings onClose={() => setShowSettings(false)} />}
    </>
  );
};

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 w-full z-10 flex items-center justify-between px-16 py-6 bg-white shadow-[0_5px_15px_rgba(0,0,0,0.3)] h-20">
      <div className="flex items-center h-20">
        <Image src="/logo-pantautular.svg" alt="PantauTular Logo" width={120} height={30} />
      </div>

      <div className="hidden md:flex items-center gap-8 h-20">
        <div className="flex items-center gap-20">
          <NavLink href="/" label="Beranda" />
          <NavLink href="/map" label="Peta Sebaran" />
          <NavLink href="/about" label="Tentang Kami" />
          <NavLink href="/help" label="Bantuan" />
        </div>
        <ProfileIcon />
      </div>
    </nav>
  );
};

export default Navbar;
