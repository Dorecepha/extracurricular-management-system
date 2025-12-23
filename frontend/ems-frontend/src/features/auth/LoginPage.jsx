import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { authApi } from './api';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/dashboard';
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const payload = await authApi.login(values);
      const { token, role, user, id, userID } = payload || {};
      if (!token) {
        setServerError('Login succeeded but no token was returned.');
        return;
      }

      localStorage.clear();
      const normalizedUser = user
        ? { ...user, userID: user.userID || user.id }
        : { userID: userID || id, role };

      localStorage.setItem('token', token);
      localStorage.setItem('userRole', role || normalizedUser?.role || 'USER'); 
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      
      navigate(from, { replace: true });
    } catch (error) {
      setServerError(error.message || 'Unable to sign in.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-[#1f5f89] p-8 text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="mt-2 text-blue-100">Extracurricular Management System</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
              <input
                id="email"
                type="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-[#1f5f89] focus:outline-none focus:ring-1 focus:ring-[#1f5f89]"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
              <input
                id="password"
                type="password"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-[#1f5f89] focus:outline-none focus:ring-1 focus:ring-[#1f5f89]"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#1f5f89] py-2.5 text-sm font-semibold text-white hover:bg-[#164565] disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need an account?{' '}
            <Link to="/register" className="font-semibold text-[#1f5f89] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
