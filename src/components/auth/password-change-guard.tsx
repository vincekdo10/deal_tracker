'use client';

import { useState, useEffect } from 'react';
import { ChangePasswordModal } from '@/components/modals/change-password-modal';
import { User } from '@/types';

interface PasswordChangeGuardProps {
  children: React.ReactNode;
  user: User | null;
}

export function PasswordChangeGuard({ children, user }: PasswordChangeGuardProps) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    // Check if user has a temporary password or has never changed their password
    if (user && user.isTemporaryPassword) {
      setShowPasswordModal(true);
    }
  }, [user]);

  const handlePasswordChanged = () => {
    setShowPasswordModal(false);
    // Refresh the page to update user data
    window.location.reload();
  };

  return (
    <>
      {children}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => {}} // Don't allow closing without changing password
        onPasswordChanged={handlePasswordChanged}
      />
    </>
  );
}
