// components/Navigation.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setUserRole(profile?.role || null);
      }
    };

    getProfile();
  }, []);

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      {userRole === 'admin' && (
        <Link to="/admin">Admin Panel</Link>
      )}
      <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
    </nav>
  );
};

export default Navigation;