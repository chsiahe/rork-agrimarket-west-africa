import { publicProcedure } from "@/backend/trpc/create-context";
import { TRPCError } from "@trpc/server";

export default publicProcedure
  .query(async ({ ctx }) => {
    if (!ctx.supabase) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Service de base de données non disponible',
      });
    }

    try {
      const healthChecks = {
        database: false,
        auth: false,
        tables: false,
        policies: false,
        extensions: false,
      };

      // Test basic database connection
      try {
        const { data: dbTest, error: dbError } = await ctx.supabase
          .from('countries')
          .select('code')
          .limit(1);
        
        healthChecks.database = !dbError;
      } catch (error) {
        console.error('Database connection test failed:', error);
      }

      // Test auth service
      try {
        const { data: authTest, error: authError } = await ctx.supabase.auth.getSession();
        healthChecks.auth = !authError;
      } catch (error) {
        console.error('Auth service test failed:', error);
      }

      // Test table existence
      try {
        const { data: tablesTest, error: tablesError } = await ctx.supabase
          .rpc('check_table_exists', { table_name: 'users' });
        
        healthChecks.tables = !tablesError;
      } catch (error) {
        // Fallback: try to query users table directly
        try {
          const { error: usersError } = await ctx.supabase
            .from('users')
            .select('id')
            .limit(1);
          
          healthChecks.tables = !usersError || usersError.code === 'PGRST116';
        } catch (fallbackError) {
          console.error('Tables test failed:', error, fallbackError);
        }
      }

      // Test RLS policies (try to access without auth)
      try {
        const { data: rlsTest, error: rlsError } = await ctx.supabase
          .from('products')
          .select('id')
          .limit(1);
        
        // RLS should allow public read access to active products
        healthChecks.policies = !rlsError || rlsError.code !== 'PGRST301';
      } catch (error) {
        console.error('RLS policies test failed:', error);
      }

      // Test PostGIS extension
      try {
        const { data: extensionTest, error: extensionError } = await ctx.supabase
          .rpc('st_point', { x: 0, y: 0 });
        
        healthChecks.extensions = !extensionError;
      } catch (error) {
        // Fallback: check if we can query geometric data
        try {
          const { error: geoError } = await ctx.supabase
            .from('products')
            .select('coordinates')
            .limit(1);
          
          healthChecks.extensions = !geoError;
        } catch (fallbackError) {
          console.error('Extensions test failed:', error, fallbackError);
        }
      }

      // Calculate overall health score
      const healthScore = Object.values(healthChecks).filter(Boolean).length;
      const totalChecks = Object.keys(healthChecks).length;
      const healthPercentage = Math.round((healthScore / totalChecks) * 100);

      // Determine overall status
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthPercentage >= 80) {
        status = 'healthy';
      } else if (healthPercentage >= 50) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return {
        status,
        healthPercentage,
        timestamp: new Date().toISOString(),
        checks: healthChecks,
        message: status === 'healthy' 
          ? 'Tous les services fonctionnent correctement'
          : status === 'degraded'
          ? 'Certains services présentent des problèmes'
          : 'Services critiques indisponibles',
        details: {
          database: healthChecks.database ? 'Connexion réussie' : 'Échec de connexion',
          auth: healthChecks.auth ? 'Service d\'authentification actif' : 'Service d\'authentification indisponible',
          tables: healthChecks.tables ? 'Tables de base de données accessibles' : 'Tables de base de données inaccessibles',
          policies: healthChecks.policies ? 'Politiques RLS configurées' : 'Problème avec les politiques RLS',
          extensions: healthChecks.extensions ? 'Extensions PostGIS disponibles' : 'Extensions PostGIS indisponibles',
        }
      };

    } catch (error) {
      console.error('Health check failed:', error);
      
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Impossible de vérifier l\'état du système',
      });
    }
  });