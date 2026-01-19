const allowedOrigins = {
  development: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  production: [
    'https://grindmap.vercel.app',
    'https://www.grindmap.com'
  ]
};

const corsOptions = {
  origin: (origin, callback) => {
    const env = process.env.NODE_ENV || 'development';
    const allowed = allowedOrigins[env] || allowedOrigins.development;
    
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('CORS blocked origin:', origin);
      callback(new Error(`CORS policy violation: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};

export { corsOptions };