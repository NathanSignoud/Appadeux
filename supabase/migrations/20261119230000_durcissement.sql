-- Audit de sécurité final : par principe, aucune fonction publique n'est exécutable sans être connecté.
revoke execute on function public.current_week_start() from public, anon;
grant execute on function public.current_week_start() to authenticated;
