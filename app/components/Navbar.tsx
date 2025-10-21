'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation"; 
import { User, ChevronDown, ArrowUpRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui-profile/dropdown-menu";
import PasswordSettings from "./password-settings";
import { useAuth } from '../auth/hooks/useAuth';

export default function Navbar() {
  return (
    <NavbarContent />
  );
}

export const ProfileIcon = ({ logout }: { logout: () => void }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 shadow-md ml-8"
          aria-label="Pengaturan profil"
          title="Pengaturan profil"
        >
          <User className="h-6 w-6" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setShowSettings(true)}>
            <span className="text-gray-800">Pengaturan</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <span className="text-red-500">Keluar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showSettings && <PasswordSettings onClose={() => setShowSettings(false)} />}
    </>
  );
};

type RoleNavLink = {
  label: string;
  href: string;
  disabled?: boolean;
  description?: string;
};

const DEFAULT_ROLE_LINKS: RoleNavLink[] = [{ label: "Dashboard", href: "/dashboard" }];

const ROLE_NAV_LINKS: Record<string, RoleNavLink[]> = {
  ADMIN: [
    { label: "Admin Dashboard", href: "/admin-dashboard" },
    { label: "Dashboard Kurator", href: "/curator-dashboard" },
    { label: "Role Management", href: "/admin-role-management" },
    { label: "User Log", href: "/admin-user-log-menu" },
  ],
  EXP_USER: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Peta Sebaran", href: "/map" },
  ],
  CURATOR: [
    { label: "Add Data", href: "/curator-add-data" },
    { label: "Delete Data", href: "/curator-edit-delete-data" },
    { label: "Dashboard Kurator", href: "/curator-dashboard" },
    { label: "Bantuan", href: "/help" },
  ],
  CONTRIBUTOR: [
    { label: "Beranda", href: "/" },
    { label: "Peta Sebaran", href: "/map" },
  ],
};

const ROLE_DISPLAY_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  CURATOR: "Kurator",
  EXP_USER: "Ahli",
  CONTRIBUTOR: "Kontributor",
};

function resolveRoleLinks(role: string): RoleNavLink[] {
  const normalized = role?.trim();
  if (!normalized) return DEFAULT_ROLE_LINKS;

  return (
    ROLE_NAV_LINKS[normalized] ||
    ROLE_NAV_LINKS[normalized.toUpperCase()] ||
    ROLE_NAV_LINKS[normalized.toLowerCase()] ||
    DEFAULT_ROLE_LINKS
  );
}

function formatRoleLabel(role?: string | null): string {
  if (!role) return "";
  const normalized = role.trim().toUpperCase();
  return ROLE_DISPLAY_LABELS[normalized] ?? role;
}

function RoleAccessMenu({ role }: Readonly<{ role: string }>) {
  const links = resolveRoleLinks(role);

  if (!links.length) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="hidden sm:flex items-center gap-1 rounded-md border border-[#0069cf] px-3 py-1 text-sm font-medium text-[#0069cf] transition-colors hover:bg-[#0069cf]/10 focus:outline-none focus:ring-2 focus:ring-[#0069cf] focus:ring-offset-2"
        aria-label="Halaman khusus peran"
      >
        <span>Akses Page</span>
        <ChevronDown className="h-4 w-4" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {links.map((item) =>
          item.disabled ? (
            <DropdownMenuItem key={item.label} disabled className="cursor-not-allowed justify-start text-gray-400">
              <div className="flex w-full flex-col">
                <span>{item.label}</span>
                <span className="text-xs text-gray-400">{item.description ?? "Segera hadir"}</span>
              </div>
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={item.label} asChild className="text-gray-700">
              <Link href={item.href} className="flex w-full items-center justify-between">
                <span>{item.label}</span>
                <ArrowUpRight className="h-4 w-4 text-[#0069cf]" aria-hidden="true" />
              </Link>
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

function NavbarContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    console.log('Login clicked');
    router.push('/login');
  };

  const handleRegister = () => {
    console.log('Register clicked');
    router.push('/register');
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-16 py-6 bg-white shadow-[0_5px_15px_rgba(0,0,0,0.3)] h-20">
      <div className="flex items-center h-20">
        <Image src="/logo-pantautular.svg" alt="PantauTular Logo" width={120} height={30} />
      </div>

      <div className="flex items-center gap-8 h-20">
        <div className="hidden md:flex items-center gap-20">
          <NavLink href="/" label="Beranda" />
          <NavLink href="/map" label="Peta Sebaran" />
          <NavLink href="/dashboard" label="Dashboard" />
          <NavLink href="/about" label="Tentang Kami" />
          <NavLink href="/help" label="Bantuan" />
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[#0f172a] font-medium select-none">
              {user.name}
              {user.role ? ` | ${formatRoleLabel(user.role)}` : ""}
            </span>
            <RoleAccessMenu role={user.role} />
            <ProfileIcon logout={logout}/>
          </div>
        ) : (
            <div className="flex items-center gap-4 pl-4">
              <button
                type="button"
                className="bg-white text-[#0069cf] px-6 py-2 rounded-md border-2 border-[#0069cf] mr-3 hover:bg-[#0069cf] hover:text-white transition-colors"
                onClick={handleLogin}
              >
                Masuk
              </button>
              <button
                type="button"
                className="bg-[#0069cf] text-white px-6 py-2 rounded-md border-2 border-transparent hover:bg-[#0056b3] transition-colors"
                onClick={handleRegister}
              >
                Register
              </button>
            </div>
        )}
      </div>
    </nav>
  );
}
