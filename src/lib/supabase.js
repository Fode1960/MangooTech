// Configuration Supabase pour MangooTech
export const supabase = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => ({
        eq: () => Promise.resolve({ data: [], error: null })
      }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => Promise.resolve({ data: null, error: null }),
    delete: () => Promise.resolve({ data: null, error: null })
  })
};

export default supabase;