import { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'pharmacist' | 'warehouse';
  ubsId?: string;
  ubsName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userRole: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  userRole: null,
  login: async () => false,
  logout: () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('med_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('med_user');
      }
    }
  }, []);

  // Mock login function
  const login = async (email: string, password: string): Promise<boolean> => {
    // For demo purposes, hardcoded users
    // In a real app, this would call an API
    const mockUsers = [
      {
        id: 'admin1',
        name: 'João Silva',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin' as const,
      },
      {
        id: 'pharm1',
        name: 'Maria Souza',
        email: 'farmacia@example.com',
        password: 'pharma123',
        role: 'pharmacist' as const,
        ubsId: 'ubs1',
        ubsName: 'UBS Centro',
      },
      {
        id: 'warehouse1',
        name: 'Pedro Santos',
        email: 'almoxarifado@example.com',
        password: 'warehouse123',
        role: 'warehouse' as const,
      },
    ];

    const foundUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (foundUser) {
      // Remove password before storing
      const { password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      setIsAuthenticated(true);
      localStorage.setItem('med_user', JSON.stringify(userWithoutPassword));
      return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('med_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        userRole: user?.role || null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};