export const environment = {
  production: true,
  
  // Configuración de Supabase
  supabase: {
    url: 'https://gyhzptzltqrxvgmwmkzm.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5aHpwdHpsdHFyeHZnbXdta3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwODAyOTgsImV4cCI6MjA3NTY1NjI5OH0.rSrOQ4NWvwEU0Ec2HJTNYtpV7vp_0limf5Naf4ow7LM'
  },
  
  // Configuración de Gemini AI
  gemini: {
    apiKey: 'AIzaSyAeA9QPqiZjt5UjYDDcsqu04BF9y0WociY'
  },
  
  // Configuración de Mercado Pago
  mercadoPago: {
    publicKey: 'APP_USR-4e0509b7-6b19-411f-b7a3-1afcfe625244',
    useSandbox: true // Cambiar a false para producción real
  }
};
