import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import api from '../../lib/axios';

// 1. Updated Schema to match Backend DTO
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['ORGANIZER', 'STUDENT'], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'STUDENT' // Default role
    }
  });

  const onSubmit = async (values) => {
    setServerError('');
    try {
      // 2. Payload now matches RegisterRequest exactly
      const payload = {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role // Backend expects UserRole enum string
      };
      
      await api.post('/auth/register', payload);
      navigate('/login');
    } catch (error) {
      setServerError(error.message || 'Registration failed.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-[#1f5f89] p-8 text-center text-white">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-blue-100">Extracurricular Management System</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            
            {/* Split Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">First Name</label>
                <input
                  {...register('firstName')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
                />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Last Name</label>
                <input
                  {...register('lastName')}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
                />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                {...register('email')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">I am a...</label>
              <select 
                {...register('role')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
              >
                <option value="STUDENT">Student (Attendee)</option>
                <option value="ORGANIZER">Organizer</option>
              </select>
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                {...register('password')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-1 focus:ring-[#1f5f89] outline-none"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            {serverError && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 w-full rounded-lg bg-[#1f5f89] py-2.5 text-sm font-semibold text-white hover:bg-[#164565] disabled:opacity-70 transition"
            >
              {isSubmitting ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#1f5f89] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
