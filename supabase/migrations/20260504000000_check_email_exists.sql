-- Función RPC segura para verificar si un email existe y está confirmado en auth.users
-- Retorna true solo si el email existe Y está confirmado (email_confirmed_at IS NOT NULL)

CREATE OR REPLACE FUNCTION check_email_exists(p_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = p_email AND email_confirmed_at IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anonymous users (for registration flow)
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO authenticated;