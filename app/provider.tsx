"use client"

import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useUser } from '@clerk/nextjs'
import { UserDetailContext } from '@/context/UserDetailContext'
import { UserDetail } from '@/types/types'

function Provider( { 
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    
    const { user } = useUser();
    const [userDetails, setUserDetails] = useState<UserDetail | null>(null);

    useEffect(() => {
        if (!user) return;
        let isMounted = true;

        const initUser = async () => {
            try {
                const result = await axios.post('/api/users', {});
                if (isMounted) {
                    setUserDetails(result.data.user);
                }
            } catch (error) {
                console.error('Error initializing user details:', error);
            }
        };

        initUser();

        return () => {
            isMounted = false;
        };
    }, [user]);

  return (
    <div>
      <UserDetailContext.Provider value={{ userDetails, setUserDetails }}>
        {children}
      </UserDetailContext.Provider>
    </div>
  )
}

export default Provider