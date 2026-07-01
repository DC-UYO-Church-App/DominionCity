'use client';

/* Mounts the optional enhancement layer (scroll reveals + deferred smooth
   scroll). The site is complete and legible before this runs; see enhance.ts. */
import { useEffect } from 'react';
import { runEnhance } from '@/scripts/enhance';

export default function Enhance() {
  useEffect(() => {
    runEnhance();
  }, []);
  return null;
}
