'use client';

import { Bell, Search, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useStaffNotifications } from '@/modules/system/staff-notifications/hooks/useStaffNotifications';
import { auditLogsApi } from '@/modules/system/audit-logs/api';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { setTheme, theme } = useTheme();
  const { notifications } = useStaffNotifications();

  const handleLogout = async () => {
    if (user) {
      await auditLogsApi.logAction({
        adminId: user.id,
        adminName: user.name,
        action: 'LOGOUT',
        moduleAffected: 'System',
        details: 'User logged out',
        ipAddress: '127.0.0.1' // Mock IP
      });
    }
    logout();
    router.replace('/login');
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <Button variant="outline" className="w-full max-w-sm justify-start text-muted-foreground hidden md:flex" onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
          <Search className="mr-2 h-4 w-4" />
          <span>Search (Cmd+K)...</span>
        </Button>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger className={`${buttonVariants({ variant: 'ghost', size: 'icon' })} relative outline-none cursor-pointer`}>
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive"></span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">No new notifications</div>
            ) : (
              <DropdownMenuGroup>
                {notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="cursor-pointer p-0">
                    <Link href={notif.href} className="flex flex-col items-start gap-1 p-3 w-full">
                      <span className="text-sm font-medium">{notif.title}</span>
                      <span className="text-xs text-muted-foreground">{notif.description}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="relative h-8 w-8 rounded-full outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  {user?.roles && user.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.roles.map(role => (
                        <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                          {role.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="p-0">
                <Link href="/profile" className="cursor-pointer flex w-full px-2 py-1.5">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
