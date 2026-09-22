"use client"
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { SignInButton, SignedOut, SignedIn } from '@clerk/nextjs';

const MenuOptions = [
  {
    name: 'Pricing',
    path: '/pricing',
  },
  {
    name: 'Contact',
    path: '/contact',
  },
];

function Header() {
  return (
    <div className='relative flex items-center justify-between p-4 shadow'>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="Logo" width={35} height={35} />
        <h2 className="text-xl font-bold">AI Website Generator</h2>
      </Link>

      {/* Menu Items - Centered */}
      <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-3'>
        {MenuOptions.map((menu, index) => (
          <Link href={menu.path} key={index}>
            <Button variant="ghost">
              {menu.name}
            </Button>
          </Link>
        ))}
      </div>
      
      {/* Get Started Button */}
      <div className="flex items-center">
        <SignedOut>
          <SignInButton mode='modal' forceRedirectUrl='/workspace'>
            <Button>Get Started <ArrowRight /></Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/workspace">
            <Button>Get Started <ArrowRight /></Button>
          </Link>
        </SignedIn>
      </div>
    </div>
  );
}

export default Header;
