'use client';

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { User, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui-profile/dropdown-menu";
import PasswordSettings from "./password-settings";
import { useAuth } from '../auth/hooks/useAuth';

export default function Navbar() {
  return <NavbarContent />;
}

type ProfileIconProps = {
  logoutAction?: () => void;
  logout?: () => void;
};

export const ProfileIcon = ({ logoutAction, logout }: ProfileIconProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const resolvedLogout = logoutAction ?? logout ?? (() => {});

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
          <DropdownMenuItem onClick={resolvedLogout}>
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
  children?: RoleNavLink[];
};

const DEFAULT_ROLE_LINKS: RoleNavLink[] = [{ label: "Dashboard", href: "/dashboard" }];

const ROLE_NAV_LINKS: Record<string, RoleNavLink[]> = {
  ADMIN: [
    { label: "Dashboard Admin", href: "/admin-dashboard" },
    { label: "Manajemen Role", href: "/admin-role-management" },
    { label: "User Log", href: "/admin-user-log-menu" },
    { label: "Dashboard Kurator", href: "/curator-dashboard" },
    { label: "Dashboard Ahli", href: "/expert-dashboard" },

    {
      label: "Manajemen Data Kurator",
      href: "/curator-data-management",
      children: [
        { label: "Tambah Data", href: "/curator-add-data" },
        // 🔄 changed
        { label: "Lihat List Data", href: "/curator-data-management" },
      ],
    },
    {
      label: "Manajemen Data Ahli",
      href: "/expert-data-management",
      children: [
        { label: "Tambah data manual", href: "/curator-add-data" },
        // 🔄 changed
        { label: "Lihat List Data (CSV)", href: "/expert-data-management" },
        { label: "Lihat List Data", href: "/curator-data-management" },
        { label: "Tambah data melalui CSV", href: "/expert-bulk-upload" },
    
      ],
    },
  ],

  EXP_USER: [
    { label: "Dashboard Ahli", href: "/expert-dashboard" },
    {
      label: "Manajemen Data Ahli",
      href: "/expert-data-management",
      children: [
        { label: "Tambah data manual", href: "/curator-add-data" },
        // 🔄 changed
        { label: "Lihat List Data (CSV)", href: "/expert-data-management" },
        { label: "Lihat List Data", href: "/curator-data-management" },
        { label: "Tambah data melalui CSV", href: "/expert-bulk-upload" },
      ],
    },
    { label: "Bantuan", href: "/help" },
  ],

  CURATOR: [
    {
      label: "Manajemen Data Kurator",
      href: "/curator-data-management",
      children: [
        { label: "Tambah Data", href: "/curator-add-data" },
        // 🔄 changed
        { label: "Lihat List Data", href: "/curator-data-management" },
      ],
    },
    { label: "Dashboard Kurator", href: "/curator-dashboard" },
    { label: "Bantuan", href: "/help" },
  ],

  CONTRIBUTOR: [
    { label: "Tambah data", href: "/contributor-event-reporting" },
    { label: "Bantuan", href: "/help" },
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
    <div className="hidden sm:flex items-center relative group">
      <button
        className="text-[#0f172a] font-medium select-none flex items-center gap-2"
        aria-label="Akses Page"
        type="button"
      >
        <span>Akses Page</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="ml-1">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      <ul className="absolute top-5 left-0 z-50 block space-y-2 shadow-lg bg-white overflow-hidden min-w-[200px] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-[700px] px-4 group-hover:pb-4 group-hover:pt-4 transition-all duration-200">
        {links.map((item) => (
          <li key={item.label} className="border-b border-gray-200 last:border-b-0">
            {item.disabled ? (
              <div className="cursor-not-allowed justify-start text-gray-400 py-2 px-2 text-[15px]">
                <div className="flex w-full flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400">{item.description ?? "Segera hadir"}</span>
                </div>
              </div>
            ) : (
              <div className="py-2 px-2">
                <Link
                  href={item.href}
                  className="flex items-center justify-between hover:text-blue-700 text-slate-900 font-medium text-[15px]"
                >
                  <span>{item.label}</span>
                  {item.children && item.children.length > 0 && <ChevronDown className="h-4 w-4 text-gray-400" />}
                </Link>

                {item.children && item.children.length > 0 && (
                  <ul className="mt-1 pl-4">
                    {item.children.map((child) => (
                      <li key={child.label} className="py-1">
                        {child.disabled ? (
                          <div className="text-gray-400 text-sm">{child.label}</div>
                        ) : (
                          <Link href={child.href} className="text-[#0069cf] text-sm hover:underline">
                            {child.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CuratorDropdown({ name, role }: { name?: string | null; role?: string | null }) {
  const links = resolveRoleLinks(role || "");
  if (!links.length) return null;

  return (
    <div className="hidden sm:flex items-center relative group">
      <button
        className="text-[#0f172a] font-medium select-none flex items-center gap-2"
        aria-label="Kurator menu"
        type="button"
      >
        <span>{name}</span>
        <span className="text-sm text-gray-500">| {formatRoleLabel(role ?? "")}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="ml-1">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      <ul className="absolute top-5 left-0 z-50 block space-y-2 shadow-lg bg-white overflow-hidden min-w-[200px] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-[700px] px-4 group-hover:pb-4 group-hover:pt-4 transition-all duration-200">
        {links.map((item) => (
          <li key={item.label} className="border-b border-gray-200 last:border-b-0">
            {item.disabled ? (
              <div className="cursor-not-allowed justify-start text-gray-400 py-2 px-2 text-[15px]">
                <div className="flex w-full flex-col">
                  <span>{item.label}</span>
                  <span className="text-xs text-gray-400">{item.description ?? "Segera hadir"}</span>
                </div>
              </div>
            ) : (
              <div className="py-2 px-2">
                <Link
                  href={item.href}
                  className="flex items-center justify-between hover:text-blue-700 text-slate-900 font-medium text-[15px]"
                >
                  <span>{item.label}</span>
                  {item.children && item.children.length > 0 && <ChevronDown className="h-4 w-4 text-gray-400" />}
                </Link>

                {item.children && item.children.length > 0 && (
                  <ul className="mt-1 pl-4">
                    {item.children.map((child) => (
                      <li key={child.label} className="py-1">
                        {child.disabled ? (
                          <div className="text-gray-400 text-sm">{child.label}</div>
                        ) : (
                          <Link href={child.href} className="text-[#0069cf] text-sm hover:underline">
                            {child.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={`h-full flex items-center ${isActive ? "font-bold text-[#1e3a8a]" : "text-[#0069cf]"}`}>
      {label}
    </Link>
  );
};

function NavbarContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
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
            <CuratorDropdown name={user.name} role={user.role} />
            <ProfileIcon logoutAction={logout} />
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
