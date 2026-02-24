import { LayoutDashboard, Building2, DollarSign, LogOut } from 'lucide-react';
import { useRealAuth } from '@/contexts/RealAuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface AffiliateSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'overview', title: 'Visão Geral', icon: LayoutDashboard },
  { id: 'companies', title: 'Empresas Indicadas', icon: Building2 },
  { id: 'commissions', title: 'Comissões', icon: DollarSign },
];

export const AffiliateSidebar = ({ activeTab, onTabChange }: AffiliateSidebarProps) => {
  const { signOut } = useRealAuth();

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Painel do Afiliado</h2>
            <SidebarTrigger />
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={activeTab === item.id ? 'bg-primary/10 text-primary' : ''}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={signOut} className="text-destructive hover:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
