import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

/**
 * OAuth Callback Handler Component
 * Handles OAuth redirects and extracts session information
 */
export default function OAuthCallback({ onSuccess, onError }) {
  const [status, setStatus] = useState('processing'); // processing, success, error

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the hash from URL (OAuth tokens are in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Also check query params as fallback
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check if this is an OAuth callback
        if (hashParams.get('access_token') || queryParams.get('code')) {
          // Get the session after OAuth redirect
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting OAuth session:', sessionError);
            setStatus('error');
            onError?.(sessionError);
            return;
          }
          
          if (session?.user) {
            // Extract email from user data
            const userEmail = session.user.email || 
                           session.user.user_metadata?.email ||
                           session.user.user_metadata?.full_name?.split(' ')[0] + '@gmail.com';
            
            if (userEmail) {
              setStatus('success');
              onSuccess?.({
                session,
                user: session.user,
                email: userEmail,
              });
            } else {
              setStatus('error');
              onError?.(new Error('No email found in OAuth session'));
            }
          } else {
            setStatus('error');
            onError?.(new Error('No session found'));
          }
        } else {
          setStatus('error');
          onError?.(new Error('Not an OAuth callback'));
        }
      } catch (error) {
        console.error('Error handling OAuth callback:', error);
        setStatus('error');
        onError?.(error);
      }
    };

    handleOAuthCallback();
  }, [onSuccess, onError]);

  if (status === 'processing') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Processing Authentication</h2>
          <p className="text-gray-600">Please wait while we sign you in...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-400 via-orange-500 to-amber-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          <div className="bg-red-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">✕</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-6">There was an error signing you in. Please try again.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="rounded-xl bg-orange-600 px-6 py-3 font-semibold text-white hover:bg-orange-700 transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

